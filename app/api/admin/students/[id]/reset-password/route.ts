import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { checkRateLimit, recordRateLimitFailure } from "@/lib/rate-limit";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema, resetPasswordSchema } from "@/lib/validators/auth";
import { User } from "@/models/User";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id);
  if (!id.success) return validationError(id.error);

  const rateIdentity = auth.user._id.toString();
  const limit = await checkRateLimit("password-reset", rateIdentity);
  if (!limit.allowed) {
    const response = apiError("Too many password resets. Please try again later.", 429);
    response.headers.set("Retry-After", String(limit.retryAfter));
    return response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request", 400);
  }
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    await connectMongoDB();
    const password = await bcrypt.hash(parsed.data.password, 12);
    const student = await User.findOneAndUpdate(
      { _id: id.data, role: "student", ...(auth.user.role === "faculty" ? { $or: [{ facultyIds: auth.user._id }, { facultyId: auth.user._id }] } : {}) },
      { $set: { password, passwordChangedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!student) return apiError("Student not found", 404);
    await recordRateLimitFailure("password-reset", rateIdentity);
    auditSecurityEvent("student_password_reset", auth.user._id.toString(), student._id.toString());
    return apiSuccess("Student password reset successfully", null);
  } catch {
    return apiError("Unable to reset student password", 500);
  }
}
