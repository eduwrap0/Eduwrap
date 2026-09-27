import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema, updateStatusSchema } from "@/lib/validators/auth";
import { User, toSafeUser } from "@/models/User";

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id);
  if (!id.success) return validationError(id.error);
  let body: unknown;
  try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await connectMongoDB();
    const update = parsed.data.isActive ? { $set: { isActive: true } } : { $set: { isActive: false, passwordChangedAt: new Date() } };
    const faculty = await User.findOneAndUpdate({ _id: id.data, role: "faculty" }, update, { returnDocument: "after" });
    if (!faculty) return apiError("Faculty member not found", 404);
    auditSecurityEvent("faculty_status_changed", auth.user._id.toString(), faculty._id.toString());
    return apiSuccess(`Faculty ${faculty.isActive ? "unlocked" : "locked"} successfully`, { faculty: toSafeUser(faculty) });
  } catch {
    return apiError("Unable to change faculty status", 500);
  }
}
