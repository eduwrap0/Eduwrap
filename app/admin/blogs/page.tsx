import type { Metadata } from "next";
import { BlogManager } from "@/components/admin/BlogManager";
import { requirePageRole } from "@/lib/auth";
import { getBlogCourses } from "@/lib/blogs";
import { connectMongoDB } from "@/lib/mongodb";

export const metadata: Metadata = { title: "Blog Management", robots: { index: false, follow: false } };
export default async function AdminBlogsPage() { await requirePageRole("admin"); await connectMongoDB(); return <BlogManager courses={await getBlogCourses()} />; }
