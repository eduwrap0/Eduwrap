import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { seoSettingsSchema } from "@/lib/validators/seo";
import { SeoSettings } from "@/models/SeoSettings";
import { deleteSeoOgImage } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  try {
    await connectMongoDB();
    const settings = await SeoSettings.findOne({ key: "global" }).lean();
    return apiSuccess("SEO settings retrieved", settings || { pages: [], sitewideTags: "" });
  } catch { return apiError("Unable to retrieve SEO settings", 500); }
}

export async function PUT(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = seoSettingsSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await connectMongoDB();
    const value = parsed.data;
    const previous = await SeoSettings.findOne({ key: "global" }).select("pages.path pages.openGraphImage").lean<{ pages?: Array<{ path: string; openGraphImage?: string }> } | null>();
    const pages = value.pages.map((page) => ({
      ...page,
      path: page.path !== "/" ? page.path.replace(/\/+$/, "") : "/",
      title: page.title || undefined,
      description: page.description || undefined,
      canonicalUrl: page.canonicalUrl || undefined,
      openGraphTitle: page.openGraphTitle || undefined,
      openGraphDescription: page.openGraphDescription || undefined,
      openGraphImage: page.openGraphImage || undefined,
      structuredData: page.structuredData || undefined,
      customTags: page.customTags || undefined,
    }));
    await SeoSettings.findOneAndUpdate(
      { key: "global" },
      { $set: { pages, sitewideTags: value.sitewideTags || undefined, updatedBy: auth.user._id }, $unset: { googleAnalyticsId: 1, googleTagManagerId: 1, metaPixelId: 1 } },
      { upsert: true, runValidators: true },
    );
    const retainedImages = new Set(pages.map((page) => page.openGraphImage).filter((url): url is string => Boolean(url)));
    const previousImages = (previous?.pages || []).flatMap((page) => page.openGraphImage ? [page.openGraphImage] : []);
    const replacedImages = [...new Set(previousImages.filter((url) => !retainedImages.has(url)))];
    const cleanup = await Promise.allSettled(replacedImages.map(deleteSeoOgImage));
    const cleanupFailed = cleanup.some((result) => result.status === "rejected");
    revalidatePath("/", "layout");
    return apiSuccess(cleanupFailed ? "SEO settings saved, but an old OG image could not be removed" : "SEO settings saved", { pages, sitewideTags: value.sitewideTags, cleanupWarning: cleanupFailed });
  } catch { return apiError("Unable to save SEO settings", 500); }
}
