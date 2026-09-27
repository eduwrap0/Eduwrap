import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { deleteTestimonialVideo, uploadTestimonialVideo } from "@/lib/cloudinary";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { videoTestimonialFieldsSchema } from "@/lib/validators/video-testimonial";
import { MAX_TESTIMONIAL_UPLOAD_BODY_BYTES, MAX_TESTIMONIAL_VIDEO_LABEL } from "@/lib/video-testimonial-limits";
import { toVideoTestimonialRecord } from "@/lib/video-testimonials";
import { VideoTestimonial } from "@/models/VideoTestimonial";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  try { await connectMongoDB(); const videos = await VideoTestimonial.find().sort({ displayOrder: 1, uploadDate: -1 }).lean(); return apiSuccess("Video testimonials retrieved", { testimonials: videos.map(toVideoTestimonialRecord) }); }
  catch { return apiError("Unable to retrieve video testimonials", 500); }
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_TESTIMONIAL_UPLOAD_BODY_BYTES) return apiError(`Video upload must be no larger than ${MAX_TESTIMONIAL_VIDEO_LABEL}.`, 413);
  let form: FormData; try { form = await request.formData(); } catch { return apiError("Invalid upload form", 400); }
  const video = form.get("video"); if (!(video instanceof File)) return apiError("Choose a video to upload", 400);
  let details: unknown; try { details = JSON.parse(String(form.get("details") || "{}")); } catch { return apiError("Testimonial details are invalid", 400); }
  const parsed = videoTestimonialFieldsSchema.safeParse(details); if (!parsed.success) return validationError(parsed.error);
  let uploaded: { url: string; publicId: string };
  try { uploaded = await uploadTestimonialVideo(video); }
  catch (error) { return apiError(error instanceof Error ? error.message : "Unable to upload video", 400); }
  try {
    await connectMongoDB();
    const testimonial = await VideoTestimonial.create({ ...parsed.data, videoUrl: uploaded.url, cloudinaryPublicId: uploaded.publicId, uploadDate: new Date(), uploadedBy: auth.user._id });
    revalidatePath("/"); auditSecurityEvent("video_testimonial_created", auth.user._id.toString(), testimonial._id.toString());
    return apiSuccess("Video testimonial uploaded", { testimonial: toVideoTestimonialRecord(testimonial.toObject()) }, 201);
  } catch {
    await deleteTestimonialVideo(uploaded.publicId).catch(() => undefined);
    return apiError("The testimonial could not be saved. The uploaded video was cleaned up.", 500);
  }
}
