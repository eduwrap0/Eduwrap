import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { getJwtExpiration, getJwtSecret } from "@/lib/env";
import type { SessionPayload } from "@/types/auth";

export const AUTH_COOKIE_NAME = "eduwrap_session";
const issuer = "eduwrap";
const audience = "eduwrap-web";

const jwtPayloadSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
  role: z.enum(["admin", "faculty", "student"]),
  iat: z.number().int(),
});

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const { value } = getJwtExpiration();
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(Math.ceil(Date.now() / 1000))
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(value)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    algorithms: ["HS256"],
    issuer,
    audience,
  });
  return jwtPayloadSchema.parse(payload);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: getJwtExpiration().seconds,
  };
}
