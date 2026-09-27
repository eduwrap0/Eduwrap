import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { deleteProfileImage } from "@/lib/cloudinary";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema, updateFacultySchema } from "@/lib/validators/auth";
import { User, toSafeUser } from "@/models/User";

interface RouteContext { params: Promise<{ id: string }> }

function isDuplicateKeyError(error: unknown): error is { code: number; keyPattern?: Record<string, number> } {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id);
  if (!id.success) return validationError(id.error);
  let body: unknown;
  try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = updateFacultySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.dateOfBirth) updates.dateOfBirth = new Date(`${parsed.data.dateOfBirth}T00:00:00.000Z`);
  try {
    await connectMongoDB();
    if (parsed.data.phone && await User.exists({ _id: { $ne: id.data }, phone: parsed.data.phone })) return apiError("A user with that phone number already exists", 409);
    const previousFaculty = parsed.data.profileImageUrl ? await User.findOne({ _id: id.data, role: "faculty" }).select("profileImageUrl") : null;
    const faculty = await User.findOneAndUpdate({ _id: id.data, role: "faculty" }, { $set: updates }, { returnDocument: "after", runValidators: true });
    if (!faculty) return apiError("Faculty member not found", 404);
    auditSecurityEvent("faculty_updated", auth.user._id.toString(), faculty._id.toString());
    if (previousFaculty?.profileImageUrl && previousFaculty.profileImageUrl !== faculty.profileImageUrl) {
      try { await deleteProfileImage(previousFaculty.profileImageUrl); }
      catch (cleanupError) { console.error(JSON.stringify({ type: "profile_image_cleanup_error", userId: faculty._id.toString(), message: cleanupError instanceof Error ? cleanupError.message : "Unknown error" })); }
    }
    return apiSuccess("Faculty updated successfully", { faculty: toSafeUser(faculty) });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      if (error.keyPattern?.phone) return apiError("A user with that phone number already exists", 409);
      return apiError("A user with that email or Aadhaar number already exists", 409);
    }
    return apiError("Unable to update faculty", 500);
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
    const faculty = await User.findOneAndDelete({ _id: id.data, role: "faculty" });
    if (!faculty) return apiError("Faculty member not found", 404);
    await Promise.all([
      User.updateMany({ role: "student", facultyIds: faculty._id }, { $pull: { facultyIds: faculty._id } }),
      User.updateMany({ role: "student", facultyId: faculty._id }, { $unset: { facultyId: "" } }),
    ]);
    auditSecurityEvent("faculty_deleted", auth.user._id.toString(), faculty._id.toString());
    return apiSuccess("Faculty deleted successfully", null);
  } catch {
    return apiError("Unable to delete faculty", 500);
  }
}
