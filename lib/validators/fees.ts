import { z } from "zod";
import { objectIdSchema } from "@/lib/validators/auth";

function todayInIndia(): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export const paymentModeSchema = z.enum(["cash", "upi", "online"]);

export const createFeePaymentSchema = z.object({
  studentId: objectIdSchema,
  facultyId: objectIdSchema,
  courses: z.array(z.string().trim().min(1).max(100)).min(1, "Select at least one course.").max(20).refine((courses) => new Set(courses).size === courses.length, "Courses must be unique."),
  paymentDate: z.iso.date().refine((value) => value <= todayInIndia(), "Payment date cannot be in the future."),
  amount: z.coerce.number().finite().positive("Amount must be greater than ₹0.").max(100000000, "Amount is too large."),
  paymentMode: paymentModeSchema,
  idempotencyKey: z.uuid(),
}).strict();

export const feeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).default(""),
  paymentMode: z.union([paymentModeSchema, z.literal("all")]).default("all"),
  facultyId: z.union([objectIdSchema, z.literal("")]).default(""),
  dateFrom: z.union([z.iso.date(), z.literal("")]).default(""),
  dateTo: z.union([z.iso.date(), z.literal("")]).default(""),
}).strict().refine((data) => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo, { message: "From date cannot be after to date.", path: ["dateTo"] });

export const feeHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
}).strict();

export const studentFeeSearchSchema = z.object({
  q: z.string().trim().min(2, "Enter at least 2 characters.").max(100),
  limit: z.coerce.number().int().min(1).max(20).default(10),
}).strict();
