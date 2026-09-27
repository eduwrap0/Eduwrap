import type { Metadata } from "next";
import { RegisterStudentForm } from "@/components/admin/RegisterStudentForm";
import { requirePageRole } from "@/lib/auth";
import { userCourses } from "@/lib/materials";

export const metadata: Metadata = { title: "Register Student", robots: { index: false, follow: false } };
export default async function FacultyNewStudentPage() { const faculty = await requirePageRole("faculty"); return <><div className="app-page-heading"><div><p className="app-eyebrow">Faculty portal</p><h1>Register a new student</h1><p>The student will automatically be assigned to you.</p></div></div><RegisterStudentForm role="faculty" availableCourses={userCourses(faculty)} /></>; }
