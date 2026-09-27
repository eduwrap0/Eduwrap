import type { Metadata } from "next";
import { MaterialManager } from "@/components/materials/MaterialManager";
import { FACULTY_COURSES } from "@/lib/courses";
export const metadata: Metadata = { title: "Course Materials", robots: { index: false, follow: false } };
export default function AdminMaterialsPage() { return <MaterialManager role="admin" courses={[...FACULTY_COURSES]} />; }
