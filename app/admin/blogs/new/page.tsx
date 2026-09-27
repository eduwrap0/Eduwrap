import type { Metadata } from "next";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { requirePageRole } from "@/lib/auth";
import { getBlogCourses } from "@/lib/blogs";
import { connectMongoDB } from "@/lib/mongodb";

export const metadata: Metadata = { title: "Create Blog", robots: { index: false, follow: false } };
export default async function NewBlogPage() { await requirePageRole("admin"); await connectMongoDB(); return <BlogEditor courses={await getBlogCourses()} />; }
