import type { MetadataRoute } from "next";
import { courses } from "@/content/courses";
import { site } from "@/content/site";
import { opportunities } from "@/content/opportunities";
import { connectMongoDB } from "@/lib/mongodb";
import { BlogPost } from "@/models/BlogPost";
import { BlogStatus } from "@/types/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const updated = new Date();
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    await connectMongoDB();
    const blogs = await BlogPost.find({ status: BlogStatus.Published, publishedAt: { $lte: updated } }).select("slug updatedAt").lean<Array<{ slug: string; updatedAt: Date }>>();
    blogEntries = blogs.map((blog) => ({ url: `${site.url}/blog/${blog.slug}`, lastModified: blog.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 }));
  } catch { /* Static public URLs remain available if MongoDB is temporarily unavailable. */ }
  return [
    { url: site.url, lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/courses`, lastModified: updated, changeFrequency: "weekly", priority: 0.9 },
    ...courses.map((course) => ({ url: `${site.url}/courses/${course.slug}`, lastModified: updated, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${site.url}/about`, lastModified: updated, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/contact`, lastModified: updated, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site.url}/verify-certificate`, lastModified: updated, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site.url}/blog`, lastModified: updated, changeFrequency: "weekly", priority: 0.8 },
    ...blogEntries,
    ...opportunities.map((page) => ({ url: `${site.url}/${page.slug}`, lastModified: updated, changeFrequency: "monthly" as const, priority: 0.5 })),
    { url: `${site.url}/privacy-policy`, lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
  ];
}
