import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import type { SafeUser, UserRole } from "@/types/auth";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  studentId?: string;
  facultyId?: Types.ObjectId;
  facultyIds?: Types.ObjectId[];
  facultyAssignments?: Array<{ facultyId: Types.ObjectId; assignedAt: Date }>;
  phone?: string;
  profileImageUrl?: string;
  aadhaarNo?: string;
  address?: string;
  state?: string;
  district?: string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  nationality?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  dateOfBirth?: Date;
  qualification?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed";
  fatherName?: string;
  fatherOccupation?: string;
  fatherPhone?: string;
  batchTiming?: string;
  classDuration?: string;
  courseDuration?: string;
  admissionDate?: Date;
  totalFee?: number;
  course?: string;
  courses?: string[];
  courseStatus: "ongoing" | "completed";
  courseCompletedAt?: Date;
  courseCompletedBy?: Types.ObjectId;
  certificateNumber?: string;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const facultyAssignmentSchema = new Schema({ facultyId: { type: Schema.Types.ObjectId, ref: "User", required: true }, assignedAt: { type: Date, required: true } }, { _id: false });

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["admin", "faculty", "student"], immutable: true, index: true },
    studentId: { type: String, trim: true, uppercase: true },
    facultyId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    facultyIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    facultyAssignments: { type: [facultyAssignmentSchema], default: undefined },
    phone: { type: String, trim: true, match: /^[6-9]\d{9}$/ },
    profileImageUrl: { type: String, trim: true, maxlength: 500 },
    aadhaarNo: { type: String, trim: true, select: false },
    address: { type: String, trim: true, maxlength: 500 },
    state: { type: String, trim: true, maxlength: 100 },
    district: { type: String, trim: true, maxlength: 100 },
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
    nationality: { type: String, trim: true, maxlength: 100 },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
    dateOfBirth: { type: Date },
    qualification: { type: String, trim: true, maxlength: 200 },
    maritalStatus: { type: String, enum: ["single", "married", "divorced", "widowed"] },
    fatherName: { type: String, trim: true, maxlength: 100 },
    fatherOccupation: { type: String, trim: true, maxlength: 100 },
    fatherPhone: { type: String, trim: true, maxlength: 20 },
    batchTiming: { type: String, trim: true, maxlength: 5 },
    classDuration: { type: String, trim: true, maxlength: 20 },
    courseDuration: { type: String, trim: true, maxlength: 50 },
    admissionDate: { type: Date },
    totalFee: { type: Number, min: 0 },
    course: { type: String, trim: true, maxlength: 100 },
    courses: [{ type: String, trim: true, maxlength: 100 }],
    courseStatus: { type: String, enum: ["ongoing", "completed"], default: "ongoing", required: true, index: true },
    courseCompletedAt: Date,
    courseCompletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    certificateNumber: { type: String, trim: true, uppercase: true, maxlength: 60 },
    isActive: { type: Boolean, default: true, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    lastLoginAt: Date,
    passwordChangedAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.index({ studentId: 1 }, { unique: true, partialFilterExpression: { studentId: { $type: "string" } } });
userSchema.index({ aadhaarNo: 1 }, { unique: true, partialFilterExpression: { aadhaarNo: { $type: "string" } } });
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: "string", $gt: "" } } });
userSchema.index({ certificateNumber: 1 }, { unique: true, partialFilterExpression: { certificateNumber: { $type: "string" } } });
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ role: 1, isActive: 1, createdAt: -1 });
userSchema.index({ role: 1, facultyIds: 1, createdAt: -1 });
userSchema.index({ role: 1, "facultyAssignments.facultyId": 1, createdAt: -1 });
userSchema.index({ role: 1, admissionDate: -1, createdAt: -1 });
userSchema.index({ role: 1, batchTiming: 1, admissionDate: -1, createdAt: -1 });
userSchema.index({ role: 1, facultyIds: 1, admissionDate: -1, createdAt: -1 });
userSchema.index({ role: 1, facultyId: 1, admissionDate: -1, createdAt: -1 });

