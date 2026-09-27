"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { EditFacultyModal } from "@/components/admin/EditFacultyModal";
import { confirmDestructive } from "@/lib/confirm-dialog";
import type { SafeUser } from "@/types/auth";

interface Result { message: string; data?: { faculty: SafeUser }; errors?: Record<string, string[]> }

export function FacultyManager({ initialFaculty, showCreatedMessage = false }: { initialFaculty: SafeUser[]; showCreatedMessage?: boolean }) {
  const [faculty, setFaculty] = useState(initialFaculty);
  const [editing, setEditing] = useState<SafeUser | null>(null);

  useEffect(() => { if (showCreatedMessage) toast.success("Faculty registered successfully."); }, [showCreatedMessage]);

  async function action(url: string, method: "PATCH" | "DELETE", body?: object) {
    const response = await fetch(url, { method, ...(body ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}) });
    const result = (await response.json()) as Result;
    if (!response.ok) throw new Error(result.message);
    return result;
  }

  async function toggleStatus(item: SafeUser) {
    try {
      const result = await action(`/api/admin/faculty/${item.id}/status`, "PATCH", { isActive: !item.isActive });
      if (result.data) setFaculty((items) => items.map((current) => current.id === item.id ? result.data!.faculty : current));
      toast.success(result.message);
    } catch (caught) { toast.error(caught instanceof Error ? caught.message : "Unable to change faculty status."); }
  }

  async function remove(item: SafeUser) {
    if (!await confirmDestructive(`Delete ${item.name}?`, "Their student assignments will be removed. This action cannot be undone.")) return;
    try {
      const result = await action(`/api/admin/faculty/${item.id}`, "DELETE");
      setFaculty((items) => items.filter((current) => current.id !== item.id));
      toast.success(result.message);
    } catch (caught) { toast.error(caught instanceof Error ? caught.message : "Unable to delete faculty."); }
  }

  return <>
    {editing && <EditFacultyModal faculty={editing} onClose={() => setEditing(null)} onSaved={(updated, successMessage) => { setFaculty((items) => items.map((item) => item.id === updated.id ? updated : item)); setEditing(null); toast.success(successMessage); }} />}
    <section className="faculty-manager-results">
      <div className="student-manager-summary"><div><span className="student-manager-summary-icon"><i className="fa fa-user-md" /></span><div><small>Faculty records</small><strong>{faculty.length}</strong></div></div><p>Manage faculty account access and teaching information.</p></div>
      {faculty.length === 0 ? <div className="app-card app-empty student-manager-empty"><i className="fa fa-user-md" /><strong>No faculty accounts yet</strong><span>Register a faculty member to see them here.</span></div> : <div className="student-professional-list">{faculty.map((item) => {
        const courses = item.courses?.length ? item.courses : item.course ? [item.course] : [];
        const information = [
          { icon: "phone", label: "Phone number", value: item.phone || "Not provided" },
          { icon: "graduation-cap", label: "Qualification", value: item.qualification || "Not provided" },
          { icon: "book", label: "Primary course", value: courses[0] || "Not assigned" },
          { icon: "map-marker", label: "Location", value: [item.district, item.state].filter(Boolean).join(", ") || "Not provided" },
        ];
        return <article className="student-professional-row faculty-professional-row" key={item.id}>
          <Link href={`/admin/faculty/${item.id}`} className="student-professional-row-link" aria-label={`View ${item.name}'s profile`} />
          <div className="student-professional-person"><span className={`student-professional-avatar ${item.profileImageUrl ? "has-profile-image" : ""}`} style={item.profileImageUrl ? { backgroundImage: `url(${item.profileImageUrl})` } : undefined}>{!item.profileImageUrl && item.name.charAt(0).toUpperCase()}</span><div><h2>{item.name}</h2><small>{item.email}</small></div></div>
          <div className="student-professional-info">{information.map((detail) => <div className="student-professional-data" key={detail.label}><span><i className={`fa fa-${detail.icon}`} /></span><div><small>{detail.label}</small><strong>{detail.value}</strong></div></div>)}</div>
          <div className="student-professional-actions"><Link href={`/admin/faculty/${item.id}`} title="Open profile"><i className="fa fa-eye" /> View profile</Link><button type="button" title="Edit faculty" onClick={() => setEditing(item)}><i className="fa fa-pencil" /> Edit</button><button type="button" title={item.isActive ? "Lock account" : "Unlock account"} onClick={() => void toggleStatus(item)}><i className={`fa fa-${item.isActive ? "lock" : "unlock"}`} /> {item.isActive ? "Lock" : "Unlock"}</button><button type="button" className="is-danger" title="Delete faculty" onClick={() => void remove(item)}><i className="fa fa-trash" /> Delete</button></div>
        </article>;
      })}</div>}
    </section>
  </>;
}
