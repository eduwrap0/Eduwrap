import type { NextRequest } from "next/server";
import { apiError, validationError } from "@/lib/api-response";
import { generateAdmissionFormPdf } from "@/lib/admission-form";
import { authorizeApi } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { formatBatchTime } from "@/lib/format-batch-time";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema } from "@/lib/validators/auth";
import { User } from "@/models/User";

interface RouteContext { params: Promise<{ id: string }> }

export const runtime = "nodejs";

function date(value?: Date): string {
  return value ? value.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }) : "Not provided";
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id);
  if (!id.success) return validationError(id.error);

  try {
    await connectMongoDB();
    const student = await User.findOne({ _id: id.data, role: "student" }).select("+aadhaarNo");
    if (!student) return apiError("Student not found", 404);
    const facultyIds = [...new Set([...(student.facultyIds || []).map(String), ...(student.facultyId ? [student.facultyId.toString()] : [])])];
    const faculty = facultyIds.length ? await User.find({ _id: { $in: facultyIds }, role: "faculty" }).select("name") : [];
    const courses = student.courses?.length ? student.courses : student.course ? [student.course] : [];
    const pdf = await generateAdmissionFormPdf({
      studentId: student.studentId || student._id.toString(),
      name: student.name,
      email: student.email,
      phone: student.phone || "Not provided",
      profileImageUrl: student.profileImageUrl,
      address: [student.address, student.district, student.state].filter(Boolean).join(", ") || "Not provided",
      profile: [
        ["Date of birth", date(student.dateOfBirth)], ["Gender", student.gender?.replaceAll("_", " ") || "Not provided"],
        ["Qualification", student.qualification || "Not provided"], ["Marital status", student.maritalStatus || "Not provided"],
        ["Aadhaar number", student.aadhaarNo || "Not provided"], ["Blood group", student.bloodGroup || "Not provided"],
        ["Nationality", student.nationality || "Not provided"], ["State / District", [student.state, student.district].filter(Boolean).join(" / ") || "Not provided"],
      ],
      guardian: [
        ["Father / Guardian name", student.fatherName || "Not provided"], ["Occupation", student.fatherOccupation || "Not provided"],
        ["Contact number", student.fatherPhone || "Not provided"],
      ],
      enrollment: [
        ["Admission date", date(student.admissionDate)],
        ["Courses", courses.join(", ") || "Not assigned"], ["Assigned faculty", faculty.map((item) => item.name).join(", ") || "Not assigned"],
        ["Batch timing", formatBatchTime(student.batchTiming)], ["Class duration", student.classDuration || "Not assigned"],
        ["Course duration", student.courseDuration || "Not assigned"], ["Total fee", student.totalFee === undefined ? "Not provided" : `INR ${new Intl.NumberFormat("en-IN").format(student.totalFee)}`],
      ],
      generatedAt: new Date(),
    });
    auditSecurityEvent("admission_form_downloaded", auth.user._id.toString(), student._id.toString());
    const filename = `EduWrap-Admission-Form-${(student.studentId || student.name).replace(/[^a-zA-Z0-9_-]+/g, "-")}.pdf`;
    return new Response(Buffer.from(pdf), { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return apiError("Unable to generate admission form", 500);
  }
}
