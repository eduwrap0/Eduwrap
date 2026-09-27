import mongoose, { Schema, type Model } from "mongoose";

export interface ISeoPageSettings {
  path: string;
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphImage?: string;
  structuredData?: string;
  customTags?: string;
}

export interface ISeoSettings {
  key: "global";
  pages: ISeoPageSettings[];
  sitewideTags?: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const pageSchema = new Schema<ISeoPageSettings>({
  path: { type: String, required: true, trim: true },
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  keywords: [{ type: String, trim: true }],
  canonicalUrl: { type: String, trim: true },
  openGraphTitle: { type: String, trim: true },
  openGraphDescription: { type: String, trim: true },
  openGraphImage: { type: String, trim: true },
  structuredData: { type: String, trim: true },
  customTags: { type: String },
}, { _id: false });

const seoSettingsSchema = new Schema<ISeoSettings>({
  key: { type: String, enum: ["global"], default: "global", unique: true, immutable: true },
  pages: { type: [pageSchema], default: [] },
  sitewideTags: { type: String },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export const SeoSettings: Model<ISeoSettings> = mongoose.models.SeoSettings as Model<ISeoSettings> || mongoose.model<ISeoSettings>("SeoSettings", seoSettingsSchema);
