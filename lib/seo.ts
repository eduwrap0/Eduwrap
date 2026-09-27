import "server-only";
import type { Metadata } from "next";
import { cache } from "react";
import { site } from "@/content/site";
import { connectMongoDB } from "@/lib/mongodb";
import { SeoSettings, type ISeoPageSettings, type ISeoSettings } from "@/models/SeoSettings";

export type SeoSettingsRecord = Pick<ISeoSettings, "pages" | "sitewideTags">;

const emptySettings: SeoSettingsRecord = { pages: [] };

export const getSeoSettings = cache(async (): Promise<SeoSettingsRecord> => {
  try {
    await connectMongoDB();
    const settings = await SeoSettings.findOne({ key: "global" }).lean<SeoSettingsRecord | null>();
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
  return {
    ...defaults,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(seo.keywords?.length ? { keywords: seo.keywords } : {}),
    alternates: { ...defaults.alternates, ...(canonical ? { canonical } : {}) },
    openGraph: {
      ...defaultOg,
      title: seo.openGraphTitle || title,
      description: seo.openGraphDescription || description,
      ...(canonicalOverride ? { url: canonicalOverride } : {}),
      ...(image ? { images: image } : {}),
    },
  };
}

export function parseStructuredData(value?: string): unknown[] {
  if (!value) return [];
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed : [parsed]; } catch { return []; }
}
