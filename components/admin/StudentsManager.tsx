"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { EditStudentModal } from "@/components/admin/EditStudentModal";
import { ResetPasswordDialog } from "@/components/admin/ResetPasswordDialog";
import { ThemedDateField, ThemedSelect } from "@/components/admin/EnrollmentFields";
import { confirmDestructive } from "@/lib/confirm-dialog";
import { formatBatchTime } from "@/lib/format-batch-time";
import type { SafeUser } from "@/types/auth";

interface ListResult {
  success: boolean;
  message: string;
  data?: { students: SafeUser[]; pagination: { page: number; limit: number; totalStudents: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } };
}

interface ActionResult { success: boolean; message: string; errors?: Record<string, string[]> }

const BATCH_FILTER_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const label = formatBatchTime(value);
  return { value, label };
});

function listQueryString(page: number, values: { search: string; status: string; courseStatus: string; admissionFrom: string; admissionTo: string; batch: string; facultyId: string }) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (values.search) params.set("search", values.search);
  if (values.status !== "all") params.set("status", values.status);
  if (values.courseStatus !== "all") params.set("courseStatus", values.courseStatus);
  if (values.admissionFrom) params.set("admissionFrom", values.admissionFrom);
  if (values.admissionTo) params.set("admissionTo", values.admissionTo);
  if (values.batch) params.set("batch", values.batch);
  if (values.facultyId) params.set("facultyId", values.facultyId);
  return params.toString();
}

