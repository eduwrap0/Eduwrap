import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { deleteTestimonialThumbnail, uploadTestimonialThumbnail } from "@/lib/cloudinary";
import { MAX_TESTIMONIAL_THUMBNAIL_BYTES } from "@/lib/video-testimonial-limits";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema } from "@/lib/validators/auth";
import { toVideoTestimonialRecord } from "@/lib/video-testimonials";
import { VideoTestimonial } from "@/models/VideoTestimonial";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id); if (!id.success) return apiError("Invalid testimonial ID", 400);
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_TESTIMONIAL_THUMBNAIL_BYTES + 256 * 1024) return apiError("Thumbnail must be no larger than 5 MB.", 413);
  let form: FormData; try { form = await request.formData(); } catch { return apiError("Invalid thumbnail upload", 400); }
  const file = form.get("thumbnail"); if (!(file instanceof File)) return apiError("Choose a thumbnail image", 400);
  try {
    await connectMongoDB();
    const current = await VideoTestimonial.findById(id.data);
    if (!current) return apiError("Video testimonial not found", 404);
    const uploaded = await uploadTestimonialThumbnail(file);
    let updated;
    try {
      updated = await VideoTestimonial.findByIdAndUpdate(id.data, { $set: { thumbnailUrl: uploaded.url, thumbnailPublicId: uploaded.publicId } }, { returnDocument: "after", runValidators: true });
      if (!updated) throw new Error("Video testimonial not found");
    } catch (error) {
      await deleteTestimonialThumbnail(uploaded.publicId).catch(() => undefined);
      throw error;
    }
    let cleanupWarning = false;
    if (current.thumbnailPublicId) {
      try { cleanupWarning = !(await deleteTestimonialThumbnail(current.thumbnailPublicId)); }
      catch { cleanupWarning = true; }
    }
    revalidatePath("/");
    auditSecurityEvent("video_testimonial_thumbnail_updated", auth.user._id.toString(), updated._id.toString());
    return apiSuccess(cleanupWarning ? "Thumbnail updated, but the previous thumbnail could not be deleted from Cloudinary." : "Thumbnail updated", { testimonial: toVideoTestimonialRecord(updated.toObject()) });
  } catch (error) { return apiError(error instanceof Error ? error.message : "Unable to update thumbnail", 500); }
}
