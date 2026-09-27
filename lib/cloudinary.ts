import "server-only";
import { createHash } from "node:crypto";
import { MAX_TESTIMONIAL_VIDEO_BYTES, MAX_TESTIMONIAL_VIDEO_LABEL } from "@/lib/video-testimonial-limits";

const MAX_PROFILE_IMAGE_BYTES = 200 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_MATERIAL_TYPES = new Set([...ALLOWED_IMAGE_TYPES, "application/pdf"]);
const MAX_MATERIAL_BYTES = 1024 * 1024;
const MAX_BLOG_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_SEO_OG_IMAGE_BYTES = 100 * 1024;
const MAX_GALLERY_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_GALLERY_STORED_BYTES = 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary is not configured.");
  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) throw new Error("Cloudinary cloud name is invalid.");
  return { cloudName, apiKey, apiSecret };
}

function hasValidImageSignature(buffer: Buffer, type: string): boolean {
  if (type === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return type === "image/webp" && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
}

function hasValidMaterialSignature(buffer: Buffer, type: string): boolean {
  if (type === "application/pdf") return buffer.subarray(0, 5).toString() === "%PDF-";
  return hasValidImageSignature(buffer, type);
}

export interface UploadedCourseMaterial { url: string; publicId: string; resourceType: "image" | "raw"; bytes: number; fileType: "pdf" | "image"; }

export async function uploadCourseMaterial(file: File): Promise<UploadedCourseMaterial> {
  if (!ALLOWED_MATERIAL_TYPES.has(file.type)) throw new Error("Only PDF, JPG, PNG, and WebP files are allowed.");
  if (file.size === 0 || file.size > MAX_MATERIAL_BYTES) throw new Error("The file must be no larger than 1 MB.");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidMaterialSignature(buffer, file.type)) throw new Error("The uploaded file content does not match its file type.");
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "eduwrap/course-materials";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.set("file", new Blob([buffer], { type: file.type }), file.name);
  body.set("api_key", apiKey); body.set("timestamp", timestamp); body.set("folder", folder); body.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { secure_url?: string; public_id?: string; resource_type?: string; bytes?: number; error?: { message?: string } };
  if (!response.ok || !result.secure_url || !result.public_id) throw new Error(result.error?.message || "Cloudinary upload failed.");
  return { url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type === "raw" ? "raw" : "image", bytes: result.bytes || file.size, fileType: file.type === "application/pdf" ? "pdf" : "image" };
}

export async function deleteCourseMaterial(publicId: string, resourceType: "image" | "raw"): Promise<boolean> {
  if (!publicId.startsWith("eduwrap/course-materials/")) return false;
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.set("public_id", publicId); body.set("api_key", apiKey); body.set("timestamp", timestamp); body.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { result?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || "Cloudinary file deletion failed.");
  return result.result === "ok" || result.result === "not found";
}

export async function uploadProfileImage(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("Only JPG, PNG, and WebP images are allowed.");
  if (file.size === 0 || file.size > MAX_PROFILE_IMAGE_BYTES) throw new Error("Profile image must be no larger than 200 KB after compression.");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidImageSignature(buffer, file.type)) throw new Error("The uploaded file is not a valid image.");

  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "eduwrap/profile-images";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.set("file", new Blob([buffer], { type: file.type }), file.name);
  body.set("api_key", apiKey);
  body.set("timestamp", timestamp);
  body.set("folder", folder);
  body.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { secure_url?: string; bytes?: number; error?: { message?: string } };
  if (!response.ok || !result.secure_url) throw new Error(result.error?.message || "Cloudinary upload failed.");
  if (typeof result.bytes === "number" && result.bytes > MAX_PROFILE_IMAGE_BYTES) throw new Error("Cloudinary returned an image larger than 200 KB.");
  return result.secure_url;
}

function profileImagePublicId(imageUrl: string, cloudName: string): string | null {
  try {
    const url = new URL(imageUrl);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return null;
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (parts[0] !== cloudName || parts[1] !== "image" || parts[2] !== "upload") return null;
    const assetParts = parts.slice(3);
    if (/^v\d+$/.test(assetParts[0] || "")) assetParts.shift();
    if (assetParts[0] !== "eduwrap" || assetParts[1] !== "profile-images" || assetParts.length < 3) return null;
    const publicId = assetParts.join("/").replace(/\.[a-zA-Z0-9]+$/, "");
    return publicId.startsWith("eduwrap/profile-images/") ? publicId : null;
  } catch {
    return null;
  }
}

export async function deleteProfileImage(imageUrl: string): Promise<boolean> {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const publicId = profileImagePublicId(imageUrl, cloudName);
  if (!publicId) return false;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.set("public_id", publicId);
  body.set("api_key", apiKey);
  body.set("timestamp", timestamp);
  body.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { result?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || "Cloudinary image deletion failed.");
  return result.result === "ok" || result.result === "not found";
}

