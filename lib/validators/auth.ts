import { z } from "zod";
import { FACULTY_COURSES, STUDENT_COURSES } from "@/lib/courses";
import { CLASS_DURATIONS } from "@/lib/enrollment";
import { isDistrictInState, INDIAN_STATES } from "@/lib/india-locations";
import { BLOOD_GROUPS, GENDER_VALUES } from "@/lib/profile-options";

const normalizedEmail = z.string().trim().toLowerCase().email().max(254);
export const strongPassword = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .max(128, "Password is too long.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character.");

const name = z.string().trim().min(2).max(100);
const phone = z
  .string()
  .trim()
  .regex(/^[0-9+()\- ]+$/, "Phone number can only contain digits and standard separators.")
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => /^(?:91)?[6-9]\d{9}$/.test(value), "Enter a valid 10-digit Indian mobile number.")
  .transform((value) => value.length === 12 ? value.slice(2) : value);
const aadhaarNo = z.string().trim().regex(/^\d{12}$/, "Aadhaar number must contain exactly 12 digits.");
const address = z.string().trim().min(5, "Address must contain at least 5 characters.").max(500, "Address is too long.");
const dateOfBirth = z.iso.date("Enter a valid date of birth.").refine((value) => new Date(`${value}T00:00:00.000Z`) < new Date(), "Date of birth must be in the past.");
const qualification = z.string().trim().min(2, "Qualification must contain at least 2 characters.").max(200, "Qualification is too long.");
const facultyIds = z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid faculty ID.")).min(1, "Select at least one faculty member.").max(50);
const optionalFacultyIds = z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid faculty ID.")).max(50).optional();
const maritalStatus = z.enum(["single", "married", "divorced", "widowed"]);
const batchTiming = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid batch time.");
const courseDuration = z.string().trim().min(2, "Course duration is required.").max(50, "Course duration is too long.");
const admissionDate = z.iso.date("Enter a valid admission date.").refine((value) => new Date(`${value}T00:00:00.000Z`) <= new Date(), "Admission date cannot be in the future.");
const totalFee = z.coerce.number().positive("Total fee must be greater than zero.").max(100_000_000, "Total fee is too large.").refine((value) => Number.isInteger(value * 100), "Total fee can contain at most two decimal places.");
const state = z.enum(INDIAN_STATES as [string, ...string[]], { error: "Select a valid state or union territory." });
const district = z.string().trim().min(1, "Select a district.").max(100);
const bloodGroup = z.enum(BLOOD_GROUPS);
const nationality = z.string().trim().min(2, "Nationality is required.").max(100, "Nationality is too long.");
const gender = z.enum(GENDER_VALUES);
const fatherName = z.string().trim().min(2, "Father's name must contain at least 2 characters.").max(100, "Father's name is too long.");
const fatherOccupation = z.string().trim().min(2, "Father's occupation must contain at least 2 characters.").max(100, "Father's occupation is too long.");
const fatherPhone = z.string().trim().regex(/^[0-9+()\- ]{7,20}$/, "Enter a valid father's phone number.");
const profileImageUrl = z.string().trim().url("Invalid profile image URL.").max(500).refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && url.pathname.includes("/image/upload/");
}, "Profile image must be hosted securely on Cloudinary.");

export const updateOwnProfileSchema = z.object({ profileImageUrl }).strict();
export const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required.").max(128),
  password: strongPassword,
  confirmPassword: z.string(),
}).strict().refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] })
  .refine((data) => data.currentPassword !== data.password, { message: "New password must be different from the current password.", path: ["password"] });

export const loginSchema = z.object({ email: normalizedEmail, password: z.string().min(1).max(128) }).strict();

