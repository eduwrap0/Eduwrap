"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { confirmDestructive } from "@/lib/confirm-dialog";
import { MAX_TESTIMONIAL_VIDEO_BYTES, MAX_TESTIMONIAL_VIDEO_LABEL } from "@/lib/video-testimonial-limits";
import type { VideoTestimonialRecord } from "@/types/video-testimonial";

interface ApiResponse { message: string; data?: { testimonials?: VideoTestimonialRecord[]; testimonial?: VideoTestimonialRecord } }
const blank = { studentName: "", videoAltText: "", displayOrder: "0", isActive: false };

export function VideoTestimonialManager() {
  const [testimonials, setTestimonials] = useState<VideoTestimonialRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [form, setForm] = useState(blank); const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState<string | null>(null);
  const [playing, setPlaying] = useState<VideoTestimonialRecord | null>(null);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await fetch("/api/admin/video-testimonials", { cache: "no-store" }); const result = await response.json() as ApiResponse; if (!response.ok || !result.data?.testimonials) throw new Error(result.message); setTestimonials(result.data.testimonials); setSelected(new Set()); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load testimonials."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function chooseVideo(video: File | null) {
    if (preview) URL.revokeObjectURL(preview); setPreview(null); setFile(null);
    if (!video) return;
    if (!["video/mp4", "video/webm", "video/quicktime"].includes(video.type)) return toast.error("Only MP4, WebM, and MOV videos are allowed.");
    if (video.size > MAX_TESTIMONIAL_VIDEO_BYTES) { if (fileInput.current) fileInput.current.value = ""; return toast.error(`Video must be no larger than ${MAX_TESTIMONIAL_VIDEO_LABEL}.`); }
    setFile(video); setPreview(URL.createObjectURL(video));
  }

  async function upload(event: React.FormEvent) {
    event.preventDefault(); if (!file) return toast.error("Choose a video to upload."); setSaving(true);
    try {
      const data = new FormData(); data.set("video", file); data.set("details", JSON.stringify({ studentName: form.studentName, videoAltText: form.videoAltText, displayOrder: Number(form.displayOrder), isActive: form.isActive }));
      const response = await fetch("/api/admin/video-testimonials", { method: "POST", body: data }); const result = await response.json() as ApiResponse; if (!response.ok) throw new Error(result.message);
      toast.success(result.message); if (preview) URL.revokeObjectURL(preview); setPreview(null); setFile(null); setForm(blank); if (fileInput.current) fileInput.current.value = ""; await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to upload testimonial.", { duration: 7000 }); }
    finally { setSaving(false); }
  }

  async function update(item: VideoTestimonialRecord, changes: Partial<Pick<VideoTestimonialRecord, "studentName" | "videoAltText" | "displayOrder" | "isActive">>) {
    try { const response = await fetch(`/api/admin/video-testimonials/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) }); const result = await response.json() as ApiResponse; if (!response.ok || !result.data?.testimonial) throw new Error(result.message); setTestimonials((current) => current.map((entry) => entry.id === item.id ? result.data!.testimonial! : entry)); toast.success(result.message); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update testimonial."); await load(); }
  }

  async function bulk(isActive: boolean) {
    if (!selected.size) return toast.error("Select at least one testimonial."); setBusy(true);
    try { const response = await fetch("/api/admin/video-testimonials/bulk", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selected], isActive }) }); const result = await response.json() as ApiResponse; if (!response.ok) throw new Error(result.message); toast.success(result.message); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update selected testimonials."); }
    finally { setBusy(false); }
  }

  async function remove(item: VideoTestimonialRecord) {
    if (!await confirmDestructive("Delete video testimonial?", `The video for ${item.studentName} will be permanently deleted from Cloudinary.`, "Delete video")) return;
    try { const response = await fetch(`/api/admin/video-testimonials/${item.id}`, { method: "DELETE" }); const result = await response.json() as ApiResponse; if (!response.ok) throw new Error(result.message); toast.success(result.message); setTestimonials((current) => current.filter((entry) => entry.id !== item.id)); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete testimonial."); }
  }

  return <div className="video-admin-page">
    <section className="video-admin-hero"><div><span className="dashboard-kicker"><i className="fa fa-video-camera" /> Social proof</span><h1>Video testimonials</h1><p>Upload learner stories, optimize delivery, and control what appears publicly.</p></div><span><i className="fa fa-cloud-upload" /> Cloudinary optimized</span></section>
    <section className="app-card video-upload-card"><header><div><span className="dashboard-section-label">New testimonial</span><h2>Upload a learner video</h2><p>MP4, WebM, or MOV · maximum {MAX_TESTIMONIAL_VIDEO_LABEL}</p></div></header><form onSubmit={upload}><div className="video-upload-preview">{preview ? <><video src={preview} controls preload="metadata" aria-label="Selected testimonial preview" /><label className="video-change"><i className="fa fa-refresh" /> Change video<input ref={fileInput} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => chooseVideo(event.target.files?.[0] || null)} /></label></> : <label><i className="fa fa-film" /><strong>Choose video</strong><span>Preview before uploading</span><input ref={fileInput} type="file" required accept="video/mp4,video/webm,video/quicktime" onChange={(event) => chooseVideo(event.target.files?.[0] || null)} /></label>}</div><div className="video-upload-fields"><label><span>Student Name</span><input className="form-control" required minLength={2} maxLength={100} value={form.studentName} onChange={(event) => setForm({ ...form, studentName: event.target.value })} /></label><label><span>Video Alt Text</span><input className="form-control" required minLength={2} maxLength={180} placeholder="Describe the testimonial video" value={form.videoAltText} onChange={(event) => setForm({ ...form, videoAltText: event.target.value })} /></label><label><span>Display Order</span><input className="form-control" type="number" required min={0} max={10000} value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} /></label><label className="video-active-check"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /><span>Show on Website</span></label><button type="submit" disabled={saving}>{saving ? <><i className="fa fa-spinner fa-spin" /> Uploading…</> : <><i className="fa fa-cloud-upload" /> Upload testimonial</>}</button></div></form></section>
    <section className="app-card video-library"><header><div><span className="dashboard-section-label">Testimonial library</span><h2>All videos</h2><p>{testimonials.length} testimonial{testimonials.length === 1 ? "" : "s"} · {testimonials.filter((item) => item.isActive).length} public</p></div><div className="video-bulk"><label><input type="checkbox" checked={testimonials.length > 0 && selected.size === testimonials.length} onChange={(event) => setSelected(event.target.checked ? new Set(testimonials.map((item) => item.id)) : new Set())} /> Select all</label><button disabled={busy || !selected.size} onClick={() => void bulk(true)}><i className="fa fa-eye" /> Show on Website</button><button disabled={busy || !selected.size} onClick={() => void bulk(false)}><i className="fa fa-eye-slash" /> Hide from Website</button></div></header>
      {loading ? <div className="video-admin-loading"><i className="fa fa-spinner fa-spin" /> Loading testimonials…</div> : testimonials.length === 0 ? <div className="app-empty video-admin-empty"><i className="fa fa-video-camera" /><strong>No video testimonials yet</strong><span>Upload the first learner testimonial above.</span></div> : <div className="video-admin-grid">{testimonials.map((item) => <article key={item.id}><div className="video-admin-media"><video src={item.videoUrl} preload="metadata" muted playsInline aria-label={item.videoAltText} /><button type="button" onClick={() => setPlaying(item)} aria-label={`Preview testimonial from ${item.studentName}`}><i className="fa fa-play" /></button><label><input type="checkbox" checked={selected.has(item.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next; })} /></label><span className={item.isActive ? "active" : "inactive"}>{item.isActive ? "Public" : "Hidden"}</span></div><div className="video-admin-body"><label><span>Student Name</span><input className="form-control" defaultValue={item.studentName} maxLength={100} onBlur={(event) => { const studentName = event.target.value.trim(); if (studentName !== item.studentName) void update(item, { studentName }); }} /></label><label><span>Video Alt Text</span><input className="form-control" defaultValue={item.videoAltText} maxLength={180} onBlur={(event) => { const videoAltText = event.target.value.trim(); if (videoAltText !== item.videoAltText) void update(item, { videoAltText }); }} /></label><div className="video-admin-row"><label><span>Order</span><input className="form-control" type="number" min={0} max={10000} defaultValue={item.displayOrder} onBlur={(event) => { const displayOrder = Number(event.target.value); if (displayOrder !== item.displayOrder) void update(item, { displayOrder }); }} /></label><label className="video-active-check"><input type="checkbox" checked={item.isActive} onChange={(event) => void update(item, { isActive: event.target.checked })} /><span>Show on Website</span></label></div><footer><small>{new Date(item.uploadDate).toLocaleDateString("en-IN")}</small><button type="button" onClick={() => void remove(item)}><i className="fa fa-trash" /> Delete</button></footer></div></article>)}</div>}
    </section>
    {playing && <div className="video-preview-modal" role="dialog" aria-modal="true" aria-label={`Preview testimonial from ${playing.studentName}`} onClick={() => setPlaying(null)}><button type="button" aria-label="Close video preview" onClick={() => setPlaying(null)}><i className="fa fa-times" /></button><div onClick={(event) => event.stopPropagation()}><video src={playing.videoUrl} controls autoPlay playsInline preload="metadata" aria-label={playing.videoAltText} /><strong>{playing.studentName}</strong></div></div>}
  </div>;
}
