import type { Metadata } from "next";
import { RegisterFacultyForm } from "@/components/admin/RegisterFacultyForm";

export const metadata: Metadata = { title: "Register Faculty", robots: { index: false, follow: false } };
export default function NewFacultyPage() { return <><div className="app-page-heading"><div><p className="app-eyebrow">Faculty access</p><h1>Register a faculty member</h1><p>Only administrators can create faculty accounts.</p></div></div><RegisterFacultyForm /></>; }
