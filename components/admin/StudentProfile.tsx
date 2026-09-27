"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { EditStudentModal } from "@/components/admin/EditStudentModal";
import { FeeHistory } from "@/components/admin/FeeHistory";
import { ResetPasswordDialog } from "@/components/admin/ResetPasswordDialog";
import { confirmAction } from "@/lib/confirm-dialog";
import { formatBatchTime } from "@/lib/format-batch-time";
import type { SafeUser } from "@/types/auth";

function displayDate(value?: string) {
  return value ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }) : "Not provided";
}

function displayValue(value?: string) {
  return value?.trim() || "Not provided";
}

function Detail({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return <div className="student-profile-detail"><span><i className={`fa fa-${icon}`} aria-hidden="true" /></span><div><small>{label}</small><strong>{value}</strong></div></div>;
}

export function StudentProfile({ student, aadhaarNo, canEdit = false, faculties = [] }: { student: SafeUser; aadhaarNo?: string; canEdit?: boolean; faculties?: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [courseStatusLoading, setCourseStatusLoading] = useState(false);
  const courses = student.courses?.length ? student.courses : student.course ? [student.course] : [];
  const assignedFacultyIds = new Set([...(student.facultyIds || []), ...(student.facultyId ? [student.facultyId] : [])]);
  const feeFaculties = faculties.filter((faculty) => assignedFacultyIds.has(faculty.id));
  const fee = student.totalFee === undefined ? "Not provided" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(student.totalFee);

  async function toggleStatus() {
    setStatusLoading(true);
    try {
      const response = await fetch(`/api/admin/students/${student.id}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isActive: !student.isActive }) });
      const result = await response.json() as { message: string };
      if (!response.ok) throw new Error(result.message);
      toast.success(result.message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update student status.");
    } finally {
      setStatusLoading(false);
    }
  }

  async function toggleCourseStatus() {
    const completed = student.courseStatus === "completed";
    const confirmed = await confirmAction(
      completed ? "Change course back to ongoing?" : "Mark this course as completed?",
      completed ? "The certificate will no longer be available until the course is completed again." : "This will record the completion date and make the certificate available.",
      completed ? "Change to ongoing" : "Complete course",
    );
    if (!confirmed) return;
    setCourseStatusLoading(true);
    try {
      const response = await fetch(`/api/students/${student.id}/course-completion`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: completed ? "ongoing" : "completed" }) });
      const result = await response.json() as { message: string };
      if (!response.ok) throw new Error(result.message);
      toast.success(result.message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update course status.");
    } finally {
      setCourseStatusLoading(false);
    }
  }

  return <>
    {editing && <EditStudentModal student={student} faculties={faculties} onClose={() => setEditing(false)} onSaved={(_, message) => { setEditing(false); toast.success(message); router.refresh(); }} />}
    {resetting && <ResetPasswordDialog name={student.name} endpoint={`/api/admin/students/${student.id}/reset-password`} onClose={() => setResetting(false)} />}
    <div className="student-profile-page">
    <section className="student-profile-hero">
      <div className="student-profile-identity"><span className={`student-profile-avatar ${student.profileImageUrl ? "has-profile-image" : ""}`} style={student.profileImageUrl ? { backgroundImage: `url(${student.profileImageUrl})` } : undefined}>{!student.profileImageUrl && student.name.charAt(0).toUpperCase()}</span><div><span className="student-profile-kicker">Student profile</span><h1>{student.name}</h1><p>{student.email}</p><div className="student-profile-tags"><code>{student.studentId || "ID pending"}</code><span className={`course-status-badge ${student.courseStatus === "completed" ? "is-completed" : "is-ongoing"}`}><i />{student.courseStatus === "completed" ? "Course completed" : "Course ongoing"}</span><span className={`student-profile-status ${student.isActive ? "is-active" : "is-locked"}`}><i />{student.isActive ? "Account active" : "Account locked"}</span></div></div></div>
      <div className="student-profile-hero-meta"><small>Member since</small><strong>{new Date(student.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong><span>Last updated {new Date(student.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
    </section>

    <section className="student-profile-action-bar" aria-label="Student profile actions"><div><span>Profile actions</span><small>Manage this student account</small></div><div>{canEdit && <><a href={`/api/admin/students/${student.id}/admission-form`}><i className="fa fa-file-pdf-o" /> Admission form</a><button type="button" onClick={() => setEditing(true)}><i className="fa fa-pencil" /> Edit profile</button><button type="button" disabled={statusLoading} onClick={() => void toggleStatus()}><i className={`fa fa-${student.isActive ? "lock" : "unlock"}`} /> {student.isActive ? "Lock account" : "Unlock account"}</button></>}<button type="button" onClick={() => setResetting(true)}><i className="fa fa-key" /> Reset password</button></div></section>

    <div className="student-profile-layout">
      <div className="student-profile-main">
        <section className="student-profile-panel"><header><span><i className="fa fa-address-card" /></span><div><h2>Personal information</h2><p>Identity, contact, and background details.</p></div></header><div className="student-profile-detail-grid">
          <Detail icon="phone" label="Phone number" value={displayValue(student.phone)} />
          <Detail icon="id-card" label="Aadhaar number" value={displayValue(aadhaarNo)} />
          <Detail icon="birthday-cake" label="Date of birth" value={displayDate(student.dateOfBirth)} />
          <Detail icon="graduation-cap" label="Qualification" value={displayValue(student.qualification)} />
          <Detail icon="venus-mars" label="Gender" value={student.gender ? student.gender.replaceAll("_", " ") : "Not provided"} />
          <Detail icon="heart" label="Marital status" value={displayValue(student.maritalStatus)} />
          <Detail icon="tint" label="Blood group" value={displayValue(student.bloodGroup)} />
          <Detail icon="flag" label="Nationality" value={displayValue(student.nationality)} />
          <Detail icon="map-marker" label="State and district" value={[student.district, student.state].filter(Boolean).join(", ") || "Not provided"} />
        </div><div className="student-profile-address"><small>Residential address</small><p>{displayValue(student.address)}</p></div></section>

        <section className="student-profile-panel"><header><span><i className="fa fa-users" /></span><div><h2>Father / guardian</h2><p>Guardian contact and occupation information.</p></div></header><div className="student-profile-detail-grid">
          <Detail icon="user" label="Father's name" value={displayValue(student.fatherName)} />
          <Detail icon="briefcase" label="Occupation" value={displayValue(student.fatherOccupation)} />
          <Detail icon="phone" label="Contact number" value={displayValue(student.fatherPhone)} />
        </div></section>

        <section className="student-profile-panel"><header><span><i className="fa fa-calendar" /></span><div><h2>Enrollment and schedule</h2><p>Admission, timing, duration, and fee details.</p></div></header><div className="student-profile-detail-grid">
          <Detail icon="calendar-check-o" label="Admission date" value={displayDate(student.admissionDate)} />
          <Detail icon="clock-o" label="Batch timing" value={formatBatchTime(student.batchTiming)} />
          <Detail icon="hourglass-half" label="Class duration" value={displayValue(student.classDuration)} />
          <Detail icon="calendar-o" label="Course duration" value={displayValue(student.courseDuration)} />
          <Detail icon="inr" label="Total fee" value={fee} />
        </div></section>

        {canEdit && <FeeHistory studentId={student.id} className="student-profile-panel" allowSubmit student={{ id: student.id, studentId: student.studentId || student.id, name: student.name, fatherName: student.fatherName, phone: student.phone, email: student.email, totalFee: student.totalFee, courses: student.courses?.length ? student.courses : student.course ? [student.course] : [], faculties: feeFaculties }} />}
      </div>

      <aside className="student-profile-side">
        <section className="student-profile-panel student-profile-side-panel course-completion-panel"><header><span><i className="fa fa-certificate" /></span><div><h2>Course completion</h2><p>Completion and certificate status.</p></div></header><div className="course-completion-summary"><div><small>Course status</small><strong className={student.courseStatus === "completed" ? "is-completed" : "is-ongoing"}><i />{student.courseStatus === "completed" ? "Completed" : "Ongoing"}</strong></div><div><small>Completed on</small><strong>{student.courseCompletedAt ? new Date(student.courseCompletedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "Not completed"}</strong></div><div><small>Certificate</small><strong>{student.courseStatus === "completed" ? "Available" : "Not available"}</strong></div></div>{canEdit && <div className="course-completion-actions">{student.courseStatus === "completed" && <a href={`/api/certificates/${student.id}`}><i className="fa fa-download" /> Download certificate</a>}<button type="button" disabled={courseStatusLoading} onClick={() => void toggleCourseStatus()}><i className={`fa fa-${student.courseStatus === "completed" ? "refresh" : "check"}`} /> {student.courseStatus === "completed" ? "Change status" : "Complete course"}</button></div>}</section>
        <section className="student-profile-panel student-profile-side-panel"><header><span><i className="fa fa-book" /></span><div><h2>Courses</h2><p>Current learning plan.</p></div></header>{courses.length ? <div className="student-profile-course-list">{courses.map((course) => <span key={course}><i className="fa fa-check" />{course}</span>)}</div> : <div className="student-profile-unassigned">No courses assigned</div>}</section>
        <section className="student-profile-panel student-profile-side-panel"><header><span><i className="fa fa-user-md" /></span><div><h2>Assigned faculty</h2><p>Teaching responsibility.</p></div></header>{student.facultyNames?.length ? <div className="student-profile-faculty-list">{student.facultyNames.map((name) => <div key={name}><span>{name.charAt(0).toUpperCase()}</span><strong>{name}</strong></div>)}</div> : <div className="student-profile-unassigned">No faculty assigned</div>}</section>
      </aside>
    </div>
    </div>
  </>;
}