export async function uploadBlogImage(file: File): Promise<{ url: string; width: number; height: number }> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("Only JPG, PNG, and WebP blog images are allowed.");
  if (!/\.(?:jpe?g|png|webp)$/i.test(file.name)) throw new Error("The image filename must use JPG, PNG, or WebP.");
  if (file.size === 0 || file.size > MAX_BLOG_IMAGE_BYTES) throw new Error("Blog images must be no larger than 5 MB.");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidImageSignature(buffer, file.type)) throw new Error("The uploaded file is not a valid image.");
  const metadata = await (await import("sharp")).default(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  if (width < 640 || height < 360) throw new Error("Blog images must be at least 640 × 360 pixels.");
  if (width > 10000 || height > 10000) throw new Error("Blog image dimensions are too large.");

  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "eduwrap/blog-images";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.set("file", new Blob([buffer], { type: file.type }), file.name);
  body.set("api_key", apiKey); body.set("timestamp", timestamp); body.set("folder", folder); body.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { secure_url?: string; width?: number; height?: number; error?: { message?: string } };
  if (!response.ok || !result.secure_url) throw new Error(result.error?.message || "Cloudinary upload failed.");
  return { url: result.secure_url, width: result.width || width, height: result.height || height };
}

export async function deleteBlogImage(imageUrl: string): Promise<boolean> {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  let publicId: string;
  try {
    const url = new URL(imageUrl);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return false;
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (parts[0] !== cloudName || parts[1] !== "image" || parts[2] !== "upload") return false;
    const assets = parts.slice(3);
    if (/^v\d+$/.test(assets[0] || "")) assets.shift();
    publicId = assets.join("/").replace(/\.[a-zA-Z0-9]+$/, "");
    if (!publicId.startsWith("eduwrap/blog-images/")) return false;
  } catch { return false; }
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.set("public_id", publicId); body.set("api_key", apiKey); body.set("timestamp", timestamp); body.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { result?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || "Cloudinary image deletion failed.");
  return result.result === "ok" || result.result === "not found";
}

export async function uploadSeoOgImage(file: File): Promise<{ url: string; width: number; height: number }> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("Only JPG, PNG, and WebP OG images are allowed.");
  if (!/\.(?:jpe?g|png|webp)$/i.test(file.name)) throw new Error("The image filename must use JPG, PNG, or WebP.");
  if (file.size === 0 || file.size > MAX_SEO_OG_IMAGE_BYTES) throw new Error("OG images must be no larger than 100 KB.");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidImageSignature(buffer, file.type)) throw new Error("The uploaded file is not a valid image.");
  const metadata = await (await import("sharp")).default(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  if (!width || !height) throw new Error("The OG image dimensions could not be read.");

  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "eduwrap/seo-og-images";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.set("file", new Blob([buffer], { type: file.type }), file.name);
  body.set("api_key", apiKey); body.set("timestamp", timestamp); body.set("folder", folder); body.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { secure_url?: string; public_id?: string; width?: number; height?: number; bytes?: number; error?: { message?: string } };
  if (!response.ok || !result.secure_url || !result.public_id) throw new Error(result.error?.message || "Cloudinary upload failed.");
  if (typeof result.bytes === "number" && result.bytes > MAX_SEO_OG_IMAGE_BYTES) {
    await deleteSeoOgImage(result.secure_url).catch(() => undefined);
    throw new Error("The stored OG image exceeded 100 KB.");
  }
  return { url: result.secure_url, width: result.width || width, height: result.height || height };
}

export async function deleteSeoOgImage(imageUrl: string): Promise<boolean> {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  let publicId: string;
  try {
    const url = new URL(imageUrl);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return false;
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (parts[0] !== cloudName || parts[1] !== "image" || parts[2] !== "upload") return false;
    const assets = parts.slice(3);
    if (/^v\d+$/.test(assets[0] || "")) assets.shift();
    publicId = assets.join("/").replace(/\.[a-zA-Z0-9]+$/, "");
    if (!publicId.startsWith("eduwrap/seo-og-images/")) return false;
  } catch { return false; }
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.set("public_id", publicId); body.set("api_key", apiKey); body.set("timestamp", timestamp); body.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { result?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || "Cloudinary OG image deletion failed.");
  return result.result === "ok" || result.result === "not found";
}

export interface UploadedGalleryImage { url: string; publicId: string; }

