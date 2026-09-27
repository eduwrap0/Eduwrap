import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).default("");
const pathSchema = z.string().trim().min(1).max(300).refine((value) => value.startsWith("/") && !value.includes("?") && !value.includes("#"), "Use a path beginning with / without a query string or fragment");
const optionalUrl = z.string().trim().max(2048).refine((value) => !value || /^https?:\/\//i.test(value) || value.startsWith("/"), "Use an absolute HTTP(S) URL or a root-relative URL").default("");
const structuredData = z.string().trim().max(50000).refine((value) => {
  if (!value) return true;
  try { const parsed: unknown = JSON.parse(value); return typeof parsed === "object" && parsed !== null; } catch { return false; }
}, "Structured data must be valid JSON containing an object or array").default("");

export const seoPageSchema = z.object({
  path: pathSchema,
  title: optionalText(70),
  description: optionalText(320),
  keywords: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  canonicalUrl: optionalUrl,
  openGraphTitle: optionalText(100),
  openGraphDescription: optionalText(300),
  openGraphImage: optionalUrl,
  structuredData,
  customTags: z.string().max(100000).default(""),
});

export const seoSettingsSchema = z.object({
  pages: z.array(seoPageSchema).max(500).superRefine((pages, ctx) => {
    const seen = new Set<string>();
    pages.forEach((page, index) => {
      const normalized = page.path !== "/" ? page.path.replace(/\/+$/, "") : "/";
      if (seen.has(normalized)) ctx.addIssue({ code: "custom", message: "Each page path must be unique", path: [index, "path"] });
      seen.add(normalized);
    });
  }),
  sitewideTags: z.string().max(100000).default(""),
});

export type SeoSettingsInput = z.infer<typeof seoSettingsSchema>;
