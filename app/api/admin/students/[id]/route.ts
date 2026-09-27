import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { deleteProfileImage } from "@/lib/cloudinary";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema, updateStudentSchema } from "@/lib/validators/auth";
import { User, toSafeUser } from "@/models/User";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function isDuplicateKeyError(error: unknown): error is { code: number; keyPattern?: Record<string, number> } {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await authorizeApi(request, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id);
  if (!id.success) return validationError(id.error);

  try {
    await connectMongoDB();
    const student = await User.findOne({ _id: id.data, role: "student", ...(auth.user.role === "faculty" ? { $or: [{ facultyIds: auth.user._id }, { facultyId: auth.user._id }] } : {}) });
    if (!student) return apiError("Student not found", 404);
    return apiSuccess("Student retrieved", { student: toSafeUser(student) });
  } catch {
    return apiError("Unable to retrieve student", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id);
  if (!id.success) return validationError(id.error);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request", 400);
  }
  const parsed = updateStudentSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  if (auth.user.role === "faculty" && parsed.data.facultyIds !== undefined) return apiError("Only administrators can change faculty assignments", 403);
  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.profileImageUrl !== undefined) updates.profileImageUrl = parsed.data.profileImageUrl;
  if (parsed.data.dateOfBirth !== undefined) updates.dateOfBirth = new Date(`${parsed.data.dateOfBirth}T00:00:00.000Z`);
  if (parsed.data.qualification !== undefined) updates.qualification = parsed.data.qualification;
  if (parsed.data.aadhaarNo !== undefined) updates.aadhaarNo = parsed.data.aadhaarNo;
  if (parsed.data.address !== undefined) updates.address = parsed.data.address;
  if (parsed.data.state !== undefined) updates.state = parsed.data.state;
  if (parsed.data.district !== undefined) updates.district = parsed.data.district;
  if (parsed.data.bloodGroup !== undefined) updates.bloodGroup = parsed.data.bloodGroup;
  if (parsed.data.nationality !== undefined) updates.nationality = parsed.data.nationality;
  if (parsed.data.gender !== undefined) updates.gender = parsed.data.gender;
  if (parsed.data.maritalStatus !== undefined) updates.maritalStatus = parsed.data.maritalStatus;
  if (parsed.data.fatherName !== undefined) updates.fatherName = parsed.data.fatherName;
  if (parsed.data.fatherOccupation !== undefined) updates.fatherOccupation = parsed.data.fatherOccupation;
  if (parsed.data.fatherPhone !== undefined) updates.fatherPhone = parsed.data.fatherPhone;
  if (parsed.data.batchTiming !== undefined) updates.batchTiming = parsed.data.batchTiming;
  if (parsed.data.classDuration !== undefined) updates.classDuration = parsed.data.classDuration;
  if (parsed.data.courseDuration !== undefined) updates.courseDuration = parsed.data.courseDuration;
  if (parsed.data.admissionDate !== undefined) updates.admissionDate = new Date(`${parsed.data.admissionDate}T00:00:00.000Z`);
  if (parsed.data.totalFee !== undefined) updates.totalFee = parsed.data.totalFee;
  if (parsed.data.courses !== undefined) { updates.courses = parsed.data.courses; updates.course = parsed.data.courses.join(", "); }

  try {
    await connectMongoDB();
    if (parsed.data.phone && await User.exists({ _id: { $ne: id.data }, phone: parsed.data.phone })) return apiError("A user with that phone number already exists", 409);
    const studentFilter = { _id: id.data, role: "student" as const, ...(auth.user.role === "faculty" ? { $or: [{ facultyIds: auth.user._id }, { facultyId: auth.user._id }] } : {}) };
    const previousStudent = parsed.data.profileImageUrl !== undefined || parsed.data.facultyIds !== undefined
      ? await User.findOne(studentFilter).select("profileImageUrl facultyAssignments")
      : null;
    if (parsed.data.facultyIds !== undefined) {
      const facultyCount = await User.countDocuments({ _id: { $in: parsed.data.facultyIds }, role: "faculty", isActive: true });
      if (facultyCount !== parsed.data.facultyIds.length) return apiError("One or more active faculty members were not found", 400);
      const existingAssignmentDates = new Map((previousStudent?.facultyAssignments || []).map((assignment) => [assignment.facultyId.toString(), assignment.assignedAt]));
      const assignedAt = new Date();
      updates.facultyIds = parsed.data.facultyIds;
      updates.facultyAssignments = parsed.data.facultyIds.map((facultyId) => ({ facultyId, assignedAt: existingAssignmentDates.get(facultyId) || assignedAt }));
    }
    const update = parsed.data.facultyIds !== undefined ? { $set: updates, $unset: { facultyId: "" } } : { $set: updates };
    const student = await User.findOneAndUpdate(studentFilter, update, { returnDocument: "after", runValidators: true });
    if (!student) return apiError("Student not found", 404);
    auditSecurityEvent("student_updated", auth.user._id.toString(), student._id.toString());
    if (previousStudent?.profileImageUrl && previousStudent.profileImageUrl !== student.profileImageUrl) {
      try { await deleteProfileImage(previousStudent.profileImageUrl); }
      catch (cleanupError) { console.error(JSON.stringify({ type: "profile_image_cleanup_error", userId: student._id.toString(), message: cleanupError instanceof Error ? cleanupError.message : "Unknown error" })); }
    }
    return apiSuccess("Student updated successfully", { student: toSafeUser(student) });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      if (error.keyPattern?.phone) return apiError("A user with that phone number already exists", 409);
      return apiError("A user with that email or Aadhaar number already exists", 409);
    }
    console.error(JSON.stringify({
      type: "student_update_error",
      studentId: id.data,
      errorName: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
    }));
    return apiError("Unable to update student", 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id);
  if (!id.success) return validationError(id.error);

  try {
    await connectMongoDB();
    const student = await User.findOneAndDelete({ _id: id.data, role: "student" });
    if (!student) return apiError("Student not found", 404);
    auditSecurityEvent("student_deleted", auth.user._id.toString(), student._id.toString());
    return apiSuccess("Student deleted successfully", null);
  } catch {
    return apiError("Unable to delete student", 500);
  }
}
