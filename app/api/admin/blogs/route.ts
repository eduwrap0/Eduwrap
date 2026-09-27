import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { blogText, ensureBlogCourses, hydrateBlogPosts, sanitizeBlogHtml, type BlogPostSource } from "@/lib/blogs";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { adminBlogListQuerySchema, blogWriteSchema } from "@/lib/validators/blog";
import { BlogPost } from "@/models/BlogPost";
import { BlogSlugHistory } from "@/models/BlogSlugHistory";
import { Course } from "@/models/Course";
import { BlogStatus } from "@/types/blog";

export const runtime = "nodejs";

function duplicateKey(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && error.code === 11000; }

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  const parsed = adminBlogListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return validationError(parsed.error);
  try {
    await connectMongoDB();
    await ensureBlogCourses();
    const { page, limit, search, status, courseId } = parsed.data;
    const filter: Record<string, unknown> = {};
    if (status !== "ALL") filter.status = status;
    if (courseId) filter.courseIds = courseId;
    if (search) filter.$text = { $search: search };
    const [posts, total] = await Promise.all([
      BlogPost.find(filter).sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean<BlogPostSource[]>(),
      BlogPost.countDocuments(filter),
    ]);
    return apiSuccess("Blogs retrieved", { blogs: await hydrateBlogPosts(posts), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), hasNextPage: page * limit < total, hasPreviousPage: page > 1 } });
  } catch { return apiError("Unable to retrieve blogs", 500); }
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  let body: unknown; try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = blogWriteSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await connectMongoDB();
    await ensureBlogCourses();
    const [courseCount, historicalSlug] = await Promise.all([
      Course.countDocuments({ _id: { $in: parsed.data.courseIds } }),
      BlogSlugHistory.exists({ oldSlug: parsed.data.slug }),
    ]);
    if (courseCount !== parsed.data.courseIds.length) return apiError("One or more selected courses are invalid", 400);
    if (historicalSlug) return apiError("This slug is reserved by a previous blog URL", 409);
    const content = sanitizeBlogHtml(parsed.data.content);
    if (blogText(content).length < 20) return apiError("Blog content must contain at least 20 readable characters", 400);
    const published = parsed.data.status === BlogStatus.Published;
    const post = await BlogPost.create({
      ...parsed.data, content, authorId: auth.user._id,
      socialImage: parsed.data.socialImage || undefined, seoTitle: parsed.data.seoTitle || undefined,
      metaDescription: parsed.data.metaDescription || undefined, focusKeyword: parsed.data.focusKeyword || undefined,
      canonicalUrl: parsed.data.canonicalUrl || undefined, publishedAt: published ? new Date() : undefined,
    });
    revalidatePath("/"); revalidatePath("/blog"); revalidatePath("/sitemap.xml");
    for (const course of await Course.find({ _id: { $in: post.courseIds } }).select("slug").lean<Array<{ slug: string }>>()) revalidatePath(`/courses/${course.slug}`);
    auditSecurityEvent("blog_created", auth.user._id.toString(), post._id.toString());
    return apiSuccess(published ? "Blog published" : "Draft saved", { blog: (await hydrateBlogPosts([post.toObject() as BlogPostSource]))[0] }, 201);
  } catch (error) {
    if (duplicateKey(error)) return apiError("A blog with this slug already exists", 409);
    return apiError("Unable to create blog", 500);
  }
}