async function compressGalleryImage(buffer: Buffer, fileName: string): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const source = sharp(buffer, { limitInputPixels: 40_000_000 }).rotate();
  await source.metadata();
  const widths: Array<number | undefined> = [undefined, 3000, 2400, 1920, 1600, 1280, 960];
  const qualities = [82, 72, 62, 52, 42, 32, 24, 16];
  for (const width of widths) {
    for (const quality of qualities) {
      let pipeline = source.clone();
      if (width) pipeline = pipeline.resize({ width, height: width, fit: "inside", withoutEnlargement: true });
      const compressed = await pipeline.webp({ quality, effort: 4 }).toBuffer();
      if (compressed.length <= MAX_GALLERY_STORED_BYTES) return compressed;
    }
  }
  throw new Error(`${fileName}: the image could not be compressed below 1 MB.`);
}

export async function uploadGalleryImage(file: File): Promise<UploadedGalleryImage> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error(`${file.name}: only JPG, PNG, and WebP images are allowed.`);
  if (!/\.(?:jpe?g|png|webp)$/i.test(file.name)) throw new Error(`${file.name}: the filename must use JPG, PNG, or WebP.`);
  if (file.size === 0 || file.size > MAX_GALLERY_SOURCE_BYTES) throw new Error(`${file.name}: source images must be no larger than 25 MB.`);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidImageSignature(buffer, file.type)) throw new Error(`${file.name}: the file content is not a valid image.`);
  const compressed = await compressGalleryImage(buffer, file.name);

  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "eduwrap/gallery";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  const compressedBytes = new Uint8Array(compressed.length);
  compressedBytes.set(compressed);
  body.set("file", new Blob([compressedBytes], { type: "image/webp" }), file.name.replace(/\.[^.]+$/, "") + ".webp");
  body.set("api_key", apiKey); body.set("timestamp", timestamp); body.set("folder", folder); body.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { secure_url?: string; public_id?: string; bytes?: number; error?: { message?: string } };
  if (!response.ok || !result.secure_url || !result.public_id) throw new Error(`${file.name}: ${result.error?.message || "Cloudinary upload failed."}`);
  if (typeof result.bytes === "number" && result.bytes > MAX_GALLERY_STORED_BYTES) {
    await deleteGalleryImage(result.public_id).catch(() => undefined);
    throw new Error(`${file.name}: the stored image exceeded 1 MB.`);
  }
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteGalleryImage(publicId: string): Promise<boolean> {
  if (!publicId.startsWith("eduwrap/gallery/")) return false;
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.set("public_id", publicId); body.set("api_key", apiKey); body.set("timestamp", timestamp); body.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { result?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || "Cloudinary image deletion failed.");
  return result.result === "ok" || result.result === "not found";
}

function hasValidVideoSignature(buffer: Buffer, type: string): boolean {
  if (type === "video/webm") return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return buffer.subarray(4, 8).toString() === "ftyp";
}

export async function uploadTestimonialVideo(file: File): Promise<{ url: string; publicId: string }> {
  if (!ALLOWED_VIDEO_TYPES.has(file.type)) throw new Error("Only MP4, WebM, and MOV videos are allowed.");
  if (!/\.(?:mp4|webm|mov)$/i.test(file.name)) throw new Error("The video filename must use MP4, WebM, or MOV.");
  if (file.size === 0 || file.size > MAX_TESTIMONIAL_VIDEO_BYTES) throw new Error(`Video must be no larger than ${MAX_TESTIMONIAL_VIDEO_LABEL}.`);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidVideoSignature(buffer, file.type)) throw new Error("The uploaded file is not a valid video.");

  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "eduwrap/video-testimonials";
  const eager = "f_mp4,q_auto:good,vc_auto";
  const eagerAsync = "true";
  const signature = createHash("sha1").update(`eager=${eager}&eager_async=${eagerAsync}&folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.set("file", new Blob([buffer], { type: file.type }), file.name);
  body.set("api_key", apiKey); body.set("timestamp", timestamp); body.set("folder", folder);
  body.set("eager", eager); body.set("eager_async", eagerAsync); body.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { secure_url?: string; public_id?: string; error?: { message?: string } };
  if (!response.ok || !result.secure_url || !result.public_id) throw new Error(result.error?.message || "Cloudinary video upload failed.");
  const url = result.secure_url.replace("/video/upload/", "/video/upload/f_mp4,q_auto:good,vc_auto/").replace(/\.[a-z0-9]+$/i, ".mp4");
  return { url, publicId: result.public_id };
}

export async function deleteTestimonialVideo(publicId: string): Promise<boolean> {
  if (!publicId.startsWith("eduwrap/video-testimonials/")) return false;
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.set("public_id", publicId); body.set("api_key", apiKey); body.set("timestamp", timestamp); body.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/destroy`, { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { result?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || "Cloudinary video deletion failed.");
  return result.result === "ok" || result.result === "not found";
}
