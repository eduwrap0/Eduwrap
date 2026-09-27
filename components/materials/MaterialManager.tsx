"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { ThemeSelect } from "@/components/ui/ThemeSelect";
import { confirmDestructive } from "@/lib/confirm-dialog";
import type { UserRole } from "@/types/auth";
import type { CourseMaterialRecord, MaterialCategory, MaterialSubcategoryRecord } from "@/types/materials";

interface ApiResponse { message: string; data?: { materials?: CourseMaterialRecord[]; subcategories?: MaterialSubcategoryRecord[] }; }
const emptyForm = { title: "", description: "", course: "", category: "notes" as MaterialCategory, subcategoryId: "" };
const MAX_MATERIAL_BYTES = 1024 * 1024;
const sizeLabel = (bytes: number) => bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

export function MaterialManager({ role, courses, materialsLocked = false }: { role: UserRole; courses: string[]; materialsLocked?: boolean }) {
  const canManage = role !== "student";
  const canManageSubcategories = role === "admin";
  const [materials, setMaterials] = useState<CourseMaterialRecord[]>([]);
  const [subcategories, setSubcategories] = useState<MaterialSubcategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [editing, setEditing] = useState<CourseMaterialRecord | null>(null);
  const [form, setForm] = useState({ ...emptyForm, course: courses[0] || "" });
  const [subcategoryForm, setSubcategoryForm] = useState({ id: "", courses: courses[0] ? [courses[0]] : [] as string[], name: "" });
  const [file, setFile] = useState<File | null>(null);
  const [filters, setFilters] = useState({ search: "", course: "", category: "", subcategory: "" });

  const load = useCallback(async () => {
    if (materialsLocked) { setMaterials([]); setSubcategories([]); setLoading(false); return; }
    setLoading(true);
    try {
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => { if (value.trim()) query.set(key, value.trim()); });
      const [materialResponse, subcategoryResponse] = await Promise.all([fetch(`/api/materials?${query}`, { cache: "no-store" }), fetch("/api/material-subcategories", { cache: "no-store" })]);
      const [materialResult, subcategoryResult] = await Promise.all([materialResponse.json() as Promise<ApiResponse>, subcategoryResponse.json() as Promise<ApiResponse>]);
      if (!materialResponse.ok || !materialResult.data?.materials) throw new Error(materialResult.message);
      if (!subcategoryResponse.ok || !subcategoryResult.data?.subcategories) throw new Error(subcategoryResult.message);
      setMaterials(materialResult.data.materials); setSubcategories(subcategoryResult.data.subcategories);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load materials."); }
    finally { setLoading(false); }
  }, [filters, materialsLocked]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer); }, [load]);
  const grouped = useMemo(() => {
    const groups = new Map<string, CourseMaterialRecord[]>();
    materials.forEach((item) => {
      const visibleCourses = (filters.course ? [filters.course] : item.courses).filter((course) => courses.includes(course));
      visibleCourses.forEach((course) => groups.set(course, [...(groups.get(course) || []), item]));
    });
    return [...groups.entries()];
  }, [courses, filters.course, materials]);
  const formSubcategories = useMemo(() => subcategories.filter((item) => item.courses.includes(form.course)), [form.course, subcategories]);

  function openCreate() {
    const course = courses[0] || "";
    setEditing(null); setForm({ ...emptyForm, course, subcategoryId: subcategories.find((item) => item.courses.includes(course))?.id || "" }); setFile(null); setShowForm(true);
  }
  function openEdit(item: CourseMaterialRecord) {
    setEditing(item); setForm({ title: item.title, description: item.description || "", course: item.course, category: item.category, subcategoryId: item.subcategoryId || "" }); setFile(null); setShowForm(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      if (file && file.size > MAX_MATERIAL_BYTES) throw new Error("The file must be no larger than 1 MB.");
      let response: Response;
      if (editing && !file) response = await fetch(`/api/materials/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      else {
        if (!editing && !file) throw new Error("Choose a PDF or image.");
        const body = new FormData(); Object.entries(form).forEach(([key, value]) => body.set(key, value)); if (file) body.set("file", file);
        response = await fetch(editing ? `/api/materials/${editing.id}` : "/api/materials", { method: editing ? "PATCH" : "POST", body });
      }
      const result = await response.json() as ApiResponse; if (!response.ok) throw new Error(result.message);
      toast.success(result.message); setShowForm(false); setEditing(null); setFile(null); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save material."); }
    finally { setSaving(false); }
  }

  async function remove(item: CourseMaterialRecord) {
    const resourceLabel = item.category === "assignment" ? "assignment" : "notes";
    const confirmed = await confirmDestructive(
      `Delete ${resourceLabel}?`,
      `"${item.title}" and its uploaded file will be permanently removed from Cloudinary.`,
      `Delete ${resourceLabel}`,
    );
    if (!confirmed) return;
    try { const response = await fetch(`/api/materials/${item.id}`, { method: "DELETE" }); const result = await response.json() as ApiResponse; if (!response.ok) throw new Error(result.message); toast.success(result.message); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete material."); }
  }

  async function saveSubcategory(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      if (!subcategoryForm.courses.length) throw new Error("Select at least one course.");
      const response = await fetch(subcategoryForm.id ? `/api/material-subcategories/${subcategoryForm.id}` : "/api/material-subcategories", { method: subcategoryForm.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courses: subcategoryForm.courses, name: subcategoryForm.name }) });
      const result = await response.json() as ApiResponse; if (!response.ok) throw new Error(result.message);
      toast.success(result.message); setSubcategoryForm({ id: "", courses: courses[0] ? [courses[0]] : [], name: "" }); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save subcategory."); }
    finally { setSaving(false); }
  }

  async function removeSubcategory(item: MaterialSubcategoryRecord) {
    const confirmed = await confirmDestructive(
      "Delete subcategory?",
      `"${item.name}" will be removed from ${item.courses.join(", ")}. Subcategories containing materials cannot be deleted.`,
      "Delete subcategory",
    );
    if (!confirmed) return;
    try { const response = await fetch(`/api/material-subcategories/${item.id}`, { method: "DELETE" }); const result = await response.json() as ApiResponse; if (!response.ok) throw new Error(result.message); toast.success(result.message); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete subcategory."); }
  }

  const courseOptions = courses.map((item) => ({ value: item, label: item }));
  const resourceOptions = [{ value: "", label: "Notes & assignments" }, { value: "notes", label: "Notes" }, { value: "assignment", label: "Assignments" }];
  if (materialsLocked) return <div className="material-page">
    <section className="material-hero">
      <div><span className="dashboard-kicker"><i className="fa fa-folder-open" /> Learning library</span><h1>Course materials</h1><p>Your notes and assignments will become available after an administrator marks your course as completed.</p></div>
    </section>
    <section className="app-card material-locked" aria-labelledby="materials-locked-title">
      <span><i className="fa fa-lock" /></span>
      <div><h2 id="materials-locked-title">Materials are locked</h2><p>Complete your course first. Once an administrator updates your course status to Completed, you can view and download all course materials here.</p></div>
    </section>
  </div>;
  return <div className="material-page">
    <section className="material-hero">
      <div><span className="dashboard-kicker"><i className="fa fa-folder-open" /> Learning library</span><h1>Course materials</h1><p>{canManageSubcategories ? "Create shared subcategories, then organize notes and assignments inside them." : canManage ? "Upload notes and assignments into subcategories created by an administrator." : "View and download notes and assignments for your completed course."}</p></div>
      {canManage && <div className="material-hero-actions">{canManageSubcategories && <button type="button" onClick={() => setShowSubcategories(true)} disabled={!courses.length}><i className="fa fa-tags" /> Manage subcategories</button>}<button type="button" onClick={openCreate} disabled={!courses.length || !subcategories.length}><i className="fa fa-cloud-upload" /> Upload material</button></div>}
    </section>
    {canManage && !courses.length && <div className="material-notice"><i className="fa fa-info-circle" /> Ask an administrator to assign courses to your faculty account before uploading.</div>}
    {canManage && courses.length > 0 && !subcategories.length && <div className="material-notice"><i className="fa fa-info-circle" /> {canManageSubcategories ? "Create your first course subcategory before uploading a material." : "Ask an administrator to create a subcategory for one of your assigned courses."}</div>}
    <section className="app-card material-toolbar">
      <label><span>Search</span><div><i className="fa fa-search" /><input className="form-control" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Title, description, or filename" /></div></label>
      <label><span>Course</span><ThemeSelect ariaLabel="Filter by course" searchable value={filters.course} placeholder="All courses" options={[{ value: "", label: "All courses" }, ...courseOptions]} onChange={(course) => setFilters({ ...filters, course, subcategory: "" })} /></label>
      <label><span>Subcategory</span><ThemeSelect ariaLabel="Filter by subcategory" value={filters.subcategory} placeholder="All subcategories" options={[{ value: "", label: "All subcategories" }, ...subcategories.filter((item) => !filters.course || item.courses.includes(filters.course)).map((item) => ({ value: item.id, label: item.name }))]} onChange={(subcategory) => setFilters({ ...filters, subcategory })} /></label>
      <label><span>Resource type</span><ThemeSelect ariaLabel="Filter by resource type" value={filters.category} options={resourceOptions} onChange={(category) => setFilters({ ...filters, category })} /></label>
    </section>

    {showSubcategories && <div className="app-modal-backdrop" role="presentation"><section className="app-modal material-modal" role="dialog" aria-modal="true" aria-labelledby="subcategory-title"><header><div><span className="app-modal-icon"><i className="fa fa-tags" /></span><div><h2 id="subcategory-title">Shared subcategories</h2><p>Create a subcategory once and assign it to multiple courses.</p></div></div><button className="material-modal-close" type="button" aria-label="Close subcategory manager" title="Close" onClick={() => setShowSubcategories(false)}><i className="fa fa-times" /></button></header><form className="subcategory-form shared-subcategory-form" onSubmit={saveSubcategory}><label><span>Subcategory name</span><input className="form-control" required maxLength={60} placeholder="Example: Excel" value={subcategoryForm.name} onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })} /></label><fieldset><legend>Courses <small>(select one or more)</small></legend><div className="modal-check-grid material-course-check-grid">{courses.map((course) => <label className="modal-check-card" key={course}><input type="checkbox" checked={subcategoryForm.courses.includes(course)} onChange={(event) => setSubcategoryForm({ ...subcategoryForm, courses: event.target.checked ? [...subcategoryForm.courses, course] : subcategoryForm.courses.filter((item) => item !== course) })} /><span aria-hidden="true" /><strong>{course}</strong></label>)}</div></fieldset><div className="subcategory-form-actions"><button className="primary" disabled={saving}><i className={`fa fa-${subcategoryForm.id ? "check" : "plus"}`} /> {subcategoryForm.id ? "Save changes" : "Add subcategory"}</button>{subcategoryForm.id && <button type="button" onClick={() => setSubcategoryForm({ id: "", courses: courses[0] ? [courses[0]] : [], name: "" })}>Cancel</button>}</div></form><div className="subcategory-list">{subcategories.length === 0 ? <p>No subcategories created yet.</p> : subcategories.map((item) => <div key={item.id}><span><i className="fa fa-folder-o" /> <strong>{item.name}</strong><small>{item.courses.join(", ")}</small></span><div><button type="button" aria-label={`Edit ${item.name}`} onClick={() => setSubcategoryForm({ id: item.id, courses: item.courses, name: item.name })}><i className="fa fa-pencil" /></button><button type="button" aria-label={`Delete ${item.name}`} onClick={() => void removeSubcategory(item)}><i className="fa fa-trash" /></button></div></div>)}</div></section></div>}

    {showForm && <div className="app-modal-backdrop" role="presentation"><section className="app-modal material-modal" role="dialog" aria-modal="true" aria-labelledby="material-form-title"><header><div><span className="app-modal-icon"><i className={`fa fa-${editing ? "pencil" : "cloud-upload"}`} /></span><div><h2 id="material-form-title">{editing ? "Edit material" : "Upload course material"}</h2><p>Upload once; shared subcategories publish it to all assigned courses.</p></div></div><button className="material-modal-close" type="button" aria-label="Close material form" title="Close" onClick={() => setShowForm(false)}><i className="fa fa-times" /></button></header><form onSubmit={submit}><div className="material-form-grid"><label><span>Title</span><input className="form-control" required minLength={2} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label><span>Course</span><ThemeSelect ariaLabel="Material course" searchable value={form.course} options={courseOptions} onChange={(course) => setForm({ ...form, course, subcategoryId: subcategories.find((item) => item.courses.includes(course))?.id || "" })} /></label><label><span>Subcategory</span><ThemeSelect ariaLabel="Material subcategory" value={form.subcategoryId} placeholder="Choose subcategory" options={formSubcategories.map((item) => ({ value: item.id, label: `${item.name} (${item.courses.length} course${item.courses.length === 1 ? "" : "s"})` }))} onChange={(subcategoryId) => setForm({ ...form, subcategoryId })} /></label><label><span>Resource type</span><ThemeSelect ariaLabel="Material resource type" value={form.category} options={[{ value: "notes", label: "Notes" }, { value: "assignment", label: "Assignment" }]} onChange={(category) => setForm({ ...form, category: category as MaterialCategory })} /></label><label><span>{editing ? "Replace file " : "File"}{editing && <small>(optional)</small>}</span><input className="form-control" type="file" required={!editing} accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} />{editing && <small className="material-current-file"><i className="fa fa-paperclip" /> Current: {editing.originalName}</small>}</label><label className="material-description"><span>Description <small>(optional)</small></span><textarea className="form-control" rows={3} maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label></div><footer><button type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary" disabled={saving}>{saving ? <><i className="fa fa-spinner fa-spin" /> Saving...</> : <><i className="fa fa-check" /> {editing ? "Save changes" : "Upload once"}</>}</button></footer></form></section></div>}

    {loading ? <div className="material-loading"><span /><span /><span /></div> : grouped.length === 0 ? <section className="app-card app-empty material-empty"><span className="dashboard-empty-icon"><i className="fa fa-folder-open-o" /></span><strong>No materials found</strong><span>{canManage ? "Create a subcategory and upload the first resource." : "Your faculty has not uploaded resources for these courses yet."}</span></section> : <div className="material-groups">{grouped.map(([courseName, items]) => <section key={courseName} className="app-card material-group"><header><div><span><i className="fa fa-book" /></span><div><h2>{courseName}</h2><p>{items?.length || 0} resource{items?.length === 1 ? "" : "s"}</p></div></div></header><div className="material-grid">{items?.map((item) => <article key={item.id}><div className={`material-file-icon is-${item.fileType}`}><i className={`fa fa-${item.fileType === "pdf" ? "file-pdf-o" : "file-image-o"}`} /></div><div className="material-card-copy"><div><span className={`material-category is-${item.category}`}>{item.category}</span><span className="material-subcategory">{item.subcategoryName || "Uncategorized"}</span><small>{sizeLabel(item.bytes)}</small></div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}<span className="material-filename"><i className="fa fa-paperclip" /> {item.originalName}</span><small>Uploaded by {item.uploaderName} - {new Date(item.createdAt).toLocaleDateString("en-IN")}</small></div><div className="material-actions"><a href={`/api/materials/${item.id}/download`}><i className="fa fa-download" /> Download</a>{canManage && <><button type="button" onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`}><i className="fa fa-pencil" /></button><button type="button" onClick={() => void remove(item)} aria-label={`Delete ${item.title}`}><i className="fa fa-trash" /></button></>}</div></article>)}</div></section>)}</div>}
  </div>;
}
