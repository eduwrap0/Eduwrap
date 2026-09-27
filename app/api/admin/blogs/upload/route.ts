import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { uploadBlogImage } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return apiError("Choose an image to upload", 400);
    return apiSuccess("Blog image uploaded", await uploadBlogImage(file), 201);
  } catch (error) { return apiError(error instanceof Error ? error.message : "Unable to upload blog image", 400); }
}
