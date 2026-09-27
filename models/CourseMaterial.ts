import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import type { MaterialCategory, MaterialFileType } from "@/types/materials";

export interface ICourseMaterial {
  title: string;
  description?: string;
  course: string;
  courses?: string[];
  category: MaterialCategory;
  subcategoryId?: Types.ObjectId;
  fileType: MaterialFileType;
  originalName: string;
  mimeType: string;
  bytes: number;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  cloudinaryResourceType: "image" | "raw";
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type CourseMaterialDocument = HydratedDocument<ICourseMaterial>;

const courseMaterialSchema = new Schema<ICourseMaterial>({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500 },
  course: { type: String, required: true, trim: true, maxlength: 100, index: true },
  courses: [{ type: String, trim: true, maxlength: 100 }],
  category: { type: String, required: true, enum: ["notes", "assignment"], index: true },
  subcategoryId: { type: Schema.Types.ObjectId, ref: "MaterialSubcategory", index: true },
  fileType: { type: String, required: true, enum: ["pdf", "image"] },
  originalName: { type: String, required: true, trim: true, maxlength: 255 },
  mimeType: { type: String, required: true },
  bytes: { type: Number, required: true, min: 1 },
  cloudinaryUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String, required: true, unique: true },
  cloudinaryResourceType: { type: String, required: true, enum: ["image", "raw"] },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, { timestamps: true, versionKey: false });

courseMaterialSchema.index({ course: 1, category: 1, createdAt: -1 });
courseMaterialSchema.index({ course: 1, subcategoryId: 1, createdAt: -1 });
courseMaterialSchema.index({ courses: 1, category: 1, createdAt: -1 });

export const CourseMaterial: Model<ICourseMaterial> = process.env.NODE_ENV === "development"
  ? mongoose.model<ICourseMaterial>("CourseMaterial", courseMaterialSchema, undefined, { overwriteModels: true })
  : (mongoose.models.CourseMaterial as Model<ICourseMaterial> | undefined) || mongoose.model<ICourseMaterial>("CourseMaterial", courseMaterialSchema);
