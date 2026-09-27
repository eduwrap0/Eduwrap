import type { Metadata } from "next";
import { site } from "@/content/site";

export function pageMetadata(title: string, description: string, path = "/", keywords: string[] = []): Metadata {
  const url = new URL(path, site.url);
  return {
    title, description, keywords,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: site.name, images: ["/assets/images/logo-dark-cf3f5756.webp"] },
    twitter: { card: "summary_large_image", title, description, images: ["/assets/images/logo-dark-cf3f5756.webp"] },
  };
}
