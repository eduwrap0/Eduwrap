import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import { BlogStatus } from "@/types/blog";

export interface IBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  socialImage?: string;
  authorId: Types.ObjectId;
  courseIds: Types.ObjectId[];
  status: BlogStatus;
  featuredOnHome: boolean;
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type BlogPostDocument = HydratedDocument<IBlogPost>;

const blogPostSchema = new Schema<IBlogPost>({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 160 },
  excerpt: { type: String, required: true, trim: true, maxlength: 500 },
  content: { type: String, required: true, maxlength: 200000 },
  featuredImage: { type: String, required: true, trim: true, maxlength: 500 },
  featuredImageAlt: { type: String, required: true, trim: true, maxlength: 180 },
  socialImage: { type: String, trim: true, maxlength: 500 },
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  courseIds: [{ type: Schema.Types.ObjectId, ref: "Course", required: true }],
  status: { type: String, enum: Object.values(BlogStatus), default: BlogStatus.Draft, required: true, index: true },
  featuredOnHome: { type: Boolean, default: false, required: true, index: true },
  seoTitle: { type: String, trim: true, maxlength: 70 },
  metaDescription: { type: String, trim: true, maxlength: 170 },
  focusKeyword: { type: String, trim: true, maxlength: 100 },
  canonicalUrl: { type: String, trim: true, maxlength: 500 },
  publishedAt: { type: Date, index: true },
}, { timestamps: true, versionKey: false });

blogPostSchema.index({ slug: 1 }, { unique: true });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ status: 1, featuredOnHome: 1, publishedAt: -1 });
blogPostSchema.index({ status: 1, courseIds: 1, publishedAt: -1 });
blogPostSchema.index({ courseIds: 1 });
blogPostSchema.index({ title: "text", excerpt: "text", content: "text" }, { weights: { title: 5, excerpt: 3, content: 1 } });

export const BlogPost: Model<IBlogPost> = process.env.NODE_ENV === "development"
  ? mongoose.model<IBlogPost>("BlogPost", blogPostSchema, undefined, { overwriteModels: true })
  : (mongoose.models.BlogPost as Model<IBlogPost> | undefined) || mongoose.model<IBlogPost>("BlogPost", blogPostSchema);
