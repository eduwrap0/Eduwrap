import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/jwt";
import { connectMongoDB } from "@/lib/mongodb";
import { User, type UserDocument } from "@/models/User";
import type { UserRole } from "@/types/auth";

export async function authenticateToken(token?: string): Promise<UserDocument | null> {
  if (!token) return null;

  try {
    const payload = await verifySessionToken(token);
    await connectMongoDB();
    const user = await User.findById(payload.userId).select("+passwordChangedAt");
    if (!user || !user.isActive || user.role !== payload.role) return null;

    if (user.passwordChangedAt) {
      const invalidBeforeSeconds = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (payload.iat <= invalidBeforeSeconds) return null;
    }
    return user;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserDocument | null> {
  const cookieStore = await cookies();
  return authenticateToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export async function requirePageRole(role: UserRole): Promise<UserDocument> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(roleHome(user.role));
  return user;
}

export async function authorizeApi(request: NextRequest, requiredRole?: UserRole | UserRole[]) {
  const user = await authenticateToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (!user) return { ok: false as const, response: apiError("Authentication required", 401) };
  const allowed = requiredRole ? (Array.isArray(requiredRole) ? requiredRole : [requiredRole]) : null;
  if (allowed && !allowed.includes(user.role)) {
    return { ok: false as const, response: apiError("You do not have permission to perform this action", 403) };
  }
  return { ok: true as const, user };
}

export function roleHome(role: UserRole): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "faculty") return "/faculty/dashboard";
  return "/student/dashboard";
}

export function hasValidRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin) return origin === request.nextUrl.origin;
  return request.headers.get("sec-fetch-site") !== "cross-site";
}
