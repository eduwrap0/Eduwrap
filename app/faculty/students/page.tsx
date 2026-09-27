import type { Metadata } from "next";
import Link from "next/link";
import { StudentsManager } from "@/components/admin/StudentsManager";

export const metadata: Metadata = { title: "My Students", robots: { index: false, follow: false } };
export default async function FacultyStudentsPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) { const params = await searchParams; return <><div className="app-page-heading"><div><p className="app-eyebrow">Faculty portal</p><h1>My students</h1><p>Only students assigned to your faculty account appear here.</p></div><Link href="/faculty/students/new" className="btn btn-brand">Register student</Link></div><StudentsManager showCreatedMessage={params.created === "1"} /></>; }
