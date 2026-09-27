import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FacultyProfile } from "@/components/admin/FacultyProfile";
import { connectMongoDB } from "@/lib/mongodb";
import { objectIdSchema } from "@/lib/validators/auth";
import { User, toSafeUser } from "@/models/User";

export const metadata: Metadata = { title: "Faculty Profile", robots: { index: false, follow: false } };

export default async function FacultyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const id = objectIdSchema.safeParse((await params).id);
  if (!id.success) notFound();
  await connectMongoDB();
  const faculty = await User.findOne({ _id: id.data, role: "faculty" }).select("+aadhaarNo");
  if (!faculty) notFound();
  return <FacultyProfile faculty={toSafeUser(faculty)} aadhaarNo={faculty.aadhaarNo} />;
}
