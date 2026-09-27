import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const cookieName = "eduwrap_session";

async function readRole(request: NextRequest): Promise<"admin" | "faculty" | "student" | null> {
  const token = request.cookies.get(cookieName)?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret || secret.length < 32) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
      issuer: "eduwrap",
      audience: "eduwrap-web",
    });
    return payload.role === "admin" || payload.role === "faculty" || payload.role === "student" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const role = await readRole(request);
  const path = request.nextUrl.pathname;

  if (path === "/login" && role) {
    const home = role === "admin" ? "/admin/dashboard" : role === "faculty" ? "/faculty/dashboard" : "/student/dashboard";
    return NextResponse.redirect(new URL(home, request.url));
  }

  if ((path.startsWith("/admin/") || path.startsWith("/faculty/") || path.startsWith("/student/")) && !role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  const expected = path.startsWith("/admin/") ? "admin" : path.startsWith("/faculty/") ? "faculty" : path.startsWith("/student/") ? "student" : null;
  if (expected && role && role !== expected) {
    const home = role === "admin" ? "/admin/dashboard" : role === "faculty" ? "/faculty/dashboard" : "/student/dashboard";
    return NextResponse.redirect(new URL(home, request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-eduwrap-path", path);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/).*)"] };
