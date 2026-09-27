import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { blogText, findHydratedBlogById, sanitizeBlogHtml } from "@/lib/blogs";
import { deleteBlogImage } from "@/lib/cloudinary";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema } from "@/lib/validators/auth";
import { blogWriteSchema } from "@/lib/validators/blog";
import { BlogPost } from "@/models/BlogPost";
import { BlogSlugHistory } from "@/models/BlogSlugHistory";
import { Course } from "@/models/Course";
import { BlogStatus } from "@/types/blog";

type Context = { params: Promise<{ id: string }> };
function duplicateKey(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && error.code === 11000; }
function refresh(slug: string, courseSlugs: string[]) { revalidatePath("/"); revalidatePath("/blog"); revalidatePath(`/blog/${slug}`); revalidatePath("/sitemap.xml"); courseSlugs.forEach((course) => revalidatePath(`/courses/${course}`)); }

export async function GET(request: NextRequest, context: Context) {
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id); if (!id.success) return validationError(id.error);
  await connectMongoDB();
  const blog = await findHydratedBlogById(id.data);
  return blog ? apiSuccess("Blog retrieved", { blog }) : apiError("Blog not found", 404);
}

export async function PATCH(request: NextRequest, context: Context) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id); if (!id.success) return validationError(id.error);
  let body: unknown; try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = blogWriteSchema.safeParse(body); if (!parsed.success) return validationError(parsed.error);
  try {
    await connectMongoDB();
    const post = await BlogPost.findById(id.data); if (!post) return apiError("Blog not found", 404);
    const [courseCount, reserved] = await Promise.all([
      Course.countDocuments({ _id: { $in: parsed.data.courseIds } }),
      BlogSlugHistory.findOne({ oldSlug: parsed.data.slug, blogId: { $ne: post._id } }).select("_id"),
    ]);
    if (courseCount !== parsed.data.courseIds.length) return apiError("One or more selected courses are invalid", 400);
    if (reserved) return apiError("This slug is reserved by a previous blog URL", 409);
    const content = sanitizeBlogHtml(parsed.data.content);
    if (blogText(content).length < 20) return apiError("Blog content must contain at least 20 readable characters", 400);
    const previousSlug = post.slug;
    const previousImage = post.featuredImage;
    const previousSocialImage = post.socialImage;
    const previousCourseIds = post.courseIds.map((courseId) => courseId.toString());
    const wasPublished = post.status === BlogStatus.Published;
    const willPublish = parsed.data.status === BlogStatus.Published;
    if (previousSlug !== parsed.data.slug) {
      await BlogSlugHistory.deleteOne({ oldSlug: parsed.data.slug, blogId: post._id });
      if (wasPublished) await BlogSlugHistory.updateOne({ oldSlug: previousSlug }, { $set: { blogId: post._id } }, { upsert: true });
    } else if (wasPublished && !willPublish) await BlogSlugHistory.updateOne({ oldSlug: previousSlug }, { $set: { blogId: post._id } }, { upsert: true });
    post.set({ ...parsed.data, content, socialImage: parsed.data.socialImage || undefined, seoTitle: parsed.data.seoTitle || undefined, metaDescription: parsed.data.metaDescription || undefined, focusKeyword: parsed.data.focusKeyword || undefined, canonicalUrl: parsed.data.canonicalUrl || undefined, publishedAt: willPublish ? post.publishedAt || new Date() : undefined });
    await post.save();
    const courseSlugs = await Course.find({ _id: { $in: [...previousCourseIds, ...post.courseIds.map((courseId) => courseId.toString())] } }).distinct("slug") as string[];
    refresh(previousSlug, courseSlugs); if (previousSlug !== post.slug) refresh(post.slug, courseSlugs);
    await Promise.allSettled([...(previousImage !== post.featuredImage ? [deleteBlogImage(previousImage)] : []), ...(previousSocialImage && previousSocialImage !== post.socialImage && previousSocialImage !== previousImage ? [deleteBlogImage(previousSocialImage)] : [])]);
    auditSecurityEvent(wasPublished !== willPublish ? (willPublish ? "blog_published" : "blog_unpublished") : "blog_updated", auth.user._id.toString(), post._id.toString());
    return apiSuccess(willPublish ? "Blog saved and published" : "Draft saved", { blog: await findHydratedBlogById(post._id.toString()) });
  } catch (error) {
    if (duplicateKey(error)) return apiError("A blog with this slug already exists", 409);
    return apiError("Unable to update blog", 500);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id); if (!id.success) return validationError(id.error);
  await connectMongoDB();
  const post = await BlogPost.findById(id.data); if (!post) return apiError("Blog not found", 404);
  const courseSlugs = await Course.find({ _id: { $in: post.courseIds } }).distinct("slug") as string[];
  await Promise.all([post.deleteOne(), BlogSlugHistory.deleteMany({ blogId: post._id })]);
  await Promise.allSettled([deleteBlogImage(post.featuredImage), ...(post.socialImage && post.socialImage !== post.featuredImage ? [deleteBlogImage(post.socialImage)] : [])]);
  refresh(post.slug, courseSlugs);
  auditSecurityEvent("blog_deleted", auth.user._id.toString(), post._id.toString());
  return apiSuccess("Blog deleted", {});
}
