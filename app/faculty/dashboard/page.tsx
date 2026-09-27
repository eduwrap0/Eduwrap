import type { Metadata } from "next";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const metadata: Metadata = { title: "Faculty Dashboard", robots: { index: false, follow: false } };

export default async function FacultyDashboardPage({ searchParams }: { searchParams: Promise<{ courseStatus?: string }> }) {
  const requestedStatus = (await searchParams).courseStatus;
  const courseStatus: "all" | "ongoing" | "completed" = requestedStatus === "ongoing" || requestedStatus === "completed" ? requestedStatus : "all";
  const faculty = await requirePageRole("faculty");
  await connectMongoDB();
  const assignment = { $or: [{ facultyIds: faculty._id }, { facultyId: faculty._id }] };
  const studentFilter = { role: "student" as const, ...assignment, ...(courseStatus === "all" ? {} : { courseStatus }) };
  const [total, active, recent] = await Promise.all([
    User.countDocuments(studentFilter),
    User.countDocuments({ ...studentFilter, isActive: true }),
    User.find(studentFilter).sort({ createdAt: -1 }).limit(6),
  ]);

  return <div className="dashboard-page">
    <section className="dashboard-hero faculty-hero">
      <div><span className="dashboard-kicker"><i className="fa fa-graduation-cap" /> Faculty workspace</span><h1>Hello, {faculty.name.split(" ")[0]}</h1><p>Keep track of your learners and manage their enrollment journey.</p></div>
      <div className="dashboard-hero-actions"><Link href="/faculty/students" className="btn dashboard-btn-secondary"><i className="fa fa-users" /> My students</Link><Link href="/faculty/students/new" className="btn dashboard-btn-primary"><i className="fa fa-user-plus" /> Add student</Link></div>
      <span className="dashboard-hero-orb dashboard-hero-orb-one" /><span className="dashboard-hero-orb dashboard-hero-orb-two" />
    </section>

    <section className="faculty-dashboard-filter" aria-label="Filter dashboard students by course status">
      <div><span className="dashboard-section-label">Student filter</span><strong>Course status</strong><small>Dashboard totals and recent students update together.</small></div>
      <nav aria-label="Course status options">
        <Link href="/faculty/dashboard" className={courseStatus === "all" ? "active" : ""}>All students</Link>
        <Link href="/faculty/dashboard?courseStatus=ongoing" className={courseStatus === "ongoing" ? "active" : ""}>Ongoing</Link>
        <Link href="/faculty/dashboard?courseStatus=completed" className={courseStatus === "completed" ? "active" : ""}>Completed</Link>
      </nav>
    </section>

    <div className="dashboard-metrics dashboard-metrics-three">
      <article className="dashboard-metric accent-purple"><span className="dashboard-metric-icon"><i className="fa fa-users" /></span><div><small>Assigned students</small><strong>{total}</strong><span>Your complete learner list</span></div></article>
      <article className="dashboard-metric accent-green"><span className="dashboard-metric-icon"><i className="fa fa-check-circle" /></span><div><small>Active students</small><strong>{active}</strong><span>{total ? Math.round((active / total) * 100) : 0}% currently active</span></div></article>
      <article className="dashboard-metric accent-amber"><span className="dashboard-metric-icon"><i className="fa fa-lock" /></span><div><small>Locked students</small><strong>{total - active}</strong><span>Accounts needing attention</span></div></article>
    </div>

    <section className="app-card dashboard-panel">
      <div className="dashboard-panel-head"><div><span className="dashboard-section-label">Your learners</span><h2>Recently registered</h2><p>The latest students assigned to your account.</p></div><Link href="/faculty/students" className="dashboard-text-link">View all students <i className="fa fa-arrow-right" /></Link></div>
      {recent.length === 0 ? <div className="app-empty"><span className="dashboard-empty-icon"><i className="fa fa-users" /></span><strong>No students assigned yet</strong><span>Register a student to begin managing their learning journey.</span><Link href="/faculty/students/new" className="btn dashboard-btn-primary mt-3">Register student</Link></div> : <div className="dashboard-student-grid">{recent.map((student) => <article className="dashboard-student-card" key={student._id.toString()}><div className="dashboard-student-card-head"><span className="dashboard-person-avatar">{student.name.charAt(0).toUpperCase()}</span></div><h3>{student.name}</h3><p>{student.email}</p><dl><div><dt>Student ID</dt><dd>{student.studentId}</dd></div><div><dt>Courses</dt><dd>{student.courses?.length ? student.courses.join(", ") : student.course || "Not assigned"}</dd></div></dl><div className="faculty-dashboard-card-statuses" aria-label="Student statuses"><span className={`student-list-status course ${student.courseStatus === "completed" ? "is-completed" : "is-ongoing"}`}><i />Course {student.courseStatus === "completed" ? "completed" : "ongoing"}</span><span className={`student-list-status account ${student.isActive ? "is-active" : "is-locked"}`}><i />Account {student.isActive ? "active" : "locked"}</span></div></article>)}</div>}
    </section>
  </div>;
}
