import assert from "node:assert/strict";
import test from "node:test";
import { courseBySlug, courses } from "@/content/courses";
import { getCourseFaqs } from "@/content/faqs";

test("renamed courses use their new public names and slugs", () => {
  const aiCourse = courseBySlug("artificial-intelligence-machine-learning");
  const basicComputerCourse = courseBySlug("basic-computer-course");

  assert.equal(aiCourse?.cardTitle, "Artificial Intelligence & Machine Learning");
  assert.equal(basicComputerCourse?.cardTitle, "Basic Computer Course");
  assert.equal(courseBySlug("generative-ai"), undefined);
  assert.equal(courseBySlug("advanced-computer"), undefined);
  assert.equal(courseBySlug("diploma-in-computer-application-dca"), undefined);
  assert.ok(getCourseFaqs(aiCourse?.slug || "").length > 0);
  assert.ok(getCourseFaqs(basicComputerCourse?.slug || "").length > 0);
  assert.equal(new Set(courses.map((course) => course.slug)).size, courses.length);
});
