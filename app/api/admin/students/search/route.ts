import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { studentFeeSearchSchema } from "@/lib/validators/fees";
import { User } from "@/models/User";

export const runtime = "nodejs";

function escapedRegex(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  const parsed = studentFeeSearchSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return validationError(parsed.error);

  try {
    await connectMongoDB();
    const regex = escapedRegex(parsed.data.q);
    const students = await User.find({
      role: "student",
      $or: [{ name: regex }, { studentId: regex }, { fatherName: regex }, { phone: regex }, { email: regex }],
    }).sort({ admissionDate: -1, createdAt: -1 }).limit(parsed.data.limit).select("name studentId fatherName phone email totalFee course courses facultyId facultyIds");
    const facultyIds = [...new Set(students.flatMap((student) => [...(student.facultyIds || []).map(String), ...(student.facultyId ? [student.facultyId.toString()] : [])]))];
    const faculty = facultyIds.length ? await User.find({ _id: { $in: facultyIds }, role: "faculty", isActive: true }).select("name") : [];
    const facultyNames = new Map(faculty.map((item) => [item._id.toString(), item.name]));
    return apiSuccess("Students retrieved", { students: students.map((student) => ({
      id: student._id.toString(),
      studentId: student.studentId || student._id.toString(),
      name: student.name,
      fatherName: student.fatherName,
      phone: student.phone,
      email: student.email,
      totalFee: student.totalFee,
      courses: student.courses?.length ? student.courses : student.course ? [student.course] : [],
      faculties: [...new Set([...(student.facultyIds || []).map(String), ...(student.facultyId ? [student.facultyId.toString()] : [])])].flatMap((id) => facultyNames.has(id) ? [{ id, name: facultyNames.get(id)! }] : []),
    })) });
  } catch {
    return apiError("Unable to search students", 500);
  }
}
