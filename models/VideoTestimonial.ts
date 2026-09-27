import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export interface IVideoTestimonial {
  studentName: string; videoUrl: string; cloudinaryPublicId: string; videoAltText: string;
  displayOrder: number; isActive: boolean; uploadDate: Date; uploadedBy: Types.ObjectId;
  createdAt: Date; updatedAt: Date;
}
export type VideoTestimonialDocument = HydratedDocument<IVideoTestimonial>;

const videoTestimonialSchema = new Schema<IVideoTestimonial>({
  studentName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  videoUrl: { type: String, required: true, trim: true, maxlength: 700 },
  cloudinaryPublicId: { type: String, required: true, unique: true, trim: true, maxlength: 300 },
  videoAltText: { type: String, required: true, trim: true, minlength: 2, maxlength: 180 },
  displayOrder: { type: Number, required: true, min: 0, max: 10000, default: 0, index: true },
  isActive: { type: Boolean, required: true, default: false, index: true },
  uploadDate: { type: Date, required: true, default: Date.now, index: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, { timestamps: true, versionKey: false });
videoTestimonialSchema.index({ isActive: 1, displayOrder: 1, uploadDate: -1 });

export const VideoTestimonial: Model<IVideoTestimonial> = process.env.NODE_ENV === "development"
  ? mongoose.model<IVideoTestimonial>("VideoTestimonial", videoTestimonialSchema, undefined, { overwriteModels: true })
  : (mongoose.models.VideoTestimonial as Model<IVideoTestimonial> | undefined) || mongoose.model<IVideoTestimonial>("VideoTestimonial", videoTestimonialSchema);
