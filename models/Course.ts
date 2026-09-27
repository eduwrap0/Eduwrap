import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

export interface ICourse {
  name: string;
  slug: string;
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CourseDocument = HydratedDocument<ICourse>;

const courseSchema = new Schema<ICourse>({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  image: { type: String, required: true, trim: true, maxlength: 500 },
}, { timestamps: true, versionKey: false });

courseSchema.index({ slug: 1 }, { unique: true });
courseSchema.index({ name: 1 });

export const Course: Model<ICourse> = process.env.NODE_ENV === "development"
  ? mongoose.model<ICourse>("Course", courseSchema, undefined, { overwriteModels: true })
  : (mongoose.models.Course as Model<ICourse> | undefined) || mongoose.model<ICourse>("Course", courseSchema);
