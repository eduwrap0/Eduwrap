import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { requirePageRole } from "@/lib/auth";
import { findHydratedBlogById, getBlogCourses } from "@/lib/blogs";
import { connectMongoDB } from "@/lib/mongodb";
import { objectIdSchema } from "@/lib/validators/auth";

export const metadata: Metadata = { title: "Edit Blog", robots: { index: false, follow: false } };
export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) { await requirePageRole("admin"); const id = objectIdSchema.safeParse((await params).id); if (!id.success) notFound(); await connectMongoDB(); const [blog, courses] = await Promise.all([findHydratedBlogById(id.data), getBlogCourses()]); if (!blog) notFound(); return <BlogEditor blog={blog} courses={courses} />; }
