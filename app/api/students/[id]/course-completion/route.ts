import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { generateCertificatePdf } from "@/lib/certificate";
import { sendCompletionEmail } from "@/lib/email";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema, updateCourseStatusSchema } from "@/lib/validators/auth";
import { User, toSafeUser } from "@/models/User";

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await authorizeApi(request, ["admin", "student"]);
  if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id);
  if (!id.success) return validationError(id.error);
  if (auth.user.role === "student" && auth.user._id.toString() !== id.data) return apiError("You can only view your own course completion information", 403);

  await connectMongoDB();
  const student = await User.findOne({ _id: id.data, role: "student" }).select("courseStatus courseCompletedAt courseCompletedBy certificateNumber courses course");
  if (!student) return apiError("Student not found", 404);
  return apiSuccess("Course completion information retrieved", {
    status: student.courseStatus || "ongoing",
    courseCompletedAt: student.courseCompletedAt?.toISOString(),
    courseCompletedBy: student.courseCompletedBy?.toString(),
    certificateNumber: student.courseStatus === "completed" ? student.certificateNumber : undefined,
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id);
  if (!id.success) return validationError(id.error);
  let body: unknown;
  try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = updateCourseStatusSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    await connectMongoDB();
    const student = await User.findOne({ _id: id.data, role: "student" });
    if (!student) return apiError("Student not found", 404);
    const newlyCompleted = parsed.data.status === "completed" && student.courseStatus !== "completed";
    if (parsed.data.status === "completed") {
      student.courseStatus = "completed";
      student.courseCompletedAt ||= new Date();
      student.courseCompletedBy ||= auth.user._id;
      student.certificateNumber ||= `EWCTI/${new Date().getUTCFullYear()}/${student._id.toString().slice(-6).toUpperCase()}`;
    } else {
      student.courseStatus = "ongoing";
      student.courseCompletedAt = undefined;
      student.courseCompletedBy = undefined;
    }
    await student.save();
    auditSecurityEvent("student_course_status_changed", auth.user._id.toString(), student._id.toString());
    let emailSent = false;
    if (newlyCompleted && student.courseCompletedAt && student.certificateNumber) {
      try {
        const courses = student.courses?.length ? student.courses : student.course ? [student.course] : [];
        const certificate = await generateCertificatePdf({
          studentName: student.name,
          courseName: courses.join(", ") || "Professional Training Program",
          courseDuration: student.courseDuration || "Not specified",
          certificateNumber: student.certificateNumber,
          completedAt: student.courseCompletedAt,
        });
        emailSent = await sendCompletionEmail({
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          courses,
          completedAt: student.courseCompletedAt,
          certificateNumber: student.certificateNumber,
          certificate,
        });
      } catch (error) {
        console.error(JSON.stringify({ type: "completion_email_error", name: error instanceof Error ? error.name : "UnknownError" }));
      }
    }
    return apiSuccess(`Course marked as ${student.courseStatus}`, { student: toSafeUser(student), emailSent });
  } catch {
    return apiError("Unable to update course completion status", 500);
  }
}
