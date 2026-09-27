export type MaterialCategory = "notes" | "assignment";
export type MaterialFileType = "pdf" | "image";

export interface MaterialSubcategoryRecord {
  id: string;
  course: string;
  courses: string[];
  name: string;
  createdAt: string;
}

export interface CourseMaterialRecord {
  id: string;
  title: string;
  description?: string;
  course: string;
  courses: string[];
  category: MaterialCategory;
  subcategoryId?: string;
  subcategoryName?: string;
  fileType: MaterialFileType;
  originalName: string;
  mimeType: string;
  bytes: number;
  uploadedBy: string;
  uploaderName: string;
  createdAt: string;
  updatedAt: string;
}
