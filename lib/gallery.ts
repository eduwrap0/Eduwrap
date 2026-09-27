import "server-only";
import { connectMongoDB } from "@/lib/mongodb";
import { GalleryImage, type IGalleryImage } from "@/models/GalleryImage";
import type { GalleryImageRecord } from "@/types/gallery";

type GallerySource = Pick<IGalleryImage, "imageUrl" | "cloudinaryPublicId" | "altTag" | "isPublic" | "uploadDate"> & { _id: unknown };

export function toGalleryRecord(image: GallerySource): GalleryImageRecord {
  return {
    id: String(image._id), imageUrl: image.imageUrl, cloudinaryPublicId: image.cloudinaryPublicId,
    altTag: image.altTag, isPublic: image.isPublic, uploadDate: image.uploadDate.toISOString(),
  };
}

export async function getPublicGalleryImages(): Promise<GalleryImageRecord[]> {
  await connectMongoDB();
  const images = await GalleryImage.find({ isPublic: true }).sort({ uploadDate: -1, _id: -1 }).lean<GallerySource[]>();
  return images.map(toGalleryRecord);
}
