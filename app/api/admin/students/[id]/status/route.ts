import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema, updateStatusSchema } from "@/lib/validators/auth";
import { User, toSafeUser } from "@/models/User";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id);
  if (!id.success) return validationError(id.error);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request", 400);
  }
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    await connectMongoDB();
    const update = parsed.data.isActive
      ? { $set: { isActive: true } }
      : { $set: { isActive: false, passwordChangedAt: new Date() } };
    const student = await User.findOneAndUpdate({ _id: id.data, role: "student" }, update, { returnDocument: "after" });
    if (!student) return apiError("Student not found", 404);
    auditSecurityEvent("student_status_changed", auth.user._id.toString(), student._id.toString());
    return apiSuccess(`Student ${student.isActive ? "unlocked" : "locked"} successfully`, { student: toSafeUser(student) });
  } catch {
    return apiError("Unable to change student status", 500);
  }
}
