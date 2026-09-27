"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { EditFacultyModal } from "@/components/admin/EditFacultyModal";
import { ResetPasswordDialog } from "@/components/admin/ResetPasswordDialog";
import type { SafeUser } from "@/types/auth";

function profileDate(value?: string) {
  return value ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }) : "Not provided";
}

function ProfileDetail({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return <div className="student-profile-detail"><span><i className={`fa fa-${icon}`} /></span><div><small>{label}</small><strong>{value?.trim() || "Not provided"}</strong></div></div>;
}

export function FacultyProfile({ faculty, aadhaarNo }: { faculty: SafeUser; aadhaarNo?: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const courses = faculty.courses?.length ? faculty.courses : faculty.course ? [faculty.course] : [];

  async function toggleStatus() {
    setStatusLoading(true);
    try {
      const response = await fetch(`/api/admin/faculty/${faculty.id}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isActive: !faculty.isActive }) });
      const result = await response.json() as { message: string };
      if (!response.ok) throw new Error(result.message);
      toast.success(result.message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update faculty status.");
    } finally {
      setStatusLoading(false);
    }
  }

  return <>
    {editing && <EditFacultyModal faculty={faculty} onClose={() => setEditing(false)} onSaved={(_, message) => { setEditing(false); toast.success(message); router.refresh(); }} />}
    {resetting && <ResetPasswordDialog name={faculty.name} endpoint={`/api/admin/faculty/${faculty.id}/reset-password`} onClose={() => setResetting(false)} />}
    <div className="student-profile-page">
    <section className="student-profile-hero faculty-profile-hero">
      <div className="student-profile-identity"><span className={`student-profile-avatar ${faculty.profileImageUrl ? "has-profile-image" : ""}`} style={faculty.profileImageUrl ? { backgroundImage: `url(${faculty.profileImageUrl})` } : undefined}>{!faculty.profileImageUrl && <i className="fa fa-user-md" />}</span><div><span className="student-profile-kicker">Faculty profile</span><h1>{faculty.name}</h1><p>{faculty.email}</p><div className="student-profile-tags"><span className={`student-profile-status ${faculty.isActive ? "is-active" : "is-locked"}`}><i />{faculty.isActive ? "Active account" : "Locked account"}</span></div></div></div>
      <div className="student-profile-hero-meta"><small>Faculty since</small><strong>{new Date(faculty.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong><span>Last updated {new Date(faculty.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
    </section>

    <section className="student-profile-action-bar" aria-label="Faculty profile actions"><div><span>Profile actions</span><small>Manage this faculty account</small></div><div><button type="button" onClick={() => setEditing(true)}><i className="fa fa-pencil" /> Edit profile</button><button type="button" disabled={statusLoading} onClick={() => void toggleStatus()}><i className={`fa fa-${faculty.isActive ? "lock" : "unlock"}`} /> {faculty.isActive ? "Lock account" : "Unlock account"}</button><button type="button" onClick={() => setResetting(true)}><i className="fa fa-key" /> Reset password</button></div></section>

    <div className="student-profile-layout">
      <div className="student-profile-main">
        <section className="student-profile-panel"><header><span><i className="fa fa-address-card" /></span><div><h2>Profile information</h2><p>Identity, contact, and professional details.</p></div></header><div className="student-profile-detail-grid">
          <ProfileDetail icon="phone" label="Phone number" value={faculty.phone} />
          <ProfileDetail icon="id-card" label="Aadhaar number" value={aadhaarNo} />
          <ProfileDetail icon="birthday-cake" label="Date of birth" value={profileDate(faculty.dateOfBirth)} />
          <ProfileDetail icon="graduation-cap" label="Qualification" value={faculty.qualification} />
          <ProfileDetail icon="venus-mars" label="Gender" value={faculty.gender?.replaceAll("_", " ")} />
          <ProfileDetail icon="heart" label="Marital status" value={faculty.maritalStatus} />
          <ProfileDetail icon="tint" label="Blood group" value={faculty.bloodGroup} />
          <ProfileDetail icon="flag" label="Nationality" value={faculty.nationality} />
          <ProfileDetail icon="map-marker" label="State and district" value={[faculty.district, faculty.state].filter(Boolean).join(", ")} />
        </div><div className="student-profile-address"><small>Residential address</small><p>{faculty.address || "Not provided"}</p></div></section>

        <section className="student-profile-panel"><header><span><i className="fa fa-shield" /></span><div><h2>Account information</h2><p>Access status and account activity.</p></div></header><div className="student-profile-detail-grid">
          <ProfileDetail icon="check-circle" label="Account status" value={faculty.isActive ? "Active" : "Locked"} />
          <ProfileDetail icon="calendar" label="Registered" value={new Date(faculty.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} />
          <ProfileDetail icon="refresh" label="Last updated" value={new Date(faculty.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} />
          <ProfileDetail icon="sign-in" label="Last sign-in" value={faculty.lastLoginAt ? new Date(faculty.lastLoginAt).toLocaleString("en-IN") : "No sign-in recorded"} />
        </div></section>
      </div>

      <aside className="student-profile-side"><section className="student-profile-panel student-profile-side-panel"><header><span><i className="fa fa-book" /></span><div><h2>Teaching courses</h2><p>Assigned areas of instruction.</p></div></header>{courses.length ? <div className="student-profile-course-list">{courses.map((course) => <span key={course}><i className="fa fa-check" />{course}</span>)}</div> : <div className="student-profile-unassigned">No courses assigned</div>}</section></aside>
    </div>
    </div>
  </>;
}
