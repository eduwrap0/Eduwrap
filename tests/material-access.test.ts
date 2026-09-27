import assert from "node:assert/strict";
import test from "node:test";
import { canAccessAnyCourseMaterials, canAccessCourseMaterials, materialCourses } from "../lib/materials";
import { parseSubcategoryFields, subcategoryCourses } from "../lib/material-subcategories";
import type { UserDocument } from "../models/User";

const user = (role: "admin" | "faculty" | "student", courseStatus: "ongoing" | "completed", courses: string[]) => ({
  role,
  courseStatus,
  courses,
  course: courses[0],
}) as Pick<UserDocument, "role" | "courseStatus" | "course" | "courses">;

test("ongoing students cannot access enrolled course materials", () => {
  assert.equal(canAccessCourseMaterials(user("student", "ongoing", ["Web Development"]), "Web Development"), false);
});

test("completed students can access only their enrolled course materials", () => {
  const student = user("student", "completed", ["Web Development"]);
  assert.equal(canAccessCourseMaterials(student, "Web Development"), true);
  assert.equal(canAccessCourseMaterials(student, "Graphic Design"), false);
});

test("staff material access remains scoped by role and assigned courses", () => {
  assert.equal(canAccessCourseMaterials(user("admin", "ongoing", []), "Graphic Design"), true);
  assert.equal(canAccessCourseMaterials(user("faculty", "ongoing", ["Graphic Design"]), "Graphic Design"), true);
  assert.equal(canAccessCourseMaterials(user("faculty", "ongoing", ["Graphic Design"]), "Web Development"), false);
});

test("shared subcategories normalize and retain multiple unique courses", () => {
  const parsed = parseSubcategoryFields({ name: "  Excel  ", courses: ["Basic Computer Course", "Data Analytics", "Basic Computer Course"] });
  assert.ok("data" in parsed);
  if (!("data" in parsed)) return;
  assert.deepEqual(parsed.data.courses, ["Basic Computer Course", "Data Analytics"]);
  assert.equal(parsed.data.course, "Basic Computer Course");
  assert.deepEqual(subcategoryCourses({ course: "Basic Computer Course", courses: ["Data Analytics"] }), ["Data Analytics", "Basic Computer Course"]);
});

test("one shared material is accessible through any assigned course", () => {
  const shared = materialCourses({ course: "Basic Computer Course", courses: ["Basic Computer Course", "Data Analytics", "Digital Marketing"] });
  assert.deepEqual(shared, ["Basic Computer Course", "Data Analytics", "Digital Marketing"]);
  assert.equal(canAccessAnyCourseMaterials(user("student", "completed", ["Data Analytics"]), shared), true);
  assert.equal(canAccessAnyCourseMaterials(user("student", "completed", ["Physics"]), shared), false);
});

test("legacy faculty course names match current shared subcategories", () => {
  const legacyFaculty = user("faculty", "ongoing", ["DCA (Diploma in Computer Applications)"]);
  assert.equal(canAccessCourseMaterials(legacyFaculty, "Basic Computer Course"), true);
  assert.deepEqual(materialCourses({ course: "DCA (Diploma in Computer Applications)" }), ["Basic Computer Course"]);
});
