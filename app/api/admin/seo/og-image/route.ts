import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { uploadSeoOgImage } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return apiError("Choose an OG image to upload", 400);
    return apiSuccess("OG image uploaded", await uploadSeoOgImage(file), 201);
  } catch (error) { return apiError(error instanceof Error ? error.message : "Unable to upload OG image", 400); }
}
