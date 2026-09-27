import type { Metadata } from "next";
import { FeeManager } from "@/components/admin/FeeManager";

export const metadata: Metadata = { title: "Student Fee Collections", robots: { index: false, follow: false } };

export default function FacultyFeesPage() {
  return <div className="fee-management-page">
    <div className="app-page-heading"><div><p className="app-eyebrow">Assigned student collections</p><h1>Fee transactions</h1><p>View collections recorded after each student was assigned to you.</p></div></div>
    <FeeManager readOnly endpoint="/api/faculty/fees" studentBasePath="/faculty/students" />
  </div>;
}