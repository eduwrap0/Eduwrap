import ExcelJS from "exceljs";
import type { NextRequest } from "next/server";
import { apiError, validationError } from "@/lib/api-response";
import { authorizeApi } from "@/lib/auth";
import { formatBatchTime } from "@/lib/format-batch-time";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { studentListQuerySchema } from "@/lib/validators/auth";
import { User } from "@/models/User";

export const runtime = "nodejs";

function escapedRegex(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function titleCase(value?: string): string {
  if (!value) return "Not provided";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;

  const parsed = studentListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return validationError(parsed.error);

  try {
    await connectMongoDB();
    const { search, status, courseStatus, admissionFrom, admissionTo, batch, facultyId } = parsed.data;
    const filter: Record<string, unknown> = { role: "student" };
    const conditions: Array<Record<string, unknown>> = [];

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

    const students = await User.find(filter)
      .select("+aadhaarNo name email studentId phone dateOfBirth gender qualification aadhaarNo fatherName fatherOccupation fatherPhone address state district bloodGroup nationality maritalStatus courses course facultyIds facultyId batchTiming classDuration courseDuration admissionDate totalFee courseStatus courseCompletedAt isActive createdAt")
      .sort({ admissionDate: -1, createdAt: -1, _id: -1 });

    const facultyIds = [...new Set(students.flatMap((student) => [
      ...(student.facultyIds || []).map(String),
      ...(student.facultyId ? [student.facultyId.toString()] : []),
    ]))];
    const faculty = facultyIds.length ? await User.find({ _id: { $in: facultyIds }, role: "faculty" }).select("name") : [];
    const facultyNames = new Map(faculty.map((item) => [item._id.toString(), item.name]));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "EduWrap";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Students", { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = [
      { header: "S.No.", key: "serial", width: 8 },
      { header: "Student ID", key: "studentId", width: 18 },
      { header: "Student Name", key: "name", width: 26 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Date of Birth", key: "dateOfBirth", width: 16 },
      { header: "Gender", key: "gender", width: 14 },
      { header: "Qualification", key: "qualification", width: 22 },
      { header: "Aadhaar Number", key: "aadhaarNo", width: 18 },
      { header: "Father / Guardian", key: "fatherName", width: 24 },
      { header: "Guardian Occupation", key: "fatherOccupation", width: 22 },
      { header: "Guardian Phone", key: "fatherPhone", width: 17 },
      { header: "Address", key: "address", width: 35 },
      { header: "State", key: "state", width: 20 },
      { header: "City / District", key: "district", width: 20 },
      { header: "Blood Group", key: "bloodGroup", width: 14 },
      { header: "Nationality", key: "nationality", width: 16 },
      { header: "Marital Status", key: "maritalStatus", width: 16 },
      { header: "Courses", key: "courses", width: 34 },
      { header: "Assigned Faculty", key: "faculty", width: 28 },
      { header: "Batch Timing", key: "batchTiming", width: 17 },
      { header: "Class Duration", key: "classDuration", width: 17 },
      { header: "Course Duration", key: "courseDuration", width: 18 },
      { header: "Admission Date", key: "admissionDate", width: 18 },
      { header: "Total Fee", key: "totalFee", width: 15 },
      { header: "Course Status", key: "courseStatus", width: 17 },
      { header: "Completion Date", key: "courseCompletedAt", width: 18 },
      { header: "Account Status", key: "accountStatus", width: 17 },
      { header: "Created On", key: "createdAt", width: 18 },
    ];

    students.forEach((student, index) => {
      const assignedIds = [...new Set([...(student.facultyIds || []).map(String), ...(student.facultyId ? [student.facultyId.toString()] : [])])];
      sheet.addRow({
        serial: index + 1,
        studentId: student.studentId || "Not assigned",
        name: student.name,
        email: student.email,
        phone: student.phone || "Not provided",
        dateOfBirth: student.dateOfBirth || null,
        gender: titleCase(student.gender),
        qualification: student.qualification || "Not provided",
        aadhaarNo: student.aadhaarNo || "Not provided",
        fatherName: student.fatherName || "Not provided",
        fatherOccupation: student.fatherOccupation || "Not provided",
        fatherPhone: student.fatherPhone || "Not provided",
        address: student.address || "Not provided",
        state: student.state || "Not provided",
        district: student.district || "Not provided",
        bloodGroup: student.bloodGroup || "Not provided",
        nationality: student.nationality || "Not provided",
        maritalStatus: titleCase(student.maritalStatus),
        courses: student.courses?.length ? student.courses.join(", ") : student.course || "Not assigned",
        faculty: assignedIds.flatMap((id) => facultyNames.has(id) ? [facultyNames.get(id)!] : []).join(", ") || "Not assigned",
        batchTiming: formatBatchTime(student.batchTiming),
        classDuration: student.classDuration || "Not assigned",
        courseDuration: student.courseDuration || "Not assigned",
        admissionDate: student.admissionDate || null,
        totalFee: student.totalFee ?? null,
        courseStatus: student.courseStatus === "completed" ? "Completed" : "Ongoing",
        courseCompletedAt: student.courseCompletedAt || null,
        accountStatus: student.isActive ? "Active" : "Locked",
        createdAt: student.createdAt,
      });
    });

    const header = sheet.getRow(1);
    header.height = 28;
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.alignment = { vertical: "middle", horizontal: "center" };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA00B44" } };
    sheet.autoFilter = { from: "A1", to: "AC1" };
    sheet.getColumn("dateOfBirth").numFmt = "dd mmm yyyy";
    sheet.getColumn("admissionDate").numFmt = "dd mmm yyyy";
    sheet.getColumn("courseCompletedAt").numFmt = "dd mmm yyyy";
    sheet.getColumn("createdAt").numFmt = "dd mmm yyyy";
    sheet.getColumn("totalFee").numFmt = "₹#,##0.00";
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.alignment = { vertical: "top", wrapText: true };
      if (rowNumber % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDF7F9" } };
    });

    const output = await workbook.xlsx.writeBuffer();
    auditSecurityEvent("student_data_exported", auth.user._id.toString());
    const filename = `EduWrap-Students-${new Date().toISOString().slice(0, 10)}.xlsx`;
    return new Response(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return apiError("Unable to export student data", 500);
  }
}