import assert from "node:assert/strict";
import test from "node:test";
import { createFeePaymentSchema, feeListQuerySchema, studentFeeSearchSchema } from "../lib/validators/fees";

const validPayment = {
  studentId: "507f1f77bcf86cd799439011",
  facultyId: "507f191e810c19729de860ea",
  courses: ["Full Stack Web Development", "Next.js"],
  paymentDate: "2026-08-08",
  amount: 1500,
  paymentMode: "upi",
  idempotencyKey: "d9428888-122b-11e1-b85c-61cd3cbb3210",
};

test("fee submission validates required secure payment fields", () => {
  assert.equal(createFeePaymentSchema.safeParse(validPayment).success, true);
  assert.equal(createFeePaymentSchema.safeParse({ ...validPayment, amount: 0 }).success, false);
  assert.equal(createFeePaymentSchema.safeParse({ ...validPayment, amount: -10 }).success, false);
  assert.equal(createFeePaymentSchema.safeParse({ ...validPayment, paymentMode: "card" }).success, false);
  assert.equal(createFeePaymentSchema.safeParse({ ...validPayment, paymentDate: "2999-01-01" }).success, false);
  assert.equal(createFeePaymentSchema.safeParse({ ...validPayment, courses: [] }).success, false);
  assert.equal(createFeePaymentSchema.safeParse({ ...validPayment, facultyId: "invalid" }).success, false);
  assert.equal(createFeePaymentSchema.safeParse({ ...validPayment, courses: ["Next.js", "Next.js"] }).success, false);
  assert.equal(createFeePaymentSchema.safeParse({ ...validPayment, role: "admin" }).success, false);
});

test("fee history filters validate mode, dates, and pagination", () => {
  const parsed = feeListQuerySchema.parse({ page: "2", paymentMode: "cash", dateFrom: "2026-08-01", dateTo: "2026-08-31" });
  assert.equal(parsed.page, 2);
  assert.equal(parsed.limit, 20);
  assert.equal(parsed.paymentMode, "cash");
  assert.equal(parsed.facultyId, "");
  assert.equal(feeListQuerySchema.safeParse({ facultyId: "507f1f77bcf86cd799439011" }).success, true);
  assert.equal(feeListQuerySchema.safeParse({ facultyId: "invalid" }).success, false);
  assert.equal(feeListQuerySchema.safeParse({ paymentMode: "cheque" }).success, false);
  assert.equal(feeListQuerySchema.safeParse({ dateFrom: "2026-09-01", dateTo: "2026-08-01" }).success, false);
});

test("backend student fee search requires a useful query", () => {
  assert.equal(studentFeeSearchSchema.safeParse({ q: "Ra" }).success, true);
  assert.equal(studentFeeSearchSchema.safeParse({ q: "R" }).success, false);
  assert.equal(studentFeeSearchSchema.safeParse({ q: "Rahul", limit: 100 }).success, false);
});
