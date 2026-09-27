import assert from "node:assert/strict";
import test from "node:test";
import { createFacultySchema, createStudentSchema, loginSchema, resetPasswordSchema, studentListQuerySchema, updateCourseStatusSchema, updateFacultySchema, updateStudentSchema } from "@/lib/validators/auth";

const profileFields = { phone: "+91 99999 99999", state: "Delhi", district: "New Delhi", bloodGroup: "O+", nationality: "Indian", gender: "female", maritalStatus: "single" } as const;
const studentFamilyFields = { fatherName: "Ramesh Kumar", fatherOccupation: "Business", fatherPhone: "+91 98765 43210" } as const;

test("login normalizes email addresses", () => {
  const result = loginSchema.parse({ email: "  Student@Example.COM ", password: "Password.1" });
  assert.equal(result.email, "student@example.com");
});

test("phone validation accepts Indian mobile numbers and stores a canonical value", () => {
  const local = updateFacultySchema.parse({ phone: "9876543210" });
  const countryCode = updateStudentSchema.parse({ phone: "+91 98765 43210" });
  assert.equal(local.phone, "9876543210");
  assert.equal(countryCode.phone, "9876543210");
  assert.equal(updateFacultySchema.safeParse({ phone: "1234567890" }).success, false);
  assert.equal(updateFacultySchema.safeParse({ phone: "98765" }).success, false);
  assert.equal(updateFacultySchema.safeParse({ phone: "phone-9876543210" }).success, false);
  assert.equal(updateFacultySchema.safeParse({ phone: "" }).success, false);
});

test("student list query validates combined backend filters and defaults to 20 records", () => {
  const parsed = studentListQuerySchema.parse({ page: "2", search: "Python", status: "active", admissionFrom: "2026-08-01", admissionTo: "2026-08-31", batch: "10:30", facultyId: "507f1f77bcf86cd799439011" });
  assert.equal(parsed.page, 2);
  assert.equal(parsed.limit, 20);
  assert.equal(parsed.search, "Python");
  assert.equal(parsed.courseStatus, "all");
  assert.equal(studentListQuerySchema.parse({ courseStatus: "completed" }).courseStatus, "completed");
  assert.equal(studentListQuerySchema.safeParse({ courseStatus: "active" }).success, false);
  assert.equal(studentListQuerySchema.safeParse({ admissionFrom: "2026-09-01", admissionTo: "2026-08-01" }).success, false);
  assert.equal(studentListQuerySchema.safeParse({ batch: "25:00" }).success, false);
  assert.equal(studentListQuerySchema.safeParse({ facultyId: "bad-id" }).success, false);
});

test("course completion status accepts only supported state transitions", () => {
  assert.equal(updateCourseStatusSchema.parse({ status: "completed" }).status, "completed");
  assert.equal(updateCourseStatusSchema.parse({ status: "ongoing" }).status, "ongoing");
  assert.equal(updateCourseStatusSchema.safeParse({ status: "active" }).success, false);
  assert.equal(updateCourseStatusSchema.safeParse({ status: "completed", role: "admin" }).success, false);
});

test("student creation rejects client-supplied roles", () => {
  const result = createStudentSchema.safeParse({
    name: "Test Student",
    email: "student@example.com",
    password: "Password.1",
    confirmPassword: "Password.1",
    course: "Web Development",
    isActive: true,
    role: "admin",
  });
  assert.equal(result.success, false);
});

test("student creation rejects weak and mismatched passwords", () => {
  assert.equal(resetPasswordSchema.safeParse({ password: "weakpass", confirmPassword: "weakpass" }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ password: "Password.1", confirmPassword: "Password.2" }).success, false);
});

test("student creation accepts only explicit supported fields", () => {
  const result = createStudentSchema.safeParse({
    name: "Test Student",
    email: "student@example.com",
    password: "Password.1",
    confirmPassword: "Password.1",
    dateOfBirth: "2000-05-20",
    qualification: "BCA",
    aadhaarNo: "987654321012",
    address: "New Delhi, India",
    ...profileFields,
    ...studentFamilyFields,
    maritalStatus: "single",
    batchTiming: "10:30",
    classDuration: "1.5 hours",
    courseDuration: "3 months",
    admissionDate: "2025-01-10",
    totalFee: 25000,
    courses: ["Full Stack Web Development", "Next.js"],
    facultyIds: ["507f1f77bcf86cd799439011"],
    isActive: true,
  });
  assert.equal(result.success, true);
});

test("student creation accepts multiple faculty assignments", () => {
  const result = createStudentSchema.safeParse({ name: "Test Student", email: "student2@example.com", password: "Password.1", confirmPassword: "Password.1", dateOfBirth: "2000-05-20", qualification: "BCA", aadhaarNo: "987654321012", address: "New Delhi, India", ...profileFields, ...studentFamilyFields, batchTiming: "10:30", classDuration: "1.5 hours", courseDuration: "3 months", admissionDate: "2025-01-10", totalFee: 25000, courses: ["Full Stack Web Development", "Next.js"], facultyIds: ["507f1f77bcf86cd799439011", "507f191e810c19729de860ea"], isActive: true });
  assert.equal(result.success, true);
});

