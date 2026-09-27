import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function apiSuccess<T>(message: string, data: T, status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function apiError(message: string, status: number, errors?: Record<string, string[]>) {
  return NextResponse.json({ success: false, message, ...(errors ? { errors } : {}) }, { status });
}

export function validationError(error: ZodError) {
  return apiError("Invalid request", 400, error.flatten().fieldErrors as Record<string, string[]>);
}

