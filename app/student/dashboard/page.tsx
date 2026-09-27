import type { Metadata } from "next";
import { FeeHistory } from "@/components/admin/FeeHistory";
import { requirePageRole } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { formatBatchTime } from "@/lib/format-batch-time";
import { User } from "@/models/User";

export const metadata: Metadata = { title: "Student Dashboard", robots: { index: false, follow: false } };

function Detail({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return <div className="profile-detail"><span><i className={`fa fa-${icon}`} /></span><div><dt>{label}</dt><dd>{value}</dd></div></div>;
}

export default async function StudentDashboardPage() {
  const student = await requirePageRole("student");
  await connectMongoDB();
  const facultyIds = [...new Set([...(student.facultyIds || []).map((id) => id.toString()), ...(student.facultyId ? [student.facultyId.toString()] : [])])];
  const faculty = facultyIds.length ? await User.find({ _id: { $in: facultyIds }, role: "faculty" }).select("name") : [];
  const courses = student.courses?.length ? student.courses : student.course ? [student.course] : [];
  const courseNames = courses.length ? courses.join(", ") : "No course assigned";

  return <div className="dashboard-page student-dashboard">
    <section className="student-welcome-card">
      <div className="student-welcome-avatar">{student.name.charAt(0).toUpperCase()}</div>
      <div className="student-welcome-copy"><span className="dashboard-kicker"><i className="fa fa-graduation-cap" /> Student portal</span><h1>Welcome, {student.name.split(" ")[0]}</h1><p>Your learning profile, enrollment, and class information in one place.</p><div className="student-identity"><span><i className="fa fa-id-card" /> {student.studentId}</span><span><i className="fa fa-envelope" /> {student.email}</span></div></div>
      <div className="student-welcome-statuses"><span className={`dashboard-status student-course-status ${student.courseStatus === "completed" ? "is-completed" : "is-ongoing"}`}><i />{student.courseStatus === "completed" ? "Course completed" : "Course ongoing"}</span><span className={`dashboard-status student-account-status ${student.isActive ? "is-active" : "is-locked"}`}><i />{student.isActive ? "Account active" : "Account locked"}</span></div>
    </section>

    <div className="student-summary-grid">
      <article><span className="summary-icon purple"><i className="fa fa-book" /></span><div><small>Enrolled courses</small><strong>{courses.length}</strong><p title={courseNames}>{courseNames}</p></div></article>
      <article><span className="summary-icon blue"><i className="fa fa-clock-o" /></span><div><small>Batch schedule</small><strong>{formatBatchTime(student.batchTiming, "—")}</strong><p>{student.classDuration || "Duration not assigned"}</p></div></article>
      <article><span className="summary-icon green"><i className="fa fa-calendar-check-o" /></span><div><small>Admission date</small><strong>{student.admissionDate ? student.admissionDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—"}</strong><p>{student.courseDuration || "Course duration not assigned"}</p></div></article>
      <article><span className="summary-icon amber"><i className="fa fa-inr" /></span><div><small>Total fee</small><strong>{student.totalFee !== undefined ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(student.totalFee) : "—"}</strong><p>Enrollment fee amount</p></div></article>
    </div>

    <div className="student-dashboard-grid">
      <section className="app-card dashboard-panel student-profile-panel"><div className="dashboard-panel-head"><div><span className="dashboard-section-label">Personal record</span><h2>Profile information</h2><p>Your verified account details.</p></div><span className="panel-head-icon"><i className="fa fa-user" /></span></div><dl className="profile-detail-grid">
        <Detail icon="user" label="Full name" value={student.name} /><Detail icon="phone" label="Phone number" value={student.phone || "Not provided"} /><Detail icon="birthday-cake" label="Date of birth" value={student.dateOfBirth ? student.dateOfBirth.toLocaleDateString("en-IN", { timeZone: "UTC" }) : "Not provided"} /><Detail icon="certificate" label="Qualification" value={student.qualification || "Not provided"} /><Detail icon="heart" label="Marital status" value={student.maritalStatus ? student.maritalStatus.charAt(0).toUpperCase() + student.maritalStatus.slice(1) : "Not provided"} /><Detail icon="map-marker" label="Address" value={student.address || "Not provided"} />
      </dl></section>

      <aside className="app-card dashboard-panel enrollment-panel"><div className="dashboard-panel-head"><div><span className="dashboard-section-label">Learning plan</span><h2>Enrollment</h2><p>Your assigned learning details.</p></div></div><div className="enrollment-stack"><div><span><i className="fa fa-book" /></span><div><small>Courses</small><strong>{courses.length ? courses.join(", ") : "Not assigned"}</strong></div></div><div><span><i className="fa fa-users" /></span><div><small>Assigned faculty</small><strong>{faculty.length ? faculty.map((item) => item.name).join(", ") : "Not assigned"}</strong></div></div><div><span><i className="fa fa-calendar" /></span><div><small>Member since</small><strong>{student.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</strong></div></div></div><div className="student-support"><span><i className="fa fa-life-ring" /></span><div><strong>Need help?</strong><p>Contact your faculty or administrator to update your profile or enrollment.</p></div></div></aside>
      <section className="app-card dashboard-panel student-certificate-panel"><div className="dashboard-panel-head"><div><span className="dashboard-section-label">Achievement</span><h2>Course completion</h2><p>Your completion status and certificate access.</p></div><span className="panel-head-icon"><i className="fa fa-certificate" /></span></div><div className="student-certificate-status"><div><small>Course status</small><strong className={student.courseStatus === "completed" ? "is-completed" : "is-ongoing"}><i />{student.courseStatus === "completed" ? "Completed" : "Ongoing"}</strong></div><div><small>Completed on</small><strong>{student.courseCompletedAt ? student.courseCompletedAt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }) : "Not completed"}</strong></div><div><small>Certificate</small>{student.courseStatus === "completed" ? <a href={`/api/certificates/${student._id.toString()}`}><i className="fa fa-download" /> Download certificate</a> : <strong>Not available</strong>}</div></div></section>
      <FeeHistory studentId={student._id.toString()} className="app-card dashboard-panel student-fee-history-panel" />
    </div>
  </div>;
}
