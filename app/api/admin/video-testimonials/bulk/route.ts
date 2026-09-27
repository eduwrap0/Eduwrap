import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { videoTestimonialBulkSchema } from "@/lib/validators/video-testimonial";
import { VideoTestimonial } from "@/models/VideoTestimonial";

export async function PATCH(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  let body: unknown; try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = videoTestimonialBulkSchema.safeParse(body); if (!parsed.success) return validationError(parsed.error);
  try {
    await connectMongoDB();
    const result = await VideoTestimonial.updateMany({ _id: { $in: parsed.data.ids } }, { $set: { isActive: parsed.data.isActive } });
    if (!result.matchedCount) return apiError("No matching testimonials were found", 404);
    revalidatePath("/"); auditSecurityEvent(parsed.data.isActive ? "video_testimonials_published" : "video_testimonials_hidden", auth.user._id.toString(), parsed.data.ids.join(","));
    return apiSuccess(`${result.modifiedCount} testimonial${result.modifiedCount === 1 ? "" : "s"} updated`, { modifiedCount: result.modifiedCount });
  } catch { return apiError("Unable to update testimonial visibility", 500); }
}
