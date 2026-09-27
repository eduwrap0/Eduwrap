import type { Metadata } from "next";
import { SeoSettingsManager } from "@/components/admin/SeoSettingsManager";
import { courses } from "@/content/courses";
import { opportunities } from "@/content/opportunities";
import { getSeoSettings } from "@/lib/seo";
import { connectMongoDB } from "@/lib/mongodb";
import { BlogPost } from "@/models/BlogPost";

export const metadata: Metadata = { title: "SEO Settings", robots: { index: false, follow: false } };

export default async function SeoSettingsPage() {
  const stored = await getSeoSettings();
  let blogPaths: string[] = [];
  try {
    await connectMongoDB();
    const blogs = await BlogPost.find({}).select("slug").sort({ updatedAt: -1 }).lean<Array<{ slug: string }>>();
    blogPaths = blogs.map((blog) => `/blog/${blog.slug}`);
  } catch { /* The editor remains usable with custom paths if blog discovery is unavailable. */ }
  const initial = {
    pages: stored.pages.map((page) => ({ path: page.path, title: page.title || "", description: page.description || "", keywords: page.keywords || [], canonicalUrl: page.canonicalUrl || "", openGraphTitle: page.openGraphTitle || "", openGraphDescription: page.openGraphDescription || "", openGraphImage: page.openGraphImage || "", structuredData: page.structuredData || "", customTags: page.customTags || "" })),
    sitewideTags: stored.sitewideTags || "",
  };
  const suggestedPaths = ["/", "/about", "/courses", ...courses.map((course) => `/courses/${course.slug}`), "/blog", ...blogPaths, "/contact", "/verify-certificate", "/privacy-policy", "/thank-you", ...opportunities.map((page) => `/${page.slug}`)];
  return <SeoSettingsManager initial={initial} suggestedPaths={suggestedPaths} />;
}
