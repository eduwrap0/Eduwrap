import mongoose from "mongoose";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { deleteCourseMaterial, uploadCourseMaterial } from "@/lib/cloudinary";
import { canAccessCourse, canAccessCourseMaterials, parseMaterialFields, toMaterialRecord, userCourses } from "@/lib/materials";
import { subcategoryCourses } from "@/lib/material-subcategories";
import { connectMongoDB } from "@/lib/mongodb";
import { CourseMaterial } from "@/models/CourseMaterial";
import { MaterialSubcategory } from "@/models/MaterialSubcategory";
import { User } from "@/models/User";
import { courseNameVariants } from "@/lib/courses";

export const runtime = "nodejs";

function safeRegex(value: string) { return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); }

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request);
  if (!auth.ok) return auth.response;
  if (auth.user.role === "student" && auth.user.courseStatus !== "completed") return apiError("Course materials are locked until your course is marked as completed", 403);
  try {
    await connectMongoDB();
    const allowedCourses = userCourses(auth.user);
    const allowedCourseNames = courseNameVariants(allowedCourses);
    if (auth.user.role !== "admin" && allowedCourses.length === 0) return apiSuccess("Materials retrieved", { materials: [] });
    const selectedCourse = request.nextUrl.searchParams.get("course")?.trim();
    const category = request.nextUrl.searchParams.get("category");
    const subcategoryId = request.nextUrl.searchParams.get("subcategory")?.trim();
    const search = request.nextUrl.searchParams.get("search")?.trim();
    if (selectedCourse && !canAccessCourseMaterials(auth.user, selectedCourse)) return apiError("You are not enrolled in this course", 403);
    const conditions: Record<string, unknown>[] = [];
    if (auth.user.role !== "admin") conditions.push({ $or: [{ courses: { $in: allowedCourseNames } }, { course: { $in: allowedCourseNames } }] });
    if (selectedCourse) {
      const selectedCourseNames = courseNameVariants([selectedCourse]);
      conditions.push({ $or: [{ courses: { $in: selectedCourseNames } }, { course: { $in: selectedCourseNames } }] });
    }
    if (category === "notes" || category === "assignment") conditions.push({ category });
    if (subcategoryId && mongoose.isValidObjectId(subcategoryId)) conditions.push({ subcategoryId });
    if (search) conditions.push({ $or: [{ title: safeRegex(search) }, { description: safeRegex(search) }, { originalName: safeRegex(search) }] });
    const filter: Record<string, unknown> = conditions.length ? { $and: conditions } : {};
    const materials = await CourseMaterial.find(filter).sort({ createdAt: -1 }).limit(250);
    const uploaderIds = [...new Set(materials.map((item) => item.uploadedBy.toString()))];
    const subcategoryIds = [...new Set(materials.flatMap((item) => item.subcategoryId ? [item.subcategoryId.toString()] : []))];
    const [uploaders, subcategories] = await Promise.all([
      uploaderIds.length ? User.find({ _id: { $in: uploaderIds } }).select("name") : [],
      subcategoryIds.length ? MaterialSubcategory.find({ _id: { $in: subcategoryIds } }).select("name") : [],
    ]);
    const names = new Map(uploaders.map((user) => [user._id.toString(), user.name]));
    const subcategoryNames = new Map(subcategories.map((item) => [item._id.toString(), item.name]));
    return apiSuccess("Materials retrieved", { materials: materials.map((item) => toMaterialRecord(item, names.get(item.uploadedBy.toString()) || "Former user", item.subcategoryId ? subcategoryNames.get(item.subcategoryId.toString()) : undefined)) });
  } catch { return apiError("Unable to retrieve materials", 500); }
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;
  let uploaded: Awaited<ReturnType<typeof uploadCourseMaterial>> | undefined;
  try {
    const form = await request.formData();
    const parsed = parseMaterialFields({ title: form.get("title"), description: form.get("description"), course: form.get("course"), category: form.get("category") });
    if (!("data" in parsed)) return apiError(parsed.error, 400);
    if (!canAccessCourse(auth.user, parsed.data.course)) return apiError("You cannot upload materials for this course", 403);
    const subcategoryId = form.get("subcategoryId");
    if (typeof subcategoryId !== "string" || !mongoose.isValidObjectId(subcategoryId)) return apiError("Choose a valid course subcategory", 400);
    await connectMongoDB();
    const subcategory = await MaterialSubcategory.findById(subcategoryId);
    if (!subcategory) return apiError("The selected subcategory was not found", 400);
    const sharedCourses = subcategoryCourses(subcategory);
    if (!sharedCourses.includes(parsed.data.course)) return apiError("The selected subcategory does not belong to this course", 400);
    const file = form.get("file");
    if (!(file instanceof File)) return apiError("Choose a PDF or image to upload", 400);
    uploaded = await uploadCourseMaterial(file);
    const material = await CourseMaterial.create({ ...parsed.data, course: sharedCourses[0], courses: sharedCourses, subcategoryId: subcategory._id, originalName: file.name.slice(0, 255), mimeType: file.type, bytes: uploaded.bytes, fileType: uploaded.fileType, cloudinaryUrl: uploaded.url, cloudinaryPublicId: uploaded.publicId, cloudinaryResourceType: uploaded.resourceType, uploadedBy: auth.user._id });
    return apiSuccess("Course material uploaded", { material: toMaterialRecord(material, auth.user.name, subcategory.name) }, 201);
  } catch (error) {
    if (uploaded) { try { await deleteCourseMaterial(uploaded.publicId, uploaded.resourceType); } catch { /* best-effort rollback */ } }
    const message = error instanceof Error ? error.message : "Unable to upload course material";
    const unavailable = message.includes("Cloudinary is not configured") || message.includes("cloud name is invalid");
    return apiError(unavailable ? "Course material storage is not configured" : message, unavailable ? 503 : 400);
  }
}
