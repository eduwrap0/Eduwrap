import type { UserDocument } from "@/models/User";
import type { CourseMaterialDocument } from "@/models/CourseMaterial";
import type { CourseMaterialRecord, MaterialCategory } from "@/types/materials";
import { canonicalCourseName } from "@/lib/courses";

export function userCourses(user: Pick<UserDocument, "course" | "courses">): string[] {
  return [...new Set([...(user.courses || []), ...(user.course ? [user.course] : [])].map(canonicalCourseName).filter(Boolean))];
}

export function canAccessCourse(user: Pick<UserDocument, "role" | "course" | "courses">, course: string): boolean {
  return user.role === "admin" || userCourses(user).includes(canonicalCourseName(course));
}

export function canAccessCourseMaterials(
  user: Pick<UserDocument, "role" | "course" | "courses" | "courseStatus">,
  course: string,
): boolean {
  if (user.role === "student" && user.courseStatus !== "completed") return false;
  return canAccessCourse(user, course);
}

export function materialCourses(material: { course: string; courses?: string[] }): string[] {
  return [...new Set([...(material.courses || []), ...(material.course ? [material.course] : [])].map(canonicalCourseName).filter(Boolean))];
}

export function canAccessAnyCourseMaterials(
  user: Pick<UserDocument, "role" | "course" | "courses" | "courseStatus">,
  courses: string[],
): boolean {
  return courses.some((course) => canAccessCourseMaterials(user, course));
}

type ParsedMaterialFields =
  | { error: string }
  | { data: { title: string; description?: string; course: string; category: MaterialCategory } };

export function parseMaterialFields(input: { title?: unknown; description?: unknown; course?: unknown; category?: unknown }): ParsedMaterialFields {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const course = typeof input.course === "string" ? input.course.trim() : "";
  const category = input.category;
  if (title.length < 2 || title.length > 120) return { error: "Title must be between 2 and 120 characters." };
  if (description.length > 500) return { error: "Description must be no longer than 500 characters." };
  if (!course || course.length > 100) return { error: "Choose a valid course." };
  if (category !== "notes" && category !== "assignment") return { error: "Choose notes or assignment." };
  return { data: { title, description: description || undefined, course, category } };
}

export function toMaterialRecord(material: CourseMaterialDocument, uploaderName: string, subcategoryName?: string): CourseMaterialRecord {
  const courses = materialCourses(material);
  return { id: material._id.toString(), title: material.title, ...(material.description ? { description: material.description } : {}), course: courses[0] || material.course, courses, category: material.category, ...(material.subcategoryId ? { subcategoryId: material.subcategoryId.toString() } : {}), ...(subcategoryName ? { subcategoryName } : {}), fileType: material.fileType, originalName: material.originalName, mimeType: material.mimeType, bytes: material.bytes, uploadedBy: material.uploadedBy.toString(), uploaderName, createdAt: material.createdAt.toISOString(), updatedAt: material.updatedAt.toISOString() };
}
