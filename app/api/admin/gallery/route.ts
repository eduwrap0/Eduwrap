import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { deleteGalleryImage, uploadGalleryImage } from "@/lib/cloudinary";
import { toGalleryRecord } from "@/lib/gallery";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { GalleryImage } from "@/models/GalleryImage";

export const runtime = "nodejs";

interface UploadMetadata { altTag?: unknown; isPublic?: unknown; }

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  try {
    await connectMongoDB();
    const images = await GalleryImage.find().sort({ uploadDate: -1, _id: -1 }).lean();
    return apiSuccess("Gallery images retrieved", { images: images.map(toGalleryRecord) });
  } catch { return apiError("Unable to retrieve gallery images", 500); }
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;

  let form: FormData;
  try { form = await request.formData(); } catch { return apiError("Invalid upload form", 400); }
  const files = form.getAll("images").filter((entry): entry is File => entry instanceof File);
  if (!files.length) return apiError("Choose at least one image to upload", 400);
  if (files.length > 20) return apiError("Upload no more than 20 images at once", 400);
  if (files.reduce((total, file) => total + file.size, 0) > 100 * 1024 * 1024) return apiError("The selected batch must be no larger than 100 MB before compression", 400);

  let metadata: UploadMetadata[];
  try { metadata = JSON.parse(String(form.get("metadata") || "[]")) as UploadMetadata[]; }
  catch { return apiError("Image details are invalid", 400); }
  if (!Array.isArray(metadata) || metadata.length !== files.length) return apiError("Every image must include its upload details", 400);
  const normalized = metadata.map((item) => ({ altTag: typeof item.altTag === "string" ? item.altTag.trim() : "", isPublic: item.isPublic === true }));
  const invalidAlt = normalized.findIndex((item) => item.altTag.length < 2 || item.altTag.length > 180);
  if (invalidAlt >= 0) return apiError(`${files[invalidAlt].name}: alt tag must contain 2 to 180 characters`, 400);

  const uploaded = await Promise.allSettled(files.map(uploadGalleryImage));
  const successes = uploaded.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  const errors = uploaded.flatMap((result) => result.status === "rejected" ? [result.reason instanceof Error ? result.reason.message : "Image upload failed"] : []);
  if (errors.length) {
    await Promise.allSettled(successes.map((image) => deleteGalleryImage(image.publicId)));
    return apiError(errors.join(" "), 400);
  }

  try {
    await connectMongoDB();
    const uploadDate = new Date();
    const images = await GalleryImage.insertMany(successes.map((image, index) => ({
      imageUrl: image.url, cloudinaryPublicId: image.publicId, altTag: normalized[index].altTag,
      isPublic: normalized[index].isPublic, uploadDate, uploadedBy: auth.user._id,
    })));
    revalidatePath("/");
    auditSecurityEvent("gallery_images_uploaded", auth.user._id.toString(), images.map((image) => image._id.toString()).join(","));
    return apiSuccess(`${images.length} image${images.length === 1 ? "" : "s"} uploaded`, { images: images.map((image) => toGalleryRecord(image.toObject())) }, 201);
  } catch {
    await Promise.allSettled(successes.map((image) => deleteGalleryImage(image.publicId)));
    return apiError("Images could not be saved. Uploaded files were cleaned up.", 500);
  }
}
