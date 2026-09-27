import { z } from "zod";
import { BlogStatus } from "@/types/blog";
import { objectIdSchema } from "@/lib/validators/auth";

const slugSchema = z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens only.");
const cloudinaryImageSchema = z.string().trim().url().max(500).refine((value) => {
  try { const url = new URL(value); return url.protocol === "https:" && url.hostname === "res.cloudinary.com"; } catch { return false; }
}, "Use an image uploaded through the blog image uploader.");
const optionalText = (maximum: number) => z.string().trim().max(maximum).default("");

export const blogWriteSchema = z.object({
  title: z.string().trim().min(5).max(180),
  slug: slugSchema,
  excerpt: z.string().trim().min(20).max(500),
  content: z.string().min(20).max(200000),
  featuredImage: cloudinaryImageSchema,
  featuredImageAlt: z.string().trim().min(5).max(180),
  socialImage: z.union([cloudinaryImageSchema, z.literal("")]).default(""),
  courseIds: z.array(objectIdSchema).min(1, "Assign at least one course.").max(30),
  status: z.nativeEnum(BlogStatus),
  featuredOnHome: z.boolean().default(false),
  seoTitle: optionalText(70),
  metaDescription: optionalText(170),
  focusKeyword: optionalText(100),
  canonicalUrl: z.union([z.string().trim().url().max(500).refine((value) => { try { return new URL(value).protocol === "https:"; } catch { return false; } }, "Canonical URL must use HTTPS."), z.literal("")]).default(""),
}).strict().refine((data) => new Set(data.courseIds).size === data.courseIds.length, { message: "Each course can only be assigned once.", path: ["courseIds"] });

export const blogStatusSchema = z.object({ status: z.nativeEnum(BlogStatus) }).strict();

export const adminBlogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().max(100).default(""),
  status: z.union([z.nativeEnum(BlogStatus), z.literal("ALL")]).default("ALL"),
  courseId: z.union([objectIdSchema, z.literal("")]).default(""),
}).strict();

export const publicBlogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().max(100).default(""),
  course: z.string().trim().max(100).regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/).default(""),
}).strict();
