import type { Metadata } from "next";
import Link from "next/link";
import { StudentsManager } from "@/components/admin/StudentsManager";
import { connectMongoDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const metadata: Metadata = { title: "Manage Students", robots: { index: false, follow: false } };
export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) { const params = await searchParams; await connectMongoDB(); const faculty = await User.find({ role: "faculty", isActive: true }).sort({ name: 1 }).select("name"); return <><div className="app-page-heading"><div><p className="app-eyebrow">Student access</p><h1>Manage students</h1></div><Link href="/admin/students/new" className="btn btn-brand"><i className="fa fa-user-plus" aria-hidden="true" /> Register student</Link></div><StudentsManager showCreatedMessage={params.created === "1"} adminMode faculties={faculty.map((item) => ({ id: item._id.toString(), name: item.name }))} /></>; }