export const createStudentSchema = z
  .object({
    name,
    email: normalizedEmail,
    password: strongPassword,
    confirmPassword: z.string(),
    phone,
    profileImageUrl: profileImageUrl.optional(),
    dateOfBirth,
    qualification,
    aadhaarNo,
    address,
    state,
    district,
    bloodGroup,
    nationality,
    gender,
    maritalStatus,
    fatherName,
    fatherOccupation,
    fatherPhone,
    batchTiming,
    classDuration: z.enum(CLASS_DURATIONS),
    courseDuration,
    admissionDate,
    totalFee,
    courses: z.array(z.enum(STUDENT_COURSES)).min(1, "Select at least one course.").max(STUDENT_COURSES.length),
    facultyIds,
    isActive: z.boolean().default(true),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => isDistrictInState(data.state, data.district), { message: "Select a district in the chosen state.", path: ["district"] })
  .refine((data) => new Set(data.courses).size === data.courses.length, { message: "Each course can only be selected once.", path: ["courses"] })
  .refine((data) => new Set(data.facultyIds).size === data.facultyIds.length, { message: "Each faculty member can only be selected once.", path: ["facultyIds"] });

export const updateStudentSchema = z
  .object({
    name: name.optional(),
    email: normalizedEmail.optional(),
    phone: phone.optional(),
    profileImageUrl: profileImageUrl.optional(),
    dateOfBirth: dateOfBirth.optional(),
    qualification: qualification.optional(),
    aadhaarNo: aadhaarNo.optional(),
    address: address.optional(),
    state: state.optional(),
    district: district.optional(),
    bloodGroup: bloodGroup.optional(),
    nationality: nationality.optional(),
    gender: gender.optional(),
    maritalStatus: maritalStatus.optional(),
    fatherName: fatherName.optional(),
    fatherOccupation: fatherOccupation.optional(),
    fatherPhone: fatherPhone.optional(),
    batchTiming: batchTiming.optional(),
    classDuration: z.enum(CLASS_DURATIONS).optional(),
    courseDuration: courseDuration.optional(),
    admissionDate: admissionDate.optional(),
    totalFee: totalFee.optional(),
    courses: z.array(z.enum(STUDENT_COURSES)).min(1, "Select at least one course.").max(STUDENT_COURSES.length).optional(),
    facultyIds: optionalFacultyIds,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required.")
  .refine((data) => (data.state === undefined) === (data.district === undefined), { message: "State and district must be updated together.", path: ["district"] })
  .refine((data) => !data.state || !data.district || isDistrictInState(data.state, data.district), { message: "Select a district in the chosen state.", path: ["district"] })
  .refine((data) => !data.courses || new Set(data.courses).size === data.courses.length, { message: "Each course can only be selected once.", path: ["courses"] })
  .refine((data) => !data.facultyIds || new Set(data.facultyIds).size === data.facultyIds.length, { message: "Each faculty member can only be selected once.", path: ["facultyIds"] });

export const updateStatusSchema = z.object({ isActive: z.boolean() }).strict();
export const updateCourseStatusSchema = z.object({ status: z.enum(["ongoing", "completed"]) }).strict();
export const createFacultySchema = z
  .object({
    name,
    email: normalizedEmail,
    password: strongPassword,
    confirmPassword: z.string(),
    phone,
    profileImageUrl: profileImageUrl.optional(),
    aadhaarNo,
    address,
    state,
    district,
    bloodGroup,
    nationality,
    gender,
    maritalStatus,
    dateOfBirth,
    qualification,
    courses: z.array(z.enum(FACULTY_COURSES)).min(1, "Select at least one course.").max(FACULTY_COURSES.length),
    isActive: z.boolean().default(true),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] })
  .refine((data) => isDistrictInState(data.state, data.district), { message: "Select a district in the chosen state.", path: ["district"] })
  .refine((data) => new Set(data.courses).size === data.courses.length, { message: "Each course can only be selected once.", path: ["courses"] });
export const updateFacultySchema = z
  .object({
    name: name.optional(),
    email: normalizedEmail.optional(),
    phone: phone.optional(),
    profileImageUrl: profileImageUrl.optional(),
    aadhaarNo: aadhaarNo.optional(),
    address: address.optional(),
    state: state.optional(),
    district: district.optional(),
    bloodGroup: bloodGroup.optional(),
    nationality: nationality.optional(),
    gender: gender.optional(),
    maritalStatus: maritalStatus.optional(),
    dateOfBirth: dateOfBirth.optional(),
    qualification: qualification.optional(),
    courses: z.array(z.enum(FACULTY_COURSES)).min(1, "Select at least one course.").max(FACULTY_COURSES.length).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required.")
  .refine((data) => (data.state === undefined) === (data.district === undefined), { message: "State and district must be updated together.", path: ["district"] })
  .refine((data) => !data.state || !data.district || isDistrictInState(data.state, data.district), { message: "Select a district in the chosen state.", path: ["district"] })
  .refine((data) => !data.courses || new Set(data.courses).size === data.courses.length, { message: "Each course can only be selected once.", path: ["courses"] });
export const resetPasswordSchema = z
  .object({ password: strongPassword, confirmPassword: z.string() })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID.");

export const studentListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).default(""),
    status: z.enum(["all", "active", "inactive"]).default("all"),
    courseStatus: z.enum(["all", "ongoing", "completed"]).default("all"),
    admissionFrom: z.union([z.iso.date(), z.literal("")]).default(""),
    admissionTo: z.union([z.iso.date(), z.literal("")]).default(""),
    batch: z.union([batchTiming, z.literal("")]).default(""),
    facultyId: z.union([objectIdSchema, z.literal("")]).default(""),
  })
  .strict()
  .refine((data) => !data.admissionFrom || !data.admissionTo || data.admissionFrom <= data.admissionTo, { message: "From date cannot be after to date.", path: ["admissionTo"] });