export function StudentsManager({ showCreatedMessage, adminMode = false, faculties = [] }: { showCreatedMessage: boolean; adminMode?: boolean; faculties?: Array<{ id: string; name: string }> }) {
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const requestedPage = Number(urlSearchParams.get("page"));
  const initialPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const initialStatus = urlSearchParams.get("status");
  const initialCourseStatus = urlSearchParams.get("courseStatus");
  const [students, setStudents] = useState<SafeUser[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalStudents: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
  const [searchInput, setSearchInput] = useState(() => urlSearchParams.get("search") || "");
  const [search, setSearch] = useState(() => urlSearchParams.get("search") || "");
  const [status, setStatus] = useState(() => initialStatus === "active" || initialStatus === "inactive" ? initialStatus : "all");
  const [courseStatus, setCourseStatus] = useState(() => initialCourseStatus === "ongoing" || initialCourseStatus === "completed" ? initialCourseStatus : "all");
  const [admissionFrom, setAdmissionFrom] = useState(() => urlSearchParams.get("admissionFrom") || "");
  const [admissionTo, setAdmissionTo] = useState(() => urlSearchParams.get("admissionTo") || "");
  const [batch, setBatch] = useState(() => urlSearchParams.get("batch") || "");
  const [facultyId, setFacultyId] = useState(() => urlSearchParams.get("facultyId") || "");
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState<SafeUser | null>(null);
  const [editTarget, setEditTarget] = useState<SafeUser | null>(null);
  const requestIdRef = useRef(0);
  const initialPageRef = useRef(initialPage);
  const firstLoadRef = useRef(true);

  const load = useCallback(async (page = 1) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", search, status, courseStatus, admissionFrom, admissionTo, batch, facultyId });
      const response = await fetch(`/api/admin/students?${params}`, { cache: "no-store" });
      const result = (await response.json()) as ListResult;
      if (!response.ok || !result.data) throw new Error(result.message);
      if (requestId !== requestIdRef.current) return;
      setStudents(result.data.students);
      setPagination(result.data.pagination);
      const query = listQueryString(page, { search, status, courseStatus, admissionFrom, admissionTo, batch, facultyId });
      window.history.replaceState(window.history.state, "", query ? `${pathname}?${query}` : pathname);
    } catch (caught) {
      if (requestId !== requestIdRef.current) return;
      toast.error(caught instanceof Error ? caught.message : "Unable to load students.", { id: "student-load-error" });
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [search, status, courseStatus, admissionFrom, admissionTo, batch, facultyId, pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 450);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const page = firstLoadRef.current ? initialPageRef.current : 1;
    firstLoadRef.current = false;
    const timer = window.setTimeout(() => void load(page), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => { if (showCreatedMessage) toast.success("Student registered successfully.", { id: "student-created" }); }, [showCreatedMessage]);

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setCourseStatus("all");
    setAdmissionFrom("");
    setAdmissionTo("");
    setBatch("");
    setFacultyId("");
  }

  async function action(url: string, method: "PATCH" | "DELETE", body?: object) {
    const response = await fetch(url, {
      method,
      ...(body ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}),
    });
    const result = (await response.json()) as ActionResult;
    if (!response.ok) throw new Error(result.message);
    toast.success(result.message);
    await load(pagination.page);
  }

  async function toggleStatus(student: SafeUser) {
    try { await action(`/api/admin/students/${student.id}/status`, "PATCH", { isActive: !student.isActive }); }
    catch (caught) { toast.error(caught instanceof Error ? caught.message : "Unable to update status."); }
  }

  async function remove(student: SafeUser) {
    if (!await confirmDestructive(`Delete ${student.name}?`, "This action cannot be undone.")) return;
    try { await action(`/api/admin/students/${student.id}`, "DELETE"); }
    catch (caught) { toast.error(caught instanceof Error ? caught.message : "Unable to delete student."); }
  }

  const exportQuery = listQueryString(1, { search, status, courseStatus, admissionFrom, admissionTo, batch, facultyId });

  return (
    <>
      {editTarget && <EditStudentModal student={editTarget} faculties={faculties} onClose={() => setEditTarget(null)} onSaved={(updated, successMessage) => { setStudents((items) => items.map((item) => item.id === updated.id ? updated : item)); setEditTarget(null); toast.success(successMessage); }} />}
      <div className="app-card mb-4 student-manager-toolbar">
        <div>
          <div className="student-manager-toolbar-head"><div className="student-manager-search"><label htmlFor="student-search" className="form-label">Search all students</label><div><i className="fa fa-search" /><input id="student-search" className="form-control" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Name, student ID, phone, city, course, or father's name" /></div></div><div className="student-manager-toolbar-actions"><button type="button" className="student-clear-button" onClick={clearFilters}><i className="fa fa-times" /> Clear filters</button>{adminMode && <a className="student-export-button" href={`/api/admin/students/export${exportQuery ? `?${exportQuery}` : ""}`}><i className="fa fa-file-excel-o" /> Export filtered Excel</a>}</div></div>
          <div className="student-manager-filter-grid">
            <div><label htmlFor="admission-from" className="form-label">Admission from</label><ThemedDateField id="admission-from" ariaLabel="Admission from date" value={admissionFrom} onChange={setAdmissionFrom} max={admissionTo || new Date().toISOString().slice(0, 10)} /></div>
            <div><label htmlFor="admission-to" className="form-label">Admission to</label><ThemedDateField id="admission-to" ariaLabel="Admission to date" value={admissionTo} onChange={setAdmissionTo} max={new Date().toISOString().slice(0, 10)} /></div>
            <div><label htmlFor="batch-filter" className="form-label">Batch timing</label><ThemedSelect id="batch-filter" ariaLabel="Batch timing" value={batch} onChange={setBatch} placeholder="All batches" options={BATCH_FILTER_OPTIONS} searchable searchPlaceholder="Search batch time..." /></div>
            {adminMode && <div><label htmlFor="faculty-filter" className="form-label">Faculty</label><ThemedSelect id="faculty-filter" ariaLabel="Faculty" value={facultyId} onChange={setFacultyId} placeholder="All faculty" options={faculties.map((faculty) => ({ value: faculty.id, label: faculty.name }))} searchable searchPlaceholder="Search faculty..." /></div>}
            <div><label htmlFor="status-filter" className="form-label">Account status</label><ThemedSelect id="status-filter" ariaLabel="Account status" value={status} onChange={setStatus} options={[{ value: "all", label: "All statuses" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} /></div>
            <div><label htmlFor="course-status-filter" className="form-label">Course status</label><ThemedSelect id="course-status-filter" ariaLabel="Course status" value={courseStatus} onChange={setCourseStatus} options={[{ value: "all", label: "All course statuses" }, { value: "ongoing", label: "Ongoing" }, { value: "completed", label: "Completed" }]} /></div>
          </div>
        </div>
      </div>
      <section className="student-manager-results">
        <div className="student-manager-summary"><div><span className="student-manager-summary-icon"><i className="fa fa-users" /></span><div><small>Matching students</small><strong>{pagination.totalStudents}</strong></div></div><p>Showing newest admissions first. Click a student to open the complete profile.</p></div>
        {loading ? <div className="student-professional-list" aria-label="Loading students">{Array.from({ length: 4 }, (_, index) => <div className="student-professional-row is-loading" key={index}><span /><span /><span /></div>)}</div> : students.length === 0 ? <div className="app-card app-empty student-manager-empty"><i className="fa fa-users" aria-hidden="true" /><strong>No students found</strong><span>Try changing your search or register a student.</span></div> : <div className="student-professional-list">
          {students.map((student) => {
          const courses = student.courses?.length ? student.courses : student.course ? [student.course] : [];
          const returnQuery = listQueryString(pagination.page, { search, status, courseStatus, admissionFrom, admissionTo, batch, facultyId });
          const profileHref = `/${adminMode ? "admin" : "faculty"}/students/${student.id}${returnQuery ? `?return=${encodeURIComponent(returnQuery)}` : ""}`;
          const information = [
            { icon: "phone", label: "Phone number", value: student.phone || "Not provided" },
            { icon: "book", label: "Course", value: courses[0] || "Not assigned" },
            { icon: "clock-o", label: "Batch timing", value: formatBatchTime(student.batchTiming) },
            { icon: "calendar-o", label: "Course duration", value: student.courseDuration || "Not assigned" },
          ];
          return <article className="student-professional-row" key={student.id}>
            <Link href={profileHref} className="student-professional-row-link" aria-label={`View ${student.name}'s profile`} />
            <div className="student-professional-person"><span className={`student-professional-avatar ${student.profileImageUrl ? "has-profile-image" : ""}`} style={student.profileImageUrl ? { backgroundImage: `url(${student.profileImageUrl})` } : undefined}>{!student.profileImageUrl && student.name.charAt(0).toUpperCase()}</span><div><h2>{student.name}</h2><code>{student.studentId || "ID pending"}</code></div></div>
            <div className="student-professional-info">{information.map((item) => <div className="student-professional-data" key={item.label}><span><i className={`fa fa-${item.icon}`} /></span><div><small>{item.label}</small><strong>{item.value}</strong></div></div>)}</div>
            <div className="student-professional-actions"><div className="student-professional-statuses" aria-label="Student statuses"><span className={`student-list-status course ${student.courseStatus === "completed" ? "is-completed" : "is-ongoing"}`}><i />Course {student.courseStatus === "completed" ? "completed" : "ongoing"}</span><span className={`student-list-status account ${student.isActive ? "is-active" : "is-locked"}`}><i />Account {student.isActive ? "active" : "locked"}</span></div><Link href={profileHref} title="Open profile" aria-label={`Open ${student.name}'s profile`}><i className="fa fa-eye" /> View profile</Link>{adminMode && <><a href={`/api/admin/students/${student.id}/admission-form`} title="Download admission form" aria-label={`Download ${student.name}'s admission form`}><i className="fa fa-file-pdf-o" /> Admission form</a><button type="button" title="Edit student" aria-label={`Edit ${student.name}`} onClick={() => setEditTarget(student)}><i className="fa fa-pencil" /> Edit</button><button type="button" title={student.isActive ? "Lock account" : "Unlock account"} aria-label={`${student.isActive ? "Lock" : "Unlock"} ${student.name}`} onClick={() => void toggleStatus(student)}><i className={`fa fa-${student.isActive ? "lock" : "unlock"}`} /> {student.isActive ? "Lock" : "Unlock"}</button></>}<button type="button" title="Reset password" aria-label={`Reset ${student.name}'s password`} onClick={() => setResetTarget(student)}><i className="fa fa-key" /> Reset password</button>{adminMode && <button type="button" className="is-danger" title="Delete student" aria-label={`Delete ${student.name}`} onClick={() => void remove(student)}><i className="fa fa-trash" /> Delete</button>}</div>
          </article>;
        })}</div>}
        <div className="app-card app-pagination student-manager-pagination"><span>{pagination.totalStudents ? `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.totalStudents)} of ${pagination.totalStudents} students` : "Showing 0 students"}</span><div><button type="button" className="btn btn-sm btn-outline-secondary" disabled={!pagination.hasPreviousPage || loading} onClick={() => void load(pagination.page - 1)}><i className="fa fa-chevron-left" /> Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button type="button" className="btn btn-sm btn-outline-secondary" disabled={!pagination.hasNextPage || loading} onClick={() => void load(pagination.page + 1)}>Next <i className="fa fa-chevron-right" /></button></div></div>
      </section>
      {resetTarget && <ResetPasswordDialog name={resetTarget.name} endpoint={`/api/admin/students/${resetTarget.id}/reset-password`} onClose={() => setResetTarget(null)} />}
    </>
  );
}