// Next.js keeps Mongoose models across development reloads. Recompile this model in
// development so newly added roles and fields do not use an older cached schema.
export const User: Model<IUser> = process.env.NODE_ENV === "development"
  ? mongoose.model<IUser>("User", userSchema, undefined, { overwriteModels: true })
  : (mongoose.models.User as Model<IUser> | undefined) || mongoose.model<IUser>("User", userSchema);

type SafeUserSource = Pick<UserDocument, "_id" | "name" | "email" | "role" | "isActive" | "createdAt" | "updatedAt"> &
  Partial<Pick<UserDocument, "studentId" | "facultyId" | "facultyIds" | "phone" | "profileImageUrl" | "course" | "courses" | "courseStatus" | "courseCompletedAt" | "courseCompletedBy" | "certificateNumber" | "address" | "state" | "district" | "bloodGroup" | "nationality" | "gender" | "dateOfBirth" | "qualification" | "maritalStatus" | "fatherName" | "fatherOccupation" | "fatherPhone" | "batchTiming" | "classDuration" | "courseDuration" | "admissionDate" | "totalFee" | "createdBy" | "lastLoginAt">>;

export function toSafeUser(user: SafeUserSource): SafeUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.studentId ? { studentId: user.studentId } : {}),
    ...(user.facultyId ? { facultyId: user.facultyId.toString() } : {}),
    ...(user.facultyIds?.length ? { facultyIds: user.facultyIds.map((id) => id.toString()) } : {}),
    ...(user.phone ? { phone: user.phone } : {}),
    ...(user.profileImageUrl ? { profileImageUrl: user.profileImageUrl } : {}),
    ...(user.course ? { course: user.course } : {}),
    ...(user.courses?.length ? { courses: user.courses } : {}),
    courseStatus: user.courseStatus || "ongoing",
    ...(user.courseCompletedAt ? { courseCompletedAt: user.courseCompletedAt.toISOString() } : {}),
    ...(user.courseCompletedBy ? { courseCompletedBy: user.courseCompletedBy.toString() } : {}),
    ...(user.certificateNumber ? { certificateNumber: user.certificateNumber } : {}),
    ...(user.address ? { address: user.address } : {}),
    ...(user.state ? { state: user.state } : {}),
    ...(user.district ? { district: user.district } : {}),
    ...(user.bloodGroup ? { bloodGroup: user.bloodGroup } : {}),
    ...(user.nationality ? { nationality: user.nationality } : {}),
    ...(user.gender ? { gender: user.gender } : {}),
    ...(user.dateOfBirth ? { dateOfBirth: user.dateOfBirth.toISOString().slice(0, 10) } : {}),
    ...(user.qualification ? { qualification: user.qualification } : {}),
    ...(user.maritalStatus ? { maritalStatus: user.maritalStatus } : {}),
    ...(user.fatherName ? { fatherName: user.fatherName } : {}),
    ...(user.fatherOccupation ? { fatherOccupation: user.fatherOccupation } : {}),
    ...(user.fatherPhone ? { fatherPhone: user.fatherPhone } : {}),
    ...(user.batchTiming ? { batchTiming: user.batchTiming } : {}),
    ...(user.classDuration ? { classDuration: user.classDuration } : {}),
    ...(user.courseDuration ? { courseDuration: user.courseDuration } : {}),
    ...(user.admissionDate ? { admissionDate: user.admissionDate.toISOString().slice(0, 10) } : {}),
    ...(user.totalFee !== undefined ? { totalFee: user.totalFee } : {}),
    isActive: user.isActive,
    ...(user.createdBy ? { createdBy: user.createdBy.toString() } : {}),
    ...(user.lastLoginAt ? { lastLoginAt: user.lastLoginAt.toISOString() } : {}),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
