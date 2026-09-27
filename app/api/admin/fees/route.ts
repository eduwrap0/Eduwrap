import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { sendFeeReceiptEmail } from "@/lib/email";
import { generateFeeReceiptPdf } from "@/lib/fee-receipt";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { createReceiptId, toFeePaymentRecord } from "@/lib/fees";
import { createFeePaymentSchema, feeListQuerySchema } from "@/lib/validators/fees";
import { FeePayment } from "@/models/FeePayment";
import { User } from "@/models/User";

export const runtime = "nodejs";

function escapedRegex(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function isDuplicateKey(error: unknown): error is { code: number; keyPattern?: Record<string, number> } {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = createFeePaymentSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    await connectMongoDB();
    const existing = await FeePayment.findOne({ idempotencyKey: parsed.data.idempotencyKey });
    if (existing) return apiSuccess("Fee payment was already recorded", { payment: toFeePaymentRecord(existing, auth.user.name), duplicate: true });

    const student = await User.findOne({ _id: parsed.data.studentId, role: "student" }).select("name email studentId fatherName phone course courses facultyId facultyIds");
    if (!student) return apiError("Student not found", 404);
    const studentCourses = student.courses?.length ? student.courses : student.course ? [student.course] : [];
    if (parsed.data.courses.some((course) => !studentCourses.includes(course))) return apiError("One or more selected courses are not assigned to this student", 400);
    const studentFacultyIds = new Set([...(student.facultyIds || []).map(String), ...(student.facultyId ? [student.facultyId.toString()] : [])]);
    if (!studentFacultyIds.has(parsed.data.facultyId)) return apiError("Selected faculty member is not assigned to this student", 400);
    const selectedFaculty = await User.findOne({ _id: parsed.data.facultyId, role: "faculty", isActive: true }).select("name");
    if (!selectedFaculty) return apiError("Selected faculty member is not available", 400);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const payment = await FeePayment.create({
          receiptId: createReceiptId(),
          student: student._id,
          studentId: student.studentId || student._id.toString(),
          studentName: student.name,
          courses: parsed.data.courses,
          faculty: selectedFaculty._id,
          facultyName: selectedFaculty.name,
          paymentDate: new Date(`${parsed.data.paymentDate}T00:00:00.000Z`),
          amount: parsed.data.amount,
          paymentMode: parsed.data.paymentMode,
          status: "paid",
          createdBy: auth.user._id,
          idempotencyKey: parsed.data.idempotencyKey,
        });
        auditSecurityEvent("fee_payment_created", auth.user._id.toString(), payment._id.toString());
        let emailSent = false;
        try {
          const receipt = await generateFeeReceiptPdf({
            receiptId: payment.receiptId,
            studentId: payment.studentId,
            studentName: payment.studentName,
            fatherName: student.fatherName,
            studentPhone: student.phone,
            courses: payment.courses?.length ? payment.courses : studentCourses,
            paymentDate: payment.paymentDate,
            amount: payment.amount,
            paymentMode: payment.paymentMode,
            recordedBy: auth.user.name,
            generatedAt: new Date(),
          });
          emailSent = await sendFeeReceiptEmail({
            name: student.name,
            email: student.email,
            receiptId: payment.receiptId,
            amount: payment.amount,
            paymentDate: payment.paymentDate,
            paymentMode: payment.paymentMode,
            receipt,
          });
        } catch (error) {
          console.error(JSON.stringify({ type: "fee_receipt_email_error", name: error instanceof Error ? error.name : "UnknownError" }));
        }
        return apiSuccess("Fee payment recorded successfully", { payment: toFeePaymentRecord(payment, auth.user.name), duplicate: false, emailSent }, 201);
      } catch (error) {
        if (!isDuplicateKey(error)) throw error;
        if (error.keyPattern?.idempotencyKey) {
          const duplicate = await FeePayment.findOne({ idempotencyKey: parsed.data.idempotencyKey });
          if (duplicate) return apiSuccess("Fee payment was already recorded", { payment: toFeePaymentRecord(duplicate, auth.user.name), duplicate: true });
        }
        if (!error.keyPattern?.receiptId || attempt === 3) throw error;
      }
    }
    return apiError("Unable to create a unique receipt", 500);
  } catch {
    return apiError("Unable to record fee payment", 500);
  }
}

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  const parsed = feeListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return validationError(parsed.error);

  try {
    await connectMongoDB();
    const { page, limit, search, paymentMode, facultyId, dateFrom, dateTo } = parsed.data;
    const filter: Record<string, unknown> = {};
    const conditions: Array<Record<string, unknown>> = [];
    let selectedFaculty: { id: string; name: string; assignedStudentCount: number } | undefined;
    if (paymentMode !== "all") filter.paymentMode = paymentMode;
    if (facultyId) {
      const faculty = await User.findOne({ _id: facultyId, role: "faculty" }).select("name");
      if (!faculty) return apiError("Faculty member not found", 404);
      const assignedStudents = await User.find({ role: "student", $or: [{ facultyIds: facultyId }, { facultyId }] }).distinct("_id");
      conditions.push({ $or: [{ faculty: faculty._id }, { faculty: { $exists: false }, student: { $in: assignedStudents } }] });
      selectedFaculty = { id: faculty._id.toString(), name: faculty.name, assignedStudentCount: assignedStudents.length };
    }
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
    const studentObjectIds = [...new Set(payments.map((payment) => payment.student.toString()))];
    const [admins, students] = await Promise.all([
      adminIds.length ? User.find({ _id: { $in: adminIds }, role: "admin" }).select("name") : [],
      studentObjectIds.length ? User.find({ _id: { $in: studentObjectIds }, role: "student" }).select("facultyIds facultyId") : [],
    ]);
    const adminNames = new Map(admins.map((admin) => [admin._id.toString(), admin.name]));
    const assignedFacultyIds = [...new Set(students.flatMap((student) => [...(student.facultyIds || []).map(String), ...(student.facultyId ? [student.facultyId.toString()] : [])]))];
    const faculty = assignedFacultyIds.length ? await User.find({ _id: { $in: assignedFacultyIds }, role: "faculty" }).select("name") : [];
    const facultyNames = new Map(faculty.map((item) => [item._id.toString(), item.name]));
    const studentFaculty = new Map(students.map((student) => {
      const ids = [...new Set([...(student.facultyIds || []).map(String), ...(student.facultyId ? [student.facultyId.toString()] : [])])];
      return [student._id.toString(), ids.flatMap((id) => facultyNames.has(id) ? [facultyNames.get(id)!] : [])];
    }));

    return apiSuccess("Fee payments retrieved", {
      payments: payments.map((payment) => ({ ...toFeePaymentRecord(payment, adminNames.get(payment.createdBy.toString()) || "Administrator"), facultyNames: payment.facultyName ? [payment.facultyName] : studentFaculty.get(payment.student.toString()) || [] })),
      totalAmount: totals[0]?.totalAmount || 0,
      selectedFaculty,
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
    return apiError("Unable to retrieve fee payments", 500);
  }
}
