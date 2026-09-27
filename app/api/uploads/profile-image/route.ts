import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { uploadProfileImage } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;

  try {
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File)) return apiError("Choose a profile image to upload", 400);
    const profileImageUrl = await uploadProfileImage(image);
    return apiSuccess("Profile image uploaded", { profileImageUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload profile image";
    const configurationError = message === "Cloudinary is not configured." || message === "Cloudinary cloud name is invalid.";
    return apiError(configurationError ? "Profile image service is not configured" : message, configurationError ? 503 : 400);
  }
}

