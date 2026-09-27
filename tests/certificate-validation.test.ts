import assert from "node:assert/strict";
import test from "node:test";
import { certificateVerificationSchema } from "@/lib/validators/certificate";

test("certificate verification normalizes valid certificate numbers", () => {
  const result = certificateVerificationSchema.parse({ certificateNumber: "  ewcti/2026/abc123  " });
  assert.equal(result.certificateNumber, "EWCTI/2026/ABC123");
});

test("certificate verification rejects malformed and extra input", () => {
  assert.equal(certificateVerificationSchema.safeParse({ certificateNumber: "bad number" }).success, false);
  assert.equal(certificateVerificationSchema.safeParse({ certificateNumber: "<script>" }).success, false);
  assert.equal(certificateVerificationSchema.safeParse({ certificateNumber: "EWCTI/2026/ABC123", role: "admin" }).success, false);
});

