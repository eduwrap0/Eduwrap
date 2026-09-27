import type { Metadata } from "next";
import { RegisterStudentForm } from "@/components/admin/RegisterStudentForm";
import { connectMongoDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const metadata: Metadata = { title: "Register Student", robots: { index: false, follow: false } };
export default async function NewStudentPage() { await connectMongoDB(); const faculty = await User.find({ role: "faculty", isActive: true }).sort({ name: 1 }).select("name"); return <><div className="app-page-heading"><div><p className="app-eyebrow">Student access</p><h1>Register a new student</h1><p>Create the account, select multiple courses, and assign active faculty members.</p></div></div><RegisterStudentForm role="admin" faculties={faculty.map((item) => ({ id: item._id.toString(), name: item.name }))} /></>; }
