import type { NextRequest } from "next/server";
import { apiError, validationError } from "@/lib/api-response";
import { authorizeApi } from "@/lib/auth";
import { generateFeeReceiptPdf } from "@/lib/fee-receipt";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
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

  try {
    await connectMongoDB();
    const payment = await FeePayment.findById(id.data);
    if (!payment) return apiError("Fee receipt not found", 404);
    const student = await User.findOne({ _id: payment.student, role: "student" }).select("name studentId fatherName phone course courses facultyId facultyIds facultyAssignments");
    if (!student) return apiError("Student not found", 404);

    if (auth.user.role === "student" && auth.user._id.toString() !== payment.student.toString()) {
      return apiError("You can only download your own fee receipts", 403);
    }
    if (auth.user.role === "faculty") {
      const facultyId = auth.user._id.toString();
      if (payment.faculty) {
        if (payment.faculty.toString() !== facultyId) return apiError("You do not have permission to download this fee receipt", 403);
      } else {
        const currentlyAssigned = student.facultyIds?.some((value) => value.toString() === facultyId) || student.facultyId?.toString() === facultyId;
        const assignment = student.facultyAssignments?.find((value) => value.facultyId.toString() === facultyId);
        if (!currentlyAssigned || !assignment || payment.createdAt < assignment.assignedAt) return apiError("You do not have permission to download this fee receipt", 403);
      }
    }

    const recorder = await User.findById(payment.createdBy).select("name");
    const courses = student.courses?.length ? student.courses : student.course ? [student.course] : [];
    const pdf = await generateFeeReceiptPdf({
      receiptId: payment.receiptId,
      studentId: payment.studentId,
      studentName: payment.studentName,
      fatherName: student.fatherName,
      studentPhone: student.phone,
      courses: payment.courses?.length ? payment.courses : payment.course ? [payment.course] : courses,
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      paymentMode: payment.paymentMode,
      recordedBy: recorder?.name || "Administrator",
      generatedAt: new Date(),
    });
    auditSecurityEvent("fee_receipt_downloaded", auth.user._id.toString(), payment._id.toString());
    const filename = `EduWrap-Fee-Receipt-${payment.receiptId.replace(/[^a-zA-Z0-9_-]+/g, "-")}.pdf`;
    return new Response(Buffer.from(pdf), { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return apiError("Unable to generate fee receipt", 500);
  }
}
