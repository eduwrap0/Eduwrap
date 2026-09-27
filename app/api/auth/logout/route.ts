import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { authenticateToken, hasValidRequestOrigin } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/jwt";
import { auditSecurityEvent } from "@/lib/security-audit";

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);

  const user = await authenticateToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const response = apiSuccess("Logged out successfully", null);
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  auditSecurityEvent("logout", user?._id.toString());
  return response;
}
