import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { requirePageRole } from "@/lib/auth";
import { findHydratedBlogById } from "@/lib/blogs";
import { connectMongoDB } from "@/lib/mongodb";
import { objectIdSchema } from "@/lib/validators/auth";

export const metadata: Metadata = { title: "Secure Blog Preview", robots: { index: false, follow: false, nocache: true } };
export default async function BlogPreviewPage({ params }: { params: Promise<{ id: string }> }) { await requirePageRole("admin"); const id = objectIdSchema.safeParse((await params).id); if (!id.success) notFound(); await connectMongoDB(); const blog = await findHydratedBlogById(id.data); if (!blog) notFound(); return <BlogArticle blog={blog} preview />; }
