import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudentProfile } from "@/components/admin/StudentProfile";
import { requirePageRole } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { objectIdSchema } from "@/lib/validators/auth";
import { User, toSafeUser } from "@/models/User";

export const metadata: Metadata = { title: "Student Profile", robots: { index: false, follow: false } };

export default async function FacultyStudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const faculty = await requirePageRole("faculty");
  const id = objectIdSchema.safeParse((await params).id);
  if (!id.success) notFound();
  await connectMongoDB();
  const student = await User.findOne({ _id: id.data, role: "student", $or: [{ facultyIds: faculty._id }, { facultyId: faculty._id }] }).select("+aadhaarNo");
  if (!student) notFound();
  const facultyIds = [...new Set([...(student.facultyIds || []).map(String), ...(student.facultyId ? [student.facultyId.toString()] : [])])];
  const assignedFaculty = facultyIds.length ? await User.find({ _id: { $in: facultyIds }, role: "faculty" }).select("name") : [];
  const maskedAadhaar = student.aadhaarNo ? `•••• •••• ${student.aadhaarNo.slice(-4)}` : undefined;
  return <StudentProfile student={{ ...toSafeUser(student), facultyNames: assignedFaculty.map((item) => item.name) }} aadhaarNo={maskedAadhaar} />;
}
