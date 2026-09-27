import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi } from "@/lib/auth";
import { buildFacultyPaymentAccessConditions } from "@/lib/faculty-fee-access";
import { toFeePaymentRecord } from "@/lib/fees";
import { connectMongoDB } from "@/lib/mongodb";
import { feeListQuerySchema } from "@/lib/validators/fees";
import { FeePayment } from "@/models/FeePayment";
import { User } from "@/models/User";

export const runtime = "nodejs";

function escapedRegex(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request, "faculty");
  if (!auth.ok) return auth.response;
  const parsed = feeListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return validationError(parsed.error);
  if (parsed.data.facultyId) return apiError("Faculty scope cannot be changed", 403);

  try {
    await connectMongoDB();
    const currentAssignment = { role: "student" as const, $or: [{ facultyIds: auth.user._id }, { facultyId: auth.user._id }] };

    // Legacy assignments did not have timestamps. Establish a privacy-safe cutoff now,
    // ensuring no earlier fee transaction becomes visible to the faculty member.
    const legacyCutoff = new Date();
    await User.updateMany(
      { ...currentAssignment, facultyAssignments: { $not: { $elemMatch: { facultyId: auth.user._id } } } },
      { $push: { facultyAssignments: { facultyId: auth.user._id, assignedAt: legacyCutoff } } },
    );

    const students = await User.find(currentAssignment).select("facultyAssignments");
    const accessConditions = buildFacultyPaymentAccessConditions(students, auth.user._id.toString());


    const { page, limit, search, paymentMode, dateFrom, dateTo } = parsed.data;
    const filter: Record<string, unknown> = {};
    const conditions: Array<Record<string, unknown>> = [];
    conditions.push({
      $or: [
        { faculty: auth.user._id },
        ...(accessConditions.length ? [{ $and: [{ faculty: { $exists: false } }, { $or: accessConditions }] }] : []),
      ],
    });
    if (paymentMode !== "all") filter.paymentMode = paymentMode;
    if (dateFrom || dateTo) {
      filter.paymentDate = {
        ...(dateFrom ? { $gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}),
        ...(dateTo ? { $lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
      };
    }
    if (search) {
      const regex = escapedRegex(search);
      conditions.push({ $or: [{ studentName: regex }, { studentId: regex }, { receiptId: regex }] });
    }
    if (conditions.length) filter.$and = conditions;

    const [payments, total, totals] = await Promise.all([
      FeePayment.find(filter).sort({ paymentDate: -1, createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
      FeePayment.countDocuments(filter),
      FeePayment.aggregate<{ totalAmount: number }>([{ $match: filter }, { $group: { _id: null, totalAmount: { $sum: "$amount" } } }]),
    ]);
    const adminIds = [...new Set(payments.map((payment) => payment.createdBy.toString()))];
    const admins = adminIds.length ? await User.find({ _id: { $in: adminIds }, role: "admin" }).select("name") : [];
    const adminNames = new Map(admins.map((admin) => [admin._id.toString(), admin.name]));

    return apiSuccess("Assigned student fee payments retrieved", {
      payments: payments.map((payment) => toFeePaymentRecord(payment, adminNames.get(payment.createdBy.toString()) || "Administrator")),
      totalAmount: totals[0]?.totalAmount || 0,
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
    return apiError("Unable to retrieve assigned student fee payments", 500);
  }
}
