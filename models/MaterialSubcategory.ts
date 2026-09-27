import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export interface IMaterialSubcategory {
  course: string;
  courses?: string[];
  name: string;
  normalizedName: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type MaterialSubcategoryDocument = HydratedDocument<IMaterialSubcategory>;

const materialSubcategorySchema = new Schema<IMaterialSubcategory>({
  course: { type: String, required: true, trim: true, maxlength: 100, index: true },
  courses: [{ type: String, trim: true, maxlength: 100 }],
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 60 },
  normalizedName: { type: String, required: true, trim: true, maxlength: 60 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true, versionKey: false });

materialSubcategorySchema.index({ course: 1, normalizedName: 1 }, { unique: true });
materialSubcategorySchema.index({ courses: 1, name: 1 });

export const MaterialSubcategory: Model<IMaterialSubcategory> = process.env.NODE_ENV === "development"
  ? mongoose.model<IMaterialSubcategory>("MaterialSubcategory", materialSubcategorySchema, undefined, { overwriteModels: true })
  : (mongoose.models.MaterialSubcategory as Model<IMaterialSubcategory> | undefined) || mongoose.model<IMaterialSubcategory>("MaterialSubcategory", materialSubcategorySchema);
