import "server-only";
import { Types } from "mongoose";
import { courses as staticCourses } from "@/content/courses";
import { BlogPost, type IBlogPost } from "@/models/BlogPost";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { BlogStatus, type BlogCourseRecord, type BlogPagination, type BlogPostRecord } from "@/types/blog";
export { blogText, sanitizeBlogHtml, slugifyBlogTitle } from "@/lib/blog-content";

export type BlogPostSource = Pick<IBlogPost, "title" | "slug" | "excerpt" | "content" | "featuredImage" | "featuredImageAlt" | "socialImage" | "courseIds" | "status" | "featuredOnHome" | "seoTitle" | "metaDescription" | "focusKeyword" | "canonicalUrl" | "publishedAt" | "createdAt" | "updatedAt"> & { _id: Types.ObjectId; authorId: Types.ObjectId };

const legacyCourseSlugs: Record<string, string[]> = {
  "artificial-intelligence-machine-learning": ["generative-ai"],
  "basic-computer-course": ["diploma-in-computer-application-dca", "advanced-computer"],
};

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
}

async function mergeLegacyCourse(currentId: Types.ObjectId, legacyId: Types.ObjectId, details: { slug: string; name: string; description: string; image: string }): Promise<void> {
  await BlogPost.updateMany({ courseIds: legacyId }, { $addToSet: { courseIds: currentId } });
  await BlogPost.updateMany({ courseIds: legacyId }, { $pull: { courseIds: legacyId } });
  await Course.deleteOne({ _id: legacyId });
  await Course.updateOne({ _id: currentId }, { $set: details });
}

async function syncBlogCourse(course: (typeof staticCourses)[number]): Promise<void> {
  const details = { slug: course.slug, name: course.cardTitle || course.name, description: course.description, image: course.image };
  const legacySlugs = legacyCourseSlugs[course.slug];

  if (legacySlugs) {
    let current = await Course.findOne({ slug: course.slug }).select("_id").lean<{ _id: Types.ObjectId } | null>();
    for (const legacySlug of legacySlugs) {
      const legacy = await Course.findOne({ slug: legacySlug }).select("_id").lean<{ _id: Types.ObjectId } | null>();
      if (!legacy) continue;

      if (current) {
        await mergeLegacyCourse(current._id, legacy._id, details);
        continue;
      }

      try {
        await Course.updateOne({ _id: legacy._id }, { $set: details });
        current = { _id: legacy._id };
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
        current = await Course.findOne({ slug: course.slug }).select("_id").lean<{ _id: Types.ObjectId } | null>();
        if (!current) throw error;
        await mergeLegacyCourse(current._id, legacy._id, details);
      }
    }
    if (current) {
      await Course.updateOne({ _id: current._id }, { $set: details });
      return;
    }
  }

  try {
    await Course.updateOne({ slug: course.slug }, { $set: details }, { upsert: true });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    await Course.updateOne({ slug: course.slug }, { $set: details });
  }
}

export async function ensureBlogCourses(): Promise<void> {
  if (!staticCourses.length) return;
  await Promise.all(staticCourses.map(syncBlogCourse));
}

export async function getBlogCourses(): Promise<BlogCourseRecord[]> {
  await ensureBlogCourses();
  const records = await Course.find({}).sort({ name: 1 }).select("name slug").lean<Array<{ _id: Types.ObjectId; name: string; slug: string }>>();
  return records.map((course) => ({ id: course._id.toString(), name: course.name, slug: course.slug }));
}

