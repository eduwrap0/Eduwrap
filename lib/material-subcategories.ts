import { canonicalCourseName } from "@/lib/courses";

type ParsedSubcategoryFields = { error: string } | { data: { course: string; courses: string[]; name: string; normalizedName: string } };

export function parseSubcategoryFields(body: unknown): ParsedSubcategoryFields {
  const value = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const courses = [...new Set((Array.isArray(value.courses) ? value.courses : [value.course])
    .filter((course): course is string => typeof course === "string")
    .map(canonicalCourseName)
    .filter(Boolean))];
  const name = typeof value.name === "string" ? value.name.trim().replace(/\s+/g, " ") : "";
  if (!courses.length || courses.length > 50 || courses.some((course) => course.length > 100)) return { error: "Choose at least one valid course." };
  if (!name || name.length > 60) return { error: "Subcategory name must be between 1 and 60 characters." };
  return { data: { course: courses[0], courses, name, normalizedName: name.toLocaleLowerCase("en-IN") } };
}

export function subcategoryCourses(item: { course: string; courses?: string[] }): string[] {
  return [...new Set([...(item.courses || []), ...(item.course ? [item.course] : [])].map(canonicalCourseName).filter(Boolean))];
}

export function toSubcategoryRecord(item: { _id: { toString(): string }; course: string; courses?: string[]; name: string; createdAt: Date }) {
  const courses = subcategoryCourses(item);
  return { id: item._id.toString(), course: courses[0] || item.course, courses, name: item.name, createdAt: item.createdAt.toISOString() };
}
