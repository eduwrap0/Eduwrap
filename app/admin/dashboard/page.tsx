import type { Metadata } from "next";
import Link from "next/link";
import { connectMongoDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const metadata: Metadata = { title: "Admin Dashboard", robots: { index: false, follow: false } };

export default async function AdminDashboardPage() {
  await connectMongoDB();
  const [total, active, facultyTotal, activeFaculty, recent] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "student", isActive: true }),
    User.countDocuments({ role: "faculty" }),
    User.countDocuments({ role: "faculty", isActive: true }),
    User.find({ role: "student" }).sort({ createdAt: -1 }).limit(5),
  ]);

  return <div className="dashboard-page">
    <section className="dashboard-hero">
      <div><span className="dashboard-kicker"><i className="fa fa-shield" aria-hidden="true" /> Administration workspace</span><h1>Welcome back</h1><p>Monitor enrollment, manage access, and keep your learning operations moving.</p></div>
      <div className="dashboard-hero-actions"><Link href="/admin/faculty/new" className="btn dashboard-btn-secondary"><i className="fa fa-user-md" /> Add faculty</Link><Link href="/admin/students/new" className="btn dashboard-btn-primary"><i className="fa fa-user-plus" /> Add student</Link></div>
      <span className="dashboard-hero-orb dashboard-hero-orb-one" /><span className="dashboard-hero-orb dashboard-hero-orb-two" />
    </section>

    <div className="dashboard-metrics">
      <article className="dashboard-metric accent-purple"><span className="dashboard-metric-icon"><i className="fa fa-users" /></span><div><small>Total students</small><strong>{total}</strong><span>All enrolled accounts</span></div></article>
      <article className="dashboard-metric accent-green"><span className="dashboard-metric-icon"><i className="fa fa-check-circle" /></span><div><small>Active students</small><strong>{active}</strong><span>{total ? Math.round((active / total) * 100) : 0}% of students active</span></div></article>
      <article className="dashboard-metric accent-amber"><span className="dashboard-metric-icon"><i className="fa fa-lock" /></span><div><small>Locked students</small><strong>{total - active}</strong><span>Access currently paused</span></div></article>
      <article className="dashboard-metric accent-blue"><span className="dashboard-metric-icon"><i className="fa fa-user-md" /></span><div><small>Faculty members</small><strong>{facultyTotal}</strong><span>{activeFaculty} active accounts</span></div></article>
    </div>

    <section className="app-card dashboard-panel dashboard-panel-wide">
      <div className="dashboard-panel-head"><div><span className="dashboard-section-label">Latest activity</span><h2>Recent students</h2><p>The five newest enrollment records.</p></div><Link href="/admin/students" className="dashboard-text-link">View all students <i className="fa fa-arrow-right" /></Link></div>
      {recent.length === 0 ? <div className="app-empty"><span className="dashboard-empty-icon"><i className="fa fa-user-plus" /></span><strong>No students yet</strong><span>Register the first student to see activity here.</span></div> : <div className="table-responsive"><table className="table app-table dashboard-table align-middle mb-0"><thead><tr><th>Student</th><th>Student ID</th><th>Courses</th><th>Joined</th><th>Status</th></tr></thead><tbody>{recent.map((student) => <tr key={student._id.toString()}><td><div className="dashboard-person"><span>{student.name.charAt(0).toUpperCase()}</span><div><strong>{student.name}</strong><small>{student.email}</small></div></div></td><td><code>{student.studentId}</code></td><td><span className="dashboard-course-text">{student.courses?.length ? student.courses.join(", ") : student.course || "Not assigned"}</span></td><td>{student.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td><td><span className={`dashboard-status ${student.isActive ? "is-active" : "is-locked"}`}><i />{student.isActive ? "Active" : "Locked"}</span></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
