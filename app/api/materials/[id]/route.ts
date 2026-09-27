import mongoose from "mongoose";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { deleteCourseMaterial, uploadCourseMaterial } from "@/lib/cloudinary";
import { canAccessCourse, parseMaterialFields, toMaterialRecord } from "@/lib/materials";
import { subcategoryCourses } from "@/lib/material-subcategories";
import { connectMongoDB } from "@/lib/mongodb";
import { CourseMaterial } from "@/models/CourseMaterial";
import { MaterialSubcategory } from "@/models/MaterialSubcategory";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

async function editable(request: NextRequest, id: string) {
  const auth = await authorizeApi(request, ["admin", "faculty"]);
  if (!auth.ok) return { response: auth.response };
  if (!mongoose.isValidObjectId(id)) return { response: apiError("Material not found", 404) };
  await connectMongoDB();
  const material = await CourseMaterial.findById(id);
  if (!material) return { response: apiError("Material not found", 404) };
  if (auth.user.role === "faculty" && material.uploadedBy.toString() !== auth.user._id.toString()) return { response: apiError("You can only manage materials you uploaded", 403) };
  return { auth, material };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const result = await editable(request, (await params).id);
  if ("response" in result) return result.response;
  let body: unknown;
  let replacementFile: File | undefined;
  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      body = { title: form.get("title"), description: form.get("description"), course: form.get("course"), category: form.get("category"), subcategoryId: form.get("subcategoryId") };
      const candidate = form.get("file");
      if (candidate instanceof File && candidate.size > 0) replacementFile = candidate;
    } else body = await request.json();
  } catch { return apiError("Invalid request", 400); }
  const parsed = parseMaterialFields((body && typeof body === "object" ? body : {}) as Record<string, unknown>);
  if (!("data" in parsed)) return apiError(parsed.error, 400);
  if (!canAccessCourse(result.auth.user, parsed.data.course)) return apiError("You cannot assign materials to this course", 403);
  const subcategoryId = body && typeof body === "object" && "subcategoryId" in body ? (body as { subcategoryId?: unknown }).subcategoryId : undefined;
  if (typeof subcategoryId !== "string" || !mongoose.isValidObjectId(subcategoryId)) return apiError("Choose a valid course subcategory", 400);
  const subcategory = await MaterialSubcategory.findById(subcategoryId);
  if (!subcategory) return apiError("The selected subcategory was not found", 400);
  const sharedCourses = subcategoryCourses(subcategory);
  if (!sharedCourses.includes(parsed.data.course)) return apiError("The selected subcategory does not belong to this course", 400);
  let uploaded: Awaited<ReturnType<typeof uploadCourseMaterial>> | undefined;
  const previousFile = { publicId: result.material.cloudinaryPublicId, resourceType: result.material.cloudinaryResourceType };
  try {
    if (replacementFile) uploaded = await uploadCourseMaterial(replacementFile);
    result.material.set({
      ...parsed.data,
      course: sharedCourses[0],
      courses: sharedCourses,
      subcategoryId: subcategory._id,
      ...(uploaded && replacementFile ? { originalName: replacementFile.name.slice(0, 255), mimeType: replacementFile.type, bytes: uploaded.bytes, fileType: uploaded.fileType, cloudinaryUrl: uploaded.url, cloudinaryPublicId: uploaded.publicId, cloudinaryResourceType: uploaded.resourceType } : {}),
    });
    await result.material.save();
  } catch (error) {
    if (uploaded) { try { await deleteCourseMaterial(uploaded.publicId, uploaded.resourceType); } catch { /* best-effort rollback */ } }
    const message = error instanceof Error ? error.message : "Unable to update material";
    const unavailable = message.includes("Cloudinary is not configured") || message.includes("cloud name is invalid");
    return apiError(unavailable ? "Course material storage is not configured" : message, unavailable ? 503 : 400);
  }
  if (uploaded) { try { await deleteCourseMaterial(previousFile.publicId, previousFile.resourceType); } catch { /* updated material remains valid; old asset cleanup can be retried */ } }
  return apiSuccess(uploaded ? "Material and file updated" : "Material updated", { material: toMaterialRecord(result.material, result.auth.user.name, subcategory.name) });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const result = await editable(request, (await params).id);
  if ("response" in result) return result.response;
  try {
    await deleteCourseMaterial(result.material.cloudinaryPublicId, result.material.cloudinaryResourceType);
    await result.material.deleteOne();
    return apiSuccess("Material deleted", {});
  } catch { return apiError("Unable to delete material", 500); }
}
