import type { Metadata } from "next";
import { MaterialManager } from "@/components/materials/MaterialManager";
import { requirePageRole } from "@/lib/auth";
import { userCourses } from "@/lib/materials";
export const metadata: Metadata = { title: "Course Materials", robots: { index: false, follow: false } };
export default async function FacultyMaterialsPage() { const user = await requirePageRole("faculty"); return <MaterialManager role="faculty" courses={userCourses(user)} />; }
