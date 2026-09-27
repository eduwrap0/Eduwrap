import "server-only";
import { connectMongoDB } from "@/lib/mongodb";
import { VideoTestimonial, type IVideoTestimonial } from "@/models/VideoTestimonial";
import type { VideoTestimonialRecord } from "@/types/video-testimonial";

type VideoSource = Pick<IVideoTestimonial, "studentName" | "videoUrl" | "cloudinaryPublicId" | "videoAltText" | "displayOrder" | "isActive" | "uploadDate"> & { _id: unknown };

export function toVideoTestimonialRecord(video: VideoSource): VideoTestimonialRecord {
  return { id: String(video._id), studentName: video.studentName, videoUrl: video.videoUrl, cloudinaryPublicId: video.cloudinaryPublicId, videoAltText: video.videoAltText, displayOrder: video.displayOrder, isActive: video.isActive, uploadDate: video.uploadDate.toISOString() };
}

export async function getPublicVideoTestimonials(): Promise<VideoTestimonialRecord[]> {
  await connectMongoDB();
  const videos = await VideoTestimonial.find({ isActive: true }).sort({ displayOrder: 1, uploadDate: -1, _id: -1 }).lean<VideoSource[]>();
  return videos.map(toVideoTestimonialRecord);
}
