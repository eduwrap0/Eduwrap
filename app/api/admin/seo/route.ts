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
    await SeoSettings.collection.updateOne({ key: "global" }, { $unset: { sitewideTags: 1, "pages.$[].customTags": 1, "pages.$[].structuredData": 1 } });
    const settings = await SeoSettings.findOne({ key: "global" }).select("pages.path pages.title pages.description pages.keywords pages.canonicalUrl pages.openGraphTitle pages.openGraphDescription pages.openGraphImage").lean();
    return apiSuccess("SEO settings retrieved", settings || { pages: [] });
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
    }));
    await SeoSettings.findOneAndUpdate(
      { key: "global" },
      { $set: { pages, updatedBy: auth.user._id }, $unset: { sitewideTags: 1, googleAnalyticsId: 1, googleTagManagerId: 1, metaPixelId: 1 } },
      { upsert: true, runValidators: true },
    );
    const retainedImages = new Set(pages.map((page) => page.openGraphImage).filter((url): url is string => Boolean(url)));
    const previousImages = (previous?.pages || []).flatMap((page) => page.openGraphImage ? [page.openGraphImage] : []);
    const replacedImages = [...new Set(previousImages.filter((url) => !retainedImages.has(url)))];
    const cleanup = await Promise.allSettled(replacedImages.map(deleteSeoOgImage));
    const cleanupFailed = cleanup.some((result) => result.status === "rejected");
    revalidatePath("/", "layout");
    return apiSuccess(cleanupFailed ? "SEO settings saved, but an old OG image could not be removed" : "SEO settings saved", { pages, cleanupWarning: cleanupFailed });
  } catch { return apiError("Unable to save SEO settings", 500); }
}
