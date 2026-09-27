import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { deleteGalleryImage } from "@/lib/cloudinary";
import { toGalleryRecord } from "@/lib/gallery";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema } from "@/lib/validators/auth";
import { galleryUpdateSchema } from "@/lib/validators/gallery";
import { GalleryImage } from "@/models/GalleryImage";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id); if (!id.success) return validationError(id.error);
  let body: unknown; try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = galleryUpdateSchema.safeParse(body); if (!parsed.success) return validationError(parsed.error);
  try {
    await connectMongoDB();
    const image = await GalleryImage.findByIdAndUpdate(id.data, { $set: parsed.data }, { returnDocument: "after", runValidators: true });
    if (!image) return apiError("Gallery image not found", 404);
    revalidatePath("/");
    auditSecurityEvent("gallery_image_updated", auth.user._id.toString(), image._id.toString());
    return apiSuccess("Image updated", { image: toGalleryRecord(image.toObject()) });
  } catch { return apiError("Unable to update gallery image", 500); }
}

export async function DELETE(request: NextRequest, context: Context) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id); if (!id.success) return validationError(id.error);
  try {
    await connectMongoDB();
    const image = await GalleryImage.findById(id.data);
    if (!image) return apiError("Gallery image not found", 404);
    const removed = await deleteGalleryImage(image.cloudinaryPublicId);
    if (!removed) return apiError("The image could not be removed from Cloudinary", 502);
    await image.deleteOne();
    revalidatePath("/");
    auditSecurityEvent("gallery_image_deleted", auth.user._id.toString(), image._id.toString());
    return apiSuccess("Image deleted", {});
  } catch { return apiError("Unable to delete gallery image", 500); }
}
