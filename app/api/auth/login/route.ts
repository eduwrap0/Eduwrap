import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { hasValidRequestOrigin } from "@/lib/auth";
import { AUTH_COOKIE_NAME, createSessionToken, sessionCookieOptions } from "@/lib/jwt";
import { connectMongoDB } from "@/lib/mongodb";
import { checkRateLimit, clearRateLimit, recordRateLimitFailure, requestIp } from "@/lib/rate-limit";
import { auditSecurityEvent } from "@/lib/security-audit";
import { loginSchema } from "@/lib/validators/auth";
import { User, toSafeUser } from "@/models/User";

export const runtime = "nodejs";
const dummyHashPromise = bcrypt.hash("timing-defense-value", 12);

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const identity = `${requestIp(request.headers)}:${parsed.data.email}`;
  try {
    const limit = await checkRateLimit("login", identity);
    if (!limit.allowed) {
      const response = apiError("Too many login attempts. Please try again later.", 429);
      response.headers.set("Retry-After", String(limit.retryAfter));
      return response;
    }

    await connectMongoDB();
    const user = await User.findOne({ email: parsed.data.email }).select("+password");
    const passwordMatches = await bcrypt.compare(parsed.data.password, user?.password ?? (await dummyHashPromise));

    if (!user || !passwordMatches || !user.isActive) {
      await recordRateLimitFailure("login", identity);
      auditSecurityEvent("login_failed", user?._id.toString());
      return apiError("Invalid email or password", 401);
    }

    user.lastLoginAt = new Date();
    await user.save();
    await clearRateLimit("login", identity);

    const token = await createSessionToken({ userId: user._id.toString(), role: user.role });
    const response = apiSuccess("Login successful", { user: toSafeUser(user) });
    response.cookies.set(AUTH_COOKIE_NAME, token, sessionCookieOptions());
    response.headers.set("Cache-Control", "no-store");
    auditSecurityEvent("login_succeeded", user._id.toString());
    return response;
  } catch {
    return apiError("Unable to log in right now", 500);
  }
}
