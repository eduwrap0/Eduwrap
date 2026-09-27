import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/faculty/", "/student/", "/dashboard/", "/login", "/preview/"] }, sitemap: `${site.url}/sitemap.xml`, host: site.url };
}