test("student creation requires courses and faculty assignments", () => {
  const base = { name: "Test Student", email: "student2@example.com", password: "Password.1", confirmPassword: "Password.1", dateOfBirth: "2000-05-20", qualification: "BCA", aadhaarNo: "987654321012", address: "New Delhi, India", ...profileFields, ...studentFamilyFields, batchTiming: "10:30", classDuration: "1.5 hours", courseDuration: "3 months", admissionDate: "2025-01-10", totalFee: 25000, courses: ["Next.js"], isActive: true };
  assert.equal(createStudentSchema.safeParse({ ...base, address: "", facultyIds: [] }).success, false);
  assert.equal(createStudentSchema.safeParse({ ...base, courses: [], facultyIds: ["507f1f77bcf86cd799439011"] }).success, false);
  assert.equal(createStudentSchema.safeParse({ ...base, facultyIds: [] }).success, false);
  assert.equal(createStudentSchema.safeParse({ ...base, facultyIds: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439011"] }).success, false);
});

test("student creation validates enrollment schedule fields", () => {
  const base = { name: "Test Student", email: "student2@example.com", password: "Password.1", confirmPassword: "Password.1", dateOfBirth: "2000-05-20", qualification: "BCA", aadhaarNo: "987654321012", address: "New Delhi, India", ...profileFields, ...studentFamilyFields, courseDuration: "3 months", totalFee: 25000, courses: ["Next.js"], facultyIds: ["507f1f77bcf86cd799439011"], isActive: true };
  assert.equal(createStudentSchema.safeParse({ ...base, batchTiming: "25:00", classDuration: "1.5 hours", admissionDate: "2025-01-10" }).success, false);
  assert.equal(createStudentSchema.safeParse({ ...base, batchTiming: "10:30", classDuration: "4 hours", admissionDate: "2025-01-10" }).success, true);
  assert.equal(createStudentSchema.safeParse({ ...base, batchTiming: "10:30", classDuration: "5.5 hours", admissionDate: "2025-01-10" }).success, false);
  assert.equal(createStudentSchema.safeParse({ ...base, batchTiming: "10:30", classDuration: "1.5 hours", admissionDate: "2999-01-10" }).success, false);
});

test("student creation validates total fee", () => {
  const base = { name: "Test Student", email: "student2@example.com", password: "Password.1", confirmPassword: "Password.1", dateOfBirth: "2000-05-20", qualification: "BCA", aadhaarNo: "987654321012", address: "New Delhi, India", ...profileFields, ...studentFamilyFields, batchTiming: "10:30", classDuration: "1.5 hours", courseDuration: "3 months", admissionDate: "2025-01-10", courses: ["Next.js"], facultyIds: ["507f1f77bcf86cd799439011"], isActive: true };
  assert.equal(createStudentSchema.safeParse({ ...base, totalFee: 0 }).success, false);
  assert.equal(createStudentSchema.safeParse({ ...base, totalFee: 25000.123 }).success, false);
  assert.equal(createStudentSchema.safeParse({ ...base, totalFee: "25000.50" }).success, true);
});

test("faculty creation validates credentials and selected courses", () => {
  const result = createFacultySchema.safeParse({ name: "Test Faculty", email: "faculty@example.com", password: "Password.1", confirmPassword: "Password.1", aadhaarNo: "123456789012", address: "New Delhi, India", ...profileFields, dateOfBirth: "1990-01-15", qualification: "M.Tech", courses: ["Digital Marketing", "Python", "Next.js"], isActive: true });
  assert.equal(result.success, true);
});

test("faculty creation requires a supported course", () => {
  const base = { name: "Test Faculty", email: "faculty@example.com", password: "Password.1", confirmPassword: "Password.1", aadhaarNo: "123456789012", address: "New Delhi, India", ...profileFields, dateOfBirth: "1990-01-15", qualification: "M.Tech", isActive: true };
  assert.equal(createFacultySchema.safeParse({ ...base, courses: [] }).success, false);
  assert.equal(createFacultySchema.safeParse({ ...base, courses: ["Unsupported"] }).success, false);
});

test("faculty creation requires a 12-digit Aadhaar number and address", () => {
  const base = { name: "Test Faculty", email: "faculty@example.com", password: "Password.1", confirmPassword: "Password.1", ...profileFields, dateOfBirth: "1990-01-15", qualification: "M.Tech", courses: ["MERN Stack"], isActive: true };
  assert.equal(createFacultySchema.safeParse({ ...base, aadhaarNo: "1234", address: "New Delhi, India" }).success, false);
  assert.equal(createFacultySchema.safeParse({ ...base, aadhaarNo: "123456789012", address: "" }).success, false);
});

test("faculty creation requires a past date of birth and qualification", () => {
  const base = { name: "Test Faculty", email: "faculty@example.com", password: "Password.1", confirmPassword: "Password.1", aadhaarNo: "123456789012", address: "New Delhi, India", ...profileFields, courses: ["MERN Stack"], isActive: true };
  assert.equal(createFacultySchema.safeParse({ ...base, dateOfBirth: "2990-01-15", qualification: "M.Tech" }).success, false);
  assert.equal(createFacultySchema.safeParse({ ...base, dateOfBirth: "1990-01-15", qualification: "" }).success, false);
});

test("profile location requires a district in the selected state", () => {
  const result = createFacultySchema.safeParse({ name: "Test Faculty", email: "location@example.com", password: "Password.1", confirmPassword: "Password.1", aadhaarNo: "123456789012", address: "New Delhi, India", ...profileFields, district: "Patna", dateOfBirth: "1990-01-15", qualification: "M.Tech", courses: ["MERN Stack"], isActive: true });
  assert.equal(result.success, false);
});

test("admin updates validate faculty and student editable fields", () => {
  assert.equal(updateFacultySchema.safeParse({ name: "Updated Faculty", courses: ["Applied AI", "Python"] }).success, true);
  assert.equal(updateFacultySchema.safeParse({ courses: [] }).success, false);
  assert.equal(updateStudentSchema.safeParse({ totalFee: "30000.50", facultyIds: ["507f1f77bcf86cd799439011"], courses: ["Next.js"] }).success, true);
  assert.equal(updateStudentSchema.safeParse({ facultyIds: ["bad-id"] }).success, false);
});
