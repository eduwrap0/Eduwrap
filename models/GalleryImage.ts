import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export interface IGalleryImage {
  imageUrl: string;
  cloudinaryPublicId: string;
  altTag: string;
  isPublic: boolean;
  uploadDate: Date;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type GalleryImageDocument = HydratedDocument<IGalleryImage>;

const galleryImageSchema = new Schema<IGalleryImage>({
  imageUrl: { type: String, required: true, trim: true, maxlength: 500 },
  cloudinaryPublicId: { type: String, required: true, unique: true, trim: true, maxlength: 300 },
  altTag: { type: String, required: true, trim: true, minlength: 2, maxlength: 180 },
  isPublic: { type: Boolean, required: true, default: false, index: true },
  uploadDate: { type: Date, required: true, default: Date.now, index: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, { timestamps: true, versionKey: false });

galleryImageSchema.index({ isPublic: 1, uploadDate: -1 });

export const GalleryImage: Model<IGalleryImage> = process.env.NODE_ENV === "development"
  ? mongoose.model<IGalleryImage>("GalleryImage", galleryImageSchema, undefined, { overwriteModels: true })
  : (mongoose.models.GalleryImage as Model<IGalleryImage> | undefined) || mongoose.model<IGalleryImage>("GalleryImage", galleryImageSchema);
