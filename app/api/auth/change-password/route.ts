import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/jwt";
import { checkRateLimit, recordRateLimitFailure } from "@/lib/rate-limit";
import { auditSecurityEvent } from "@/lib/security-audit";
import { changeOwnPasswordSchema } from "@/lib/validators/auth";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, ["admin", "faculty", "student"]);
  if (!auth.ok) return auth.response;
  const rateIdentity = auth.user._id.toString();
  const limit = await checkRateLimit("own-password-change", rateIdentity);
  if (!limit.allowed) {
    const response = apiError("Too many password attempts. Please try again later.", 429);
    response.headers.set("Retry-After", String(limit.retryAfter));
    return response;
  }

  let body: unknown;
  try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = changeOwnPasswordSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const user = await User.findById(auth.user._id).select("+password");
    if (!user) return apiError("Account not found", 404);
    if (!await bcrypt.compare(parsed.data.currentPassword, user.password)) {
      await recordRateLimitFailure("own-password-change", rateIdentity);
      return apiError("Current password is incorrect", 400);
    }
    user.password = await bcrypt.hash(parsed.data.password, 12);
    user.passwordChangedAt = new Date();
    await user.save();
    auditSecurityEvent("own_password_changed", user._id.toString(), user._id.toString());
    const response = apiSuccess("Password changed successfully. Please sign in again.", null);
    response.cookies.set(AUTH_COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return apiError("Unable to change password", 500);
  }
}
