import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { deleteTestimonialVideo } from "@/lib/cloudinary";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema } from "@/lib/validators/auth";
import { videoTestimonialUpdateSchema } from "@/lib/validators/video-testimonial";
import { toVideoTestimonialRecord } from "@/lib/video-testimonials";
import { VideoTestimonial } from "@/models/VideoTestimonial";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id); if (!id.success) return validationError(id.error);
  let body: unknown; try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = videoTestimonialUpdateSchema.safeParse(body); if (!parsed.success) return validationError(parsed.error);
  try {
    await connectMongoDB(); const testimonial = await VideoTestimonial.findByIdAndUpdate(id.data, { $set: parsed.data }, { returnDocument: "after", runValidators: true });
    if (!testimonial) return apiError("Video testimonial not found", 404);
    revalidatePath("/"); auditSecurityEvent("video_testimonial_updated", auth.user._id.toString(), testimonial._id.toString());
    return apiSuccess("Video testimonial updated", { testimonial: toVideoTestimonialRecord(testimonial.toObject()) });
  } catch { return apiError("Unable to update video testimonial", 500); }
}

export async function DELETE(request: NextRequest, context: Context) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id); if (!id.success) return validationError(id.error);
  try {
    await connectMongoDB(); const testimonial = await VideoTestimonial.findById(id.data); if (!testimonial) return apiError("Video testimonial not found", 404);
    const removed = await deleteTestimonialVideo(testimonial.cloudinaryPublicId); if (!removed) return apiError("The video could not be removed from Cloudinary", 502);
    await testimonial.deleteOne(); revalidatePath("/"); auditSecurityEvent("video_testimonial_deleted", auth.user._id.toString(), testimonial._id.toString());
    return apiSuccess("Video testimonial deleted", {});
  } catch (error) { return apiError(error instanceof Error ? error.message : "Unable to delete video testimonial", 500); }
}
