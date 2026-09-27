import type { Metadata } from "next";
import { MaterialManager } from "@/components/materials/MaterialManager";
import { requirePageRole } from "@/lib/auth";
import { userCourses } from "@/lib/materials";
export const metadata: Metadata = { title: "My Course Materials", robots: { index: false, follow: false } };
export default async function StudentMaterialsPage() { const user = await requirePageRole("student"); return <MaterialManager role="student" courses={userCourses(user)} materialsLocked={user.courseStatus !== "completed"} />; }
