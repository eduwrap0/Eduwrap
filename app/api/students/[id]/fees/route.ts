import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi } from "@/lib/auth";
import { toFeePaymentRecord } from "@/lib/fees";
import { connectMongoDB } from "@/lib/mongodb";
import { feeHistoryQuerySchema } from "@/lib/validators/fees";
import { objectIdSchema } from "@/lib/validators/auth";
import { FeePayment } from "@/models/FeePayment";
import { User } from "@/models/User";

interface RouteContext { params: Promise<{ id: string }> }

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await authorizeApi(request);
  if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id);
  if (!id.success) return validationError(id.error);
  if (auth.user.role !== "admin" && !(auth.user.role === "student" && auth.user._id.toString() === id.data)) {
    return apiError("You do not have permission to view this fee history", 403);
  }
  const query = feeHistoryQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!query.success) return validationError(query.error);

  try {
    await connectMongoDB();
    const student = await User.findOne({ _id: id.data, role: "student" }).select("name studentId totalFee");
    if (!student) return apiError("Student not found", 404);
    const { page, limit } = query.data;
    const filter = { student: student._id };
    const [payments, total, totals] = await Promise.all([
      FeePayment.find(filter).sort({ paymentDate: -1, createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
      FeePayment.countDocuments(filter),
      FeePayment.aggregate<{ totalAmount: number }>([{ $match: filter }, { $group: { _id: null, totalAmount: { $sum: "$amount" } } }]),
    ]);
    const adminIds = [...new Set(payments.map((payment) => payment.createdBy.toString()))];
    const admins = adminIds.length ? await User.find({ _id: { $in: adminIds }, role: "admin" }).select("name") : [];
    const names = new Map(admins.map((admin) => [admin._id.toString(), admin.name]));
    const totalPaid = totals[0]?.totalAmount || 0;

    return apiSuccess("Student fee history retrieved", {
      student: { id: student._id.toString(), name: student.name, studentId: student.studentId || student._id.toString(), totalFee: student.totalFee },
      payments: payments.map((payment) => toFeePaymentRecord(payment, names.get(payment.createdBy.toString()) || "Administrator")),
      totalPaid,
      balance: student.totalFee === undefined ? null : Math.max(0, student.totalFee - totalPaid),
      pagination: {
        page,
        limit,
        totalPayments: total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch {
    return apiError("Unable to retrieve student fee history", 500);
  }
}