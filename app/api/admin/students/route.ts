import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { sendRegistrationEmail } from "@/lib/email";
import { connectMongoDB } from "@/lib/mongodb";
import { canAccessCourse } from "@/lib/materials";
import { auditSecurityEvent } from "@/lib/security-audit";
import { generateUniqueStudentId } from "@/lib/student-id";
import { createStudentSchema, studentListQuerySchema } from "@/lib/validators/auth";
import { User, toSafeUser } from "@/models/User";

export const runtime = "nodejs";

function isDuplicateKeyError(error: unknown): error is { code: number; keyPattern?: Record<string, number> } {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function escapedRegex(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request", 400);
  }
  if (auth.user.role === "faculty" && typeof body === "object" && body !== null && !Array.isArray(body)) {
    body = { ...body, facultyIds: [auth.user._id.toString()] };
  }
  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  if (auth.user.role === "faculty" && !parsed.data.courses.every((course) => canAccessCourse(auth.user, course))) {
    return apiError("You can only register students for courses assigned to you", 403);
  }

  try {
    await connectMongoDB();
    if (await User.exists({ phone: parsed.data.phone })) return apiError("A user with that phone number already exists", 409);
    const password = await bcrypt.hash(parsed.data.password, 12);
    const studentId = await generateUniqueStudentId();
    let facultyIds = auth.user.role === "faculty" ? [auth.user._id] : [];
    if (auth.user.role === "admin" && parsed.data.facultyIds.length) {
      const faculty = await User.find({ _id: { $in: parsed.data.facultyIds }, role: "faculty", isActive: true }).select("_id");
      if (faculty.length !== parsed.data.facultyIds.length) return apiError("One or more active faculty members were not found", 400);
      facultyIds = faculty.map((item) => item._id);
    }
    const student = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      password,
      role: "student",
      studentId,
      ...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
      ...(parsed.data.profileImageUrl ? { profileImageUrl: parsed.data.profileImageUrl } : {}),
      dateOfBirth: new Date(`${parsed.data.dateOfBirth}T00:00:00.000Z`),
      qualification: parsed.data.qualification,
      aadhaarNo: parsed.data.aadhaarNo,
      address: parsed.data.address,
      state: parsed.data.state,
      district: parsed.data.district,
      bloodGroup: parsed.data.bloodGroup,
      nationality: parsed.data.nationality,
      gender: parsed.data.gender,
      maritalStatus: parsed.data.maritalStatus,
      fatherName: parsed.data.fatherName,
      fatherOccupation: parsed.data.fatherOccupation,
      fatherPhone: parsed.data.fatherPhone,
      batchTiming: parsed.data.batchTiming,
      classDuration: parsed.data.classDuration,
      courseDuration: parsed.data.courseDuration,
      admissionDate: new Date(`${parsed.data.admissionDate}T00:00:00.000Z`),
      totalFee: parsed.data.totalFee,
      courses: parsed.data.courses,
      course: parsed.data.courses.join(", "),
      isActive: parsed.data.isActive,
      createdBy: auth.user._id,
      facultyIds,
      facultyAssignments: facultyIds.map((facultyId) => ({ facultyId, assignedAt: new Date() })),
    });
    auditSecurityEvent("student_created", auth.user._id.toString(), student._id.toString());
    const emailSent = await sendRegistrationEmail({ name: student.name, email: student.email, role: "student", studentId: student.studentId, courses: student.courses || [] });
    return apiSuccess("Student registered successfully", { student: toSafeUser(student), emailSent }, 201);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      if (error.keyPattern?.phone) return apiError("A user with that phone number already exists", 409);
      return apiError("A student with that email, student ID, or Aadhaar number already exists", 409);
    }
    return apiError("Unable to register student", 500);
  }
}

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;

  const queryObject = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = studentListQuerySchema.safeParse(queryObject);
  if (!parsed.success) return validationError(parsed.error);

  try {
    await connectMongoDB();
    const { page, limit, search, status, courseStatus, admissionFrom, admissionTo, batch, facultyId } = parsed.data;
    const filter: Record<string, unknown> = { role: "student" };
    const conditions: Array<Record<string, unknown>> = [];
    if (auth.user.role === "faculty") conditions.push({ $or: [{ facultyIds: auth.user._id }, { facultyId: auth.user._id }] });
    if (status !== "all") filter.isActive = status === "active";
    if (courseStatus !== "all") filter.courseStatus = courseStatus;
    if (batch) filter.batchTiming = batch;
    if (admissionFrom || admissionTo) {
      filter.admissionDate = {
        ...(admissionFrom ? { $gte: new Date(`${admissionFrom}T00:00:00.000Z`) } : {}),
        ...(admissionTo ? { $lte: new Date(`${admissionTo}T23:59:59.999Z`) } : {}),
      };
    }
    if (facultyId) conditions.push({ $or: [{ facultyIds: facultyId }, { facultyId }] });
    if (search) {
      const regex = escapedRegex(search);
      conditions.push({ $or: [{ name: regex }, { studentId: regex }, { phone: regex }, { district: regex }, { course: regex }, { courses: regex }, { fatherName: regex }] });
    }
    if (conditions.length) filter.$and = conditions;

    const [students, total] = await Promise.all([
      User.find(filter).sort({ admissionDate: -1, createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);
    const assignedIds = [...new Set(students.flatMap((student) => [...(student.facultyIds || []).map((id) => id.toString()), ...(student.facultyId ? [student.facultyId.toString()] : [])]))];
    const assignedFaculty = assignedIds.length ? await User.find({ _id: { $in: assignedIds }, role: "faculty" }).select("name") : [];
    const facultyNames = new Map(assignedFaculty.map((faculty) => [faculty._id.toString(), faculty.name]));
    return apiSuccess("Students retrieved", {
      students: students.map((student) => {
        const ids = [...new Set([...(student.facultyIds || []).map((id) => id.toString()), ...(student.facultyId ? [student.facultyId.toString()] : [])])];
        return { ...toSafeUser(student), facultyNames: ids.flatMap((id) => facultyNames.has(id) ? [facultyNames.get(id)!] : []) };
      }),
      pagination: {
        page,
        limit,
        totalStudents: total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch {
    return apiError("Unable to retrieve students", 500);
  }
}
