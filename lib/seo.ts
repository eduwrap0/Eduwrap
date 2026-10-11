import "server-only";
import type { Metadata } from "next";
import { cache } from "react";
import { site } from "@/content/site";
import { connectMongoDB } from "@/lib/mongodb";
import { SeoSettings, type ISeoPageSettings, type ISeoSettings } from "@/models/SeoSettings";

export type SeoSettingsRecord = Pick<ISeoSettings, "pages">;

const emptySettings: SeoSettingsRecord = { pages: [] };

export const getSeoSettings = cache(async (): Promise<SeoSettingsRecord> => {
  try {
    await connectMongoDB();
    const settings = await SeoSettings.findOne({ key: "global" }).select("pages.path pages.title pages.description pages.keywords pages.canonicalUrl pages.openGraphTitle pages.openGraphDescription pages.openGraphImage").lean<SeoSettingsRecord | null>();
    return settings || emptySettings;
  } catch { return emptySettings; }
});

function normalizePath(path: string) { return path !== "/" ? path.replace(/\/+$/, "") : "/"; }

export async function getPageSeo(path: string): Promise<ISeoPageSettings | undefined> {
  const settings = await getSeoSettings();
  const normalized = normalizePath(path);
  return settings.pages.find((page) => normalizePath(page.path) === normalized);
}

export async function applySeoMetadata(path: string, defaults: Metadata): Promise<Metadata> {
  const seo = await getPageSeo(path);
  if (!seo) return defaults;
  const fallbackTitle = typeof defaults.title === "string" ? defaults.title : undefined;
  const fallbackDescription = defaults.description || undefined;
  const title = seo.title || fallbackTitle;
  const description = seo.description || fallbackDescription;
  const canonicalOverride = seo.canonicalUrl ? new URL(seo.canonicalUrl, site.url) : undefined;
  const canonical = canonicalOverride || defaults.alternates?.canonical;
  const defaultOg = defaults.openGraph;
  const image = seo.openGraphImage || (defaultOg && "images" in defaultOg ? defaultOg.images : undefined);
  const defaultTwitter = defaults.twitter;
  const openGraphTitle = seo.openGraphTitle || title;
  const openGraphDescription = seo.openGraphDescription || description;
  return {
    ...defaults,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(seo.keywords?.length ? { keywords: seo.keywords } : {}),
    alternates: { ...defaults.alternates, ...(canonical ? { canonical } : {}) },
    openGraph: {
      ...defaultOg,
      title: openGraphTitle,
      description: openGraphDescription,
      ...(canonicalOverride ? { url: canonicalOverride } : {}),
      ...(image ? { images: image } : {}),
    },
    twitter: {
      ...defaultTwitter,
      title: openGraphTitle || defaultTwitter?.title,
      description: openGraphDescription || defaultTwitter?.description,
      ...(seo.openGraphImage ? { images: [seo.openGraphImage] } : {}),
      ...(seo.openGraphImage ? { card: "summary_large_image" as const } : {}),
    },
  };
}

