import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export interface IBlogSlugHistory {
  oldSlug: string;
  blogId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type BlogSlugHistoryDocument = HydratedDocument<IBlogSlugHistory>;

const blogSlugHistorySchema = new Schema<IBlogSlugHistory>({
  oldSlug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 160 },
  blogId: { type: Schema.Types.ObjectId, ref: "BlogPost", required: true, index: true },
}, { timestamps: true, versionKey: false });

blogSlugHistorySchema.index({ oldSlug: 1 }, { unique: true });
blogSlugHistorySchema.index({ blogId: 1, createdAt: -1 });

export const BlogSlugHistory: Model<IBlogSlugHistory> = process.env.NODE_ENV === "development"
  ? mongoose.model<IBlogSlugHistory>("BlogSlugHistory", blogSlugHistorySchema, undefined, { overwriteModels: true })
  : (mongoose.models.BlogSlugHistory as Model<IBlogSlugHistory> | undefined) || mongoose.model<IBlogSlugHistory>("BlogSlugHistory", blogSlugHistorySchema);
