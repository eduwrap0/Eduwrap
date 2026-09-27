import mongoose from "mongoose";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { canAccessCourse } from "@/lib/materials";
import { connectMongoDB } from "@/lib/mongodb";
import { CourseMaterial } from "@/models/CourseMaterial";
import { MaterialSubcategory } from "@/models/MaterialSubcategory";
import { parseSubcategoryFields, subcategoryCourses, toSubcategoryRecord } from "@/lib/material-subcategories";

type Params = { params: Promise<{ id: string }> };

async function manageable(request: NextRequest, id: string) {
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return { response: auth.response };
  if (!mongoose.isValidObjectId(id)) return { response: apiError("Subcategory not found", 404) };
  await connectMongoDB();
  const subcategory = await MaterialSubcategory.findById(id);
  if (!subcategory) return { response: apiError("Subcategory not found", 404) };
  if (!subcategoryCourses(subcategory).every((course) => canAccessCourse(auth.user, course))) return { response: apiError("You cannot manage this shared subcategory", 403) };
  return { auth, subcategory };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const result = await manageable(request, (await params).id);
  if ("response" in result) return result.response;
  let body: unknown; try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = parseSubcategoryFields(body);
  if (!("data" in parsed)) return apiError(parsed.error, 400);
  if (!parsed.data.courses.every((course) => canAccessCourse(result.auth.user, course))) return apiError("You cannot assign this subcategory to one or more selected courses", 403);
  try {
    const duplicate = await MaterialSubcategory.exists({
      _id: { $ne: result.subcategory._id },
      normalizedName: parsed.data.normalizedName,
      $or: [{ courses: { $in: parsed.data.courses } }, { course: { $in: parsed.data.courses } }],
    });
    if (duplicate) return apiError("This subcategory already exists in one or more selected courses", 409);
    result.subcategory.set(parsed.data); await result.subcategory.save();
    await CourseMaterial.updateMany(
      { subcategoryId: result.subcategory._id },
      { $set: { course: parsed.data.course, courses: parsed.data.courses } },
    );
    return apiSuccess("Subcategory updated", { subcategory: toSubcategoryRecord(result.subcategory) });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) return apiError("This subcategory already exists in one or more selected courses", 409);
    return apiError("Unable to update subcategory", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const result = await manageable(request, (await params).id);
  if ("response" in result) return result.response;
  if (await CourseMaterial.exists({ subcategoryId: result.subcategory._id })) return apiError("Move or delete this subcategory's materials first", 409);
  await result.subcategory.deleteOne();
  return apiSuccess("Subcategory deleted", {});
}
