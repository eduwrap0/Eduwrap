import assert from "node:assert/strict";
import test from "node:test";
import { blogText, sanitizeBlogHtml, slugifyBlogTitle } from "../lib/blog-content";
import { blogWriteSchema, publicBlogListQuerySchema } from "../lib/validators/blog";
import { BlogStatus } from "../types/blog";

const validBlog = {
  title: "A Complete Python Career Guide",
  slug: "a-complete-python-career-guide",
  excerpt: "A practical guide to learning Python and planning a technology career.",
  content: "<h2>Start here</h2><p>Build practical Python projects and review your progress every week.</p>",
  featuredImage: "https://res.cloudinary.com/demo/image/upload/eduwrap/blog-images/python.webp",
  featuredImageAlt: "Student learning Python programming",
  socialImage: "",
  courseIds: ["507f1f77bcf86cd799439011"],
  status: BlogStatus.Draft,
  featuredOnHome: false,
  seoTitle: "", metaDescription: "", focusKeyword: "", canonicalUrl: "",
};

test("blog slugs are deterministic and SEO friendly", () => {
  assert.equal(slugifyBlogTitle("  Python & AI: Career Guide! "), "python-and-ai-career-guide");
});

test("blog HTML sanitizer removes scripts, event handlers, and unsafe URLs", () => {
  const clean = sanitizeBlogHtml('<h2 onclick="alert(1)">Safe heading</h2><script>alert(1)</script><a href="javascript:alert(1)">bad</a><img src="https://evil.example/a.jpg" onerror="alert(1)">');
  assert.equal(clean.includes("script"), false);
  assert.equal(clean.includes("onclick"), false);
  assert.equal(clean.includes("javascript:"), false);
  assert.equal(clean.includes("evil.example"), false);
  assert.equal(blogText(clean).includes("Safe heading"), true);
});

test("blog validation accepts supported fields and rejects duplicate courses", () => {
  assert.equal(blogWriteSchema.safeParse(validBlog).success, true);
  assert.equal(blogWriteSchema.safeParse({ ...validBlog, courseIds: [validBlog.courseIds[0], validBlog.courseIds[0]] }).success, false);
});

test("public blog query accepts pagination and clean course filters", () => {
  const parsed = publicBlogListQuerySchema.parse({ page: "2", search: "python career", course: "web-development" });
  assert.equal(parsed.page, 2);
  assert.equal(publicBlogListQuerySchema.safeParse({ course: "{$ne:null}" }).success, false);
});