export async function hydrateBlogPosts(posts: BlogPostSource[]): Promise<BlogPostRecord[]> {
  if (!posts.length) return [];
  const authorIds = [...new Set(posts.map((post) => post.authorId.toString()))];
  const courseIds = [...new Set(posts.flatMap((post) => post.courseIds.map((id) => id.toString())))];
  const [authors, courses] = await Promise.all([
    User.find({ _id: { $in: authorIds } }).select("name").lean<Array<{ _id: Types.ObjectId; name: string }>>(),
    Course.find({ _id: { $in: courseIds } }).select("name slug").lean<Array<{ _id: Types.ObjectId; name: string; slug: string }>>(),
  ]);
  const authorMap = new Map(authors.map((author) => [author._id.toString(), author.name]));
  const courseMap = new Map(courses.map((course) => [course._id.toString(), { id: course._id.toString(), name: course.name, slug: course.slug }]));
  return posts.map((post) => ({
    id: post._id.toString(), title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content,
    featuredImage: post.featuredImage, featuredImageAlt: post.featuredImageAlt, ...(post.socialImage ? { socialImage: post.socialImage } : {}),
    author: { id: post.authorId.toString(), name: authorMap.get(post.authorId.toString()) || "EduWrap Team" },
    courses: post.courseIds.flatMap((id) => courseMap.get(id.toString()) || []), status: post.status, featuredOnHome: post.featuredOnHome,
    ...(post.seoTitle ? { seoTitle: post.seoTitle } : {}), ...(post.metaDescription ? { metaDescription: post.metaDescription } : {}),
    ...(post.focusKeyword ? { focusKeyword: post.focusKeyword } : {}), ...(post.canonicalUrl ? { canonicalUrl: post.canonicalUrl } : {}),
    ...(post.publishedAt ? { publishedAt: post.publishedAt.toISOString() } : {}), createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString(),
  }));
}

export async function findHydratedBlogById(id: string): Promise<BlogPostRecord | null> {
  const post = await BlogPost.findById(id).lean<BlogPostSource | null>();
  return post ? (await hydrateBlogPosts([post]))[0] : null;
}

const publicFields = "title slug excerpt content featuredImage featuredImageAlt socialImage authorId courseIds status featuredOnHome seoTitle metaDescription focusKeyword canonicalUrl publishedAt createdAt updatedAt";
const publishedFilter = () => ({ status: BlogStatus.Published, publishedAt: { $lte: new Date() } });

export async function getPublishedBlogBySlug(slug: string): Promise<BlogPostRecord | null> {
  const post = await BlogPost.findOne({ slug, ...publishedFilter() }).select(publicFields).lean<BlogPostSource | null>();
  return post ? (await hydrateBlogPosts([post]))[0] : null;
}

export async function getFeaturedPublishedBlogs(limit = 3): Promise<BlogPostRecord[]> {
  const posts = await BlogPost.find({ ...publishedFilter(), featuredOnHome: true }).select(publicFields).sort({ publishedAt: -1, _id: -1 }).limit(limit).lean<BlogPostSource[]>();
  return hydrateBlogPosts(posts);
}

export async function getCoursePublishedBlogs(courseSlug: string, limit = 3, excludeId?: string): Promise<BlogPostRecord[]> {
  const course = await Course.findOne({ slug: courseSlug }).select("_id").lean<{ _id: Types.ObjectId } | null>();
  if (!course) return [];
  const posts = await BlogPost.find({ ...publishedFilter(), courseIds: course._id, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).select(publicFields).sort({ publishedAt: -1, _id: -1 }).limit(limit).lean<BlogPostSource[]>();
  return hydrateBlogPosts(posts);
}

export async function getRelatedPublishedBlogs(blog: BlogPostRecord, limit = 3): Promise<BlogPostRecord[]> {
  const ids = blog.courses.map((course) => new Types.ObjectId(course.id));
  const posts = await BlogPost.find({ ...publishedFilter(), courseIds: { $in: ids }, _id: { $ne: blog.id } }).select(publicFields).sort({ publishedAt: -1, _id: -1 }).limit(limit).lean<BlogPostSource[]>();
  return hydrateBlogPosts(posts);
}

export async function getPublishedBlogPage(input: { page: number; search: string; courseSlug: string; limit?: number }): Promise<{ blogs: BlogPostRecord[]; pagination: BlogPagination }> {
  const limit = input.limit || 9;
  const filter: Record<string, unknown> = publishedFilter();
  if (input.courseSlug) {
    const course = await Course.findOne({ slug: input.courseSlug }).select("_id").lean<{ _id: Types.ObjectId } | null>();
    filter.courseIds = course?._id || { $in: [] };
  }
  if (input.search) filter.$text = { $search: input.search };
  const [posts, total] = await Promise.all([
    BlogPost.find(filter).select(publicFields).sort({ publishedAt: -1, _id: -1 }).skip((input.page - 1) * limit).limit(limit).lean<BlogPostSource[]>(),
    BlogPost.countDocuments(filter),
  ]);
  return { blogs: await hydrateBlogPosts(posts), pagination: { page: input.page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), hasNextPage: input.page * limit < total, hasPreviousPage: input.page > 1 } };
}
