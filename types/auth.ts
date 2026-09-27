export type UserRole = "admin" | "faculty" | "student";

export interface SessionPayload {
  userId: string;
  role: UserRole;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  facultyId?: string;
  facultyIds?: string[];
  facultyNames?: string[];
  phone?: string;
  profileImageUrl?: string;
  course?: string;
  courses?: string[];
  courseStatus?: "ongoing" | "completed";
  courseCompletedAt?: string;
  courseCompletedBy?: string;
  certificateNumber?: string;
  address?: string;
  state?: string;
  district?: string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  nationality?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  dateOfBirth?: string;
  qualification?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed";
  fatherName?: string;
  fatherOccupation?: string;
  fatherPhone?: string;
  batchTiming?: string;
  classDuration?: string;
  courseDuration?: string;
  admissionDate?: string;
  totalFee?: number;
  isActive: boolean;
  createdBy?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}
