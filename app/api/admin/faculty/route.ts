import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { sendRegistrationEmail } from "@/lib/email";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { createFacultySchema } from "@/lib/validators/auth";
import { User, toSafeUser } from "@/models/User";

export const runtime = "nodejs";

function isDuplicateKeyError(error: unknown): error is { code: number; keyPattern?: Record<string, number> } {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = createFacultySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await connectMongoDB();
    if (await User.exists({ phone: parsed.data.phone })) return apiError("A user with that phone number already exists", 409);
    const faculty = await User.create({ name: parsed.data.name, email: parsed.data.email, password: await bcrypt.hash(parsed.data.password, 12), role: "faculty", ...(parsed.data.phone ? { phone: parsed.data.phone } : {}), ...(parsed.data.profileImageUrl ? { profileImageUrl: parsed.data.profileImageUrl } : {}), aadhaarNo: parsed.data.aadhaarNo, address: parsed.data.address, state: parsed.data.state, district: parsed.data.district, bloodGroup: parsed.data.bloodGroup, nationality: parsed.data.nationality, gender: parsed.data.gender, maritalStatus: parsed.data.maritalStatus, dateOfBirth: new Date(`${parsed.data.dateOfBirth}T00:00:00.000Z`), qualification: parsed.data.qualification, courses: parsed.data.courses, isActive: parsed.data.isActive, createdBy: auth.user._id });
    auditSecurityEvent("faculty_created", auth.user._id.toString(), faculty._id.toString());
    const emailSent = await sendRegistrationEmail({ name: faculty.name, email: faculty.email, role: "faculty", courses: faculty.courses || [] });
    return apiSuccess("Faculty registered successfully", { faculty: toSafeUser(faculty), emailSent }, 201);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      if (error.keyPattern?.phone) return apiError("A user with that phone number already exists", 409);
      return apiError("A user with that email or Aadhaar number already exists", 409);
    }
    if (error instanceof mongoose.Error.ValidationError) {
      console.error(JSON.stringify({ type: "faculty_registration_error", name: error.name, fields: Object.keys(error.errors) }));
      return apiError("Faculty data could not be saved. Restart the development server and try again.", 400);
    }
    console.error(JSON.stringify({ type: "faculty_registration_error", name: error instanceof Error ? error.name : "UnknownError", ...(typeof error === "object" && error !== null && "code" in error ? { code: error.code } : {}) }));
    return apiError("Unable to register faculty", 500);
  }
}

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  await connectMongoDB();
  const faculty = await User.find({ role: "faculty" }).sort({ name: 1 });
  return apiSuccess("Faculty retrieved", { faculty: faculty.map(toSafeUser) });
}
