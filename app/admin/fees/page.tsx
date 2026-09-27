import type { Metadata } from "next";
import { FeeManager } from "@/components/admin/FeeManager";
import { connectMongoDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const metadata: Metadata = { title: "Fee Management", robots: { index: false, follow: false } };

export default async function AdminFeesPage() {
  await connectMongoDB();
  const faculty = await User.find({ role: "faculty" }).sort({ name: 1 }).select("name");
  return <div className="fee-management-page">
    <div className="app-page-heading"><div><p className="app-eyebrow">Financial records</p><h1>Fee management</h1><p>Submit student fees and review secure payment transactions.</p></div></div>
    <FeeManager faculties={faculty.map((item) => ({ id: item._id.toString(), name: item.name }))} />
  </div>;
}