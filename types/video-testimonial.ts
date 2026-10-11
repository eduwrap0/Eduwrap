export interface VideoTestimonialRecord {
  id: string;
  studentName: string;
  videoUrl: string;
  cloudinaryPublicId: string;
  thumbnailUrl?: string;
  videoAltText: string;
  displayOrder: number;
  isActive: boolean;
  uploadDate: string;
}
