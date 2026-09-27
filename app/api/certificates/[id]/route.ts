import type { NextRequest } from "next/server";
import { apiError, validationError } from "@/lib/api-response";
import { authorizeApi } from "@/lib/auth";
import { generateCertificatePdf } from "@/lib/certificate";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema } from "@/lib/validators/auth";
import { User } from "@/models/User";

interface RouteContext { params: Promise<{ id: string }> }

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await authorizeApi(request, ["admin", "student"]);
  if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id);
  if (!id.success) return validationError(id.error);
  if (auth.user.role === "student" && auth.user._id.toString() !== id.data) return apiError("You can only download your own certificate", 403);

  try {
    await connectMongoDB();
    const student = await User.findOne({ _id: id.data, role: "student", courseStatus: "completed" });
    if (!student?.courseCompletedAt || !student.certificateNumber) return apiError("Certificate is not available until the course is completed", 404);
    const courses = student.courses?.length ? student.courses : student.course ? [student.course] : [];
    const pdf = await generateCertificatePdf({
      studentName: student.name,
      courseName: courses.join(", ") || "Professional Training Program",
      courseDuration: student.courseDuration || "Not specified",
      certificateNumber: student.certificateNumber,
      completedAt: student.courseCompletedAt,
    });
    auditSecurityEvent("certificate_downloaded", auth.user._id.toString(), student._id.toString());
    const filename = `EduWrap-Certificate-${(student.studentId || student.name).replace(/[^a-zA-Z0-9_-]+/g, "-")}.pdf`;
    return new Response(Buffer.from(pdf), { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return apiError("Unable to generate certificate", 500);
  }
}
