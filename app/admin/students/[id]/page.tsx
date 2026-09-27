import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudentProfile } from "@/components/admin/StudentProfile";
import { connectMongoDB } from "@/lib/mongodb";
import { objectIdSchema } from "@/lib/validators/auth";
import { User, toSafeUser } from "@/models/User";

export const metadata: Metadata = { title: "Student Profile", robots: { index: false, follow: false } };

export default async function AdminStudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const id = objectIdSchema.safeParse((await params).id);
  if (!id.success) notFound();
  await connectMongoDB();
  const student = await User.findOne({ _id: id.data, role: "student" }).select("+aadhaarNo");
  if (!student) notFound();
  const facultyIds = [...new Set([...(student.facultyIds || []).map(String), ...(student.facultyId ? [student.facultyId.toString()] : [])])];
  const [faculty, availableFaculty] = await Promise.all([
    facultyIds.length ? User.find({ _id: { $in: facultyIds }, role: "faculty" }).select("name") : [],
    User.find({ role: "faculty", isActive: true }).sort({ name: 1 }).select("name"),
  ]);
  return <StudentProfile student={{ ...toSafeUser(student), facultyNames: faculty.map((item) => item.name) }} aadhaarNo={student.aadhaarNo} canEdit faculties={availableFaculty.map((item) => ({ id: item._id.toString(), name: item.name }))} />;
}
