import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema } from "@/lib/validators/auth";
import { blogStatusSchema } from "@/lib/validators/blog";
import { BlogPost } from "@/models/BlogPost";
import { BlogSlugHistory } from "@/models/BlogSlugHistory";
import { Course } from "@/models/Course";
import { BlogStatus } from "@/types/blog";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin"); if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await params).id); if (!id.success) return validationError(id.error);
  let body: unknown; try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = blogStatusSchema.safeParse(body); if (!parsed.success) return validationError(parsed.error);
  await connectMongoDB();
  const post = await BlogPost.findById(id.data); if (!post) return apiError("Blog not found", 404);
  if (post.status === BlogStatus.Published && parsed.data.status === BlogStatus.Draft) await BlogSlugHistory.updateOne({ oldSlug: post.slug }, { $set: { blogId: post._id } }, { upsert: true });
  post.status = parsed.data.status;
  post.publishedAt = parsed.data.status === BlogStatus.Published ? post.publishedAt || new Date() : undefined;
  await post.save();
  revalidatePath("/"); revalidatePath("/blog"); revalidatePath(`/blog/${post.slug}`); revalidatePath("/sitemap.xml");
  for (const slug of await Course.find({ _id: { $in: post.courseIds } }).distinct("slug") as string[]) revalidatePath(`/courses/${slug}`);
  auditSecurityEvent(parsed.data.status === BlogStatus.Published ? "blog_published" : "blog_unpublished", auth.user._id.toString(), post._id.toString());
  return apiSuccess(parsed.data.status === BlogStatus.Published ? "Blog published" : "Blog unpublished", { status: post.status, publishedAt: post.publishedAt?.toISOString() });
}
