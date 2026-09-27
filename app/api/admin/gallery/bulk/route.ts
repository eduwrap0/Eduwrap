import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { galleryBulkVisibilitySchema } from "@/lib/validators/gallery";
import { GalleryImage } from "@/models/GalleryImage";

export async function PATCH(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  let body: unknown; try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = galleryBulkVisibilitySchema.safeParse(body); if (!parsed.success) return validationError(parsed.error);
  try {
    await connectMongoDB();
    const result = await GalleryImage.updateMany({ _id: { $in: parsed.data.ids } }, { $set: { isPublic: parsed.data.isPublic } });
    if (!result.matchedCount) return apiError("No matching gallery images were found", 404);
    revalidatePath("/");
    auditSecurityEvent(parsed.data.isPublic ? "gallery_images_published" : "gallery_images_hidden", auth.user._id.toString(), parsed.data.ids.join(","));
    return apiSuccess(`${result.modifiedCount} image${result.modifiedCount === 1 ? "" : "s"} updated`, { modifiedCount: result.modifiedCount });
  } catch { return apiError("Unable to update gallery visibility", 500); }
}
