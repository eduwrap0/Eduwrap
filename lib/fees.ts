import "server-only";
import { randomBytes } from "node:crypto";
import type { FeePaymentDocument } from "@/models/FeePayment";
import type { FeePaymentRecord } from "@/types/fees";

export function createReceiptId(date = new Date()): string {
  return `EWR-${date.getUTCFullYear()}-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export function toFeePaymentRecord(payment: FeePaymentDocument, recordedBy: string): FeePaymentRecord {
  return {
    id: payment._id.toString(),
    receiptId: payment.receiptId,
    studentId: payment.studentId,
    studentName: payment.studentName,
    ...(payment.courses?.length ? { course: payment.courses.join(", ") } : payment.course ? { course: payment.course } : {}),
    ...(payment.courses?.length ? { courses: payment.courses } : {}),
    ...(payment.faculty ? { facultyId: payment.faculty.toString() } : {}),
    ...(payment.facultyName ? { facultyName: payment.facultyName } : {}),
    studentObjectId: payment.student.toString(),
    paymentDate: payment.paymentDate.toISOString().slice(0, 10),
    amount: payment.amount,
    paymentMode: payment.paymentMode,
    status: payment.status,
    recordedBy,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}
