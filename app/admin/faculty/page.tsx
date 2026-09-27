import type { Metadata } from "next";
import Link from "next/link";
import { FacultyManager } from "@/components/admin/FacultyManager";
import { connectMongoDB } from "@/lib/mongodb";
import { User, toSafeUser } from "@/models/User";

export const metadata: Metadata = { title: "Manage Faculty", robots: { index: false, follow: false } };

export default async function FacultyPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const params = await searchParams;
  await connectMongoDB();
  const faculty = await User.find({ role: "faculty" }).sort({ createdAt: -1 });
  return <>
    <div className="app-page-heading"><div><p className="app-eyebrow">Faculty access</p><h1>Manage faculty</h1><p>Edit, lock, unlock, or delete faculty accounts.</p></div><Link href="/admin/faculty/new" className="btn btn-brand">Register faculty</Link></div>
    <FacultyManager initialFaculty={faculty.map(toSafeUser)} showCreatedMessage={params.created === "1"} />
  </>;
}
