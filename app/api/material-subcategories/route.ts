import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { canAccessCourse, canAccessCourseMaterials, userCourses } from "@/lib/materials";
import { parseSubcategoryFields, toSubcategoryRecord } from "@/lib/material-subcategories";
import { connectMongoDB } from "@/lib/mongodb";
import { MaterialSubcategory } from "@/models/MaterialSubcategory";
import { courseNameVariants } from "@/lib/courses";

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request);
  if (!auth.ok) return auth.response;
  if (auth.user.role === "student" && auth.user.courseStatus !== "completed") return apiError("Course materials are locked until your course is marked as completed", 403);
  await connectMongoDB();
  const selectedCourse = request.nextUrl.searchParams.get("course")?.trim();
  if (selectedCourse && !canAccessCourseMaterials(auth.user, selectedCourse)) return apiError("You cannot access subcategories for this course", 403);
  const allowedCourses = userCourses(auth.user);
  const allowedCourseNames = courseNameVariants(allowedCourses);
  const selectedCourseNames = selectedCourse ? courseNameVariants([selectedCourse]) : [];
  const filter = selectedCourse
    ? { $or: [{ courses: { $in: selectedCourseNames } }, { course: { $in: selectedCourseNames } }] }
    : auth.user.role === "admin"
      ? {}
      : { $or: [{ courses: { $in: allowedCourseNames } }, { course: { $in: allowedCourseNames } }] };
  const subcategories = await MaterialSubcategory.find(filter).sort({ course: 1, name: 1 });
  return apiSuccess("Subcategories retrieved", { subcategories: subcategories.map(toSubcategoryRecord) });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  let body: unknown; try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = parseSubcategoryFields(body);
  if (!("data" in parsed)) return apiError(parsed.error, 400);
  if (!parsed.data.courses.every((course) => canAccessCourse(auth.user, course))) return apiError("You cannot create subcategories for one or more selected courses", 403);
  try {
    await connectMongoDB();
    const duplicate = await MaterialSubcategory.exists({
      normalizedName: parsed.data.normalizedName,
      $or: [{ courses: { $in: parsed.data.courses } }, { course: { $in: parsed.data.courses } }],
    });
    if (duplicate) return apiError("This subcategory already exists in one or more selected courses", 409);
    const subcategory = await MaterialSubcategory.create({ ...parsed.data, createdBy: auth.user._id });
    return apiSuccess("Subcategory created", { subcategory: toSubcategoryRecord(subcategory) }, 201);
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) return apiError("This subcategory already exists in one or more selected courses", 409);
    return apiError("Unable to create subcategory", 500);
  }
}
