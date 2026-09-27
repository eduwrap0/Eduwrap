"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { confirmDestructive } from "@/lib/confirm-dialog";
import type { GalleryImageRecord } from "@/types/gallery";

interface PendingImage { key: string; file: File; preview: string; altTag: string; isPublic: boolean; error: string; }
interface ApiResponse { message: string; data?: { images?: GalleryImageRecord[]; image?: GalleryImageRecord } }

export function GalleryManager() {
  const [images, setImages] = useState<GalleryImageRecord[]>([]);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true); const [uploading, setUploading] = useState(false); const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<PendingImage[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await fetch("/api/admin/gallery", { cache: "no-store" }); const result = await response.json() as ApiResponse; if (!response.ok || !result.data?.images) throw new Error(result.message); setImages(result.data.images); setSelected(new Set()); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load gallery."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { pendingRef.current = pending; }, [pending]);
  useEffect(() => () => pendingRef.current.forEach((item) => URL.revokeObjectURL(item.preview)), []);

  async function chooseFiles(files: FileList | null) {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 20);
    const additions = await Promise.all(picked.map(async (file, index): Promise<PendingImage> => {
      let error = "";
      if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) error = "Only JPG, PNG, and WebP images are allowed.";
      else if (file.size > 25 * 1024 * 1024) error = "Source image must be no larger than 25 MB before compression.";
      return { key: `${file.name}-${file.lastModified}-${index}-${crypto.randomUUID()}`, file, preview: URL.createObjectURL(file), altTag: "", isPublic: false, error };
    }));
    setPending((current) => [...current, ...additions].slice(0, 20));
    if (input.current) input.current.value = "";
  }

  function removePending(key: string) { setPending((current) => { const target = current.find((item) => item.key === key); if (target) URL.revokeObjectURL(target.preview); return current.filter((item) => item.key !== key); }); }

  async function upload() {
    const invalid = pending.find((item) => item.error || item.altTag.trim().length < 2);
    if (!pending.length) return toast.error("Choose at least one image.");
    if (invalid) return toast.error(invalid.error ? `${invalid.file.name}: ${invalid.error}` : `${invalid.file.name}: enter an alt tag.`);
    setUploading(true);
    try {
      const form = new FormData(); pending.forEach((item) => form.append("images", item.file));
      form.set("metadata", JSON.stringify(pending.map((item) => ({ altTag: item.altTag.trim(), isPublic: item.isPublic }))));
      const response = await fetch("/api/admin/gallery", { method: "POST", body: form }); const result = await response.json() as ApiResponse;
      if (!response.ok) throw new Error(result.message); toast.success(result.message);
      pending.forEach((item) => URL.revokeObjectURL(item.preview)); setPending([]); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to upload images.", { duration: 7000 }); }
    finally { setUploading(false); }
  }

  async function update(image: GalleryImageRecord, changes: { altTag?: string; isPublic?: boolean }) {
    try { const response = await fetch(`/api/admin/gallery/${image.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) }); const result = await response.json() as ApiResponse; if (!response.ok || !result.data?.image) throw new Error(result.message); setImages((current) => current.map((item) => item.id === image.id ? result.data!.image! : item)); toast.success(result.message); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update image."); await load(); }
  }

  async function bulk(isPublic: boolean) {
    if (!selected.size) return toast.error("Select at least one image."); setBusy(true);
    try { const response = await fetch("/api/admin/gallery/bulk", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selected], isPublic }) }); const result = await response.json() as ApiResponse; if (!response.ok) throw new Error(result.message); toast.success(result.message); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update selected images."); }
    finally { setBusy(false); }
  }

  async function remove(image: GalleryImageRecord) {
    if (!await confirmDestructive("Delete gallery image?", `“${image.altTag}” will be permanently removed from the gallery and Cloudinary.`, "Delete image")) return;
    try { const response = await fetch(`/api/admin/gallery/${image.id}`, { method: "DELETE" }); const result = await response.json() as ApiResponse; if (!response.ok) throw new Error(result.message); toast.success(result.message); setImages((current) => current.filter((item) => item.id !== image.id)); setSelected((current) => { const next = new Set(current); next.delete(image.id); return next; }); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete image."); }
  }

  return <div className="gallery-admin-page">
    <section className="gallery-admin-hero"><div><span className="dashboard-kicker"><i className="fa fa-picture-o" /> Website media</span><h1>Image gallery</h1><p>Upload images in any dimensions. Each image is automatically compressed below 1 MB.</p></div><label className="gallery-file-button"><i className="fa fa-plus" /> Choose images<input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => void chooseFiles(event.target.files)} /></label></section>

    {pending.length > 0 && <section className="app-card gallery-upload-panel"><header><div><span className="dashboard-section-label">Before upload</span><h2>Review {pending.length} selected image{pending.length === 1 ? "" : "s"}</h2></div><button className="gallery-upload-submit" type="button" disabled={uploading || pending.some((item) => Boolean(item.error) || item.altTag.trim().length < 2)} onClick={() => void upload()}>{uploading ? <><i className="fa fa-spinner fa-spin" /> Uploading…</> : <><i className="fa fa-cloud-upload" /> Upload all</>}</button></header><div className="gallery-pending-grid">{pending.map((item) => <article className={item.error ? "has-error" : ""} key={item.key}><div className="gallery-preview"><Image src={item.preview} alt="Selected image preview" fill unoptimized /><button type="button" onClick={() => removePending(item.key)} aria-label={`Remove ${item.file.name}`}><i className="fa fa-times" /></button></div><strong title={item.file.name}>{item.file.name}</strong>{item.error && <p className="gallery-error"><i className="fa fa-exclamation-circle" /> {item.error}</p>}<label><span>Alt tag <b>*</b></span><input className="form-control" maxLength={180} placeholder="Describe the image" value={item.altTag} onChange={(event) => setPending((current) => current.map((entry) => entry.key === item.key ? { ...entry, altTag: event.target.value } : entry))} /></label><label className="gallery-check"><input type="checkbox" checked={item.isPublic} onChange={(event) => setPending((current) => current.map((entry) => entry.key === item.key ? { ...entry, isPublic: event.target.checked } : entry))} /><span>Show Publicly on Website</span></label></article>)}</div></section>}

    <section className="app-card gallery-library"><header><div><span className="dashboard-section-label">After upload</span><h2>Media library</h2><p>{images.length} image{images.length === 1 ? "" : "s"} · {images.filter((image) => image.isPublic).length} public</p></div><div className="gallery-bulk-actions"><label><input type="checkbox" checked={images.length > 0 && selected.size === images.length} onChange={(event) => setSelected(event.target.checked ? new Set(images.map((image) => image.id)) : new Set())} /> Select all</label><button type="button" disabled={busy || !selected.size} onClick={() => void bulk(true)}><i className="fa fa-eye" /> Make public</button><button type="button" disabled={busy || !selected.size} onClick={() => void bulk(false)}><i className="fa fa-eye-slash" /> Make private</button></div></header>
      {loading ? <div className="gallery-loading"><i className="fa fa-spinner fa-spin" /> Loading gallery…</div> : images.length === 0 ? <div className="app-empty gallery-empty"><i className="fa fa-picture-o" /><strong>No gallery images yet</strong><span>Choose one or more images to get started.</span></div> : <div className="gallery-library-grid">{images.map((image) => <article key={image.id}><div className="gallery-preview"><Image src={image.imageUrl} alt={image.altTag} fill sizes="(max-width: 700px) 100vw, 300px" /><label className="gallery-card-select" title="Select image"><input type="checkbox" checked={selected.has(image.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(image.id); else next.delete(image.id); return next; })} /></label><span className={`gallery-visibility ${image.isPublic ? "is-public" : "is-private"}`}><i className={`fa fa-${image.isPublic ? "eye" : "eye-slash"}`} /> {image.isPublic ? "Public" : "Private"}</span></div><div className="gallery-card-body"><label><span>Alt tag</span><input className="form-control" defaultValue={image.altTag} maxLength={180} onBlur={(event) => { const altTag = event.target.value.trim(); if (altTag !== image.altTag) void update(image, { altTag }); }} /></label><label className="gallery-check"><input type="checkbox" checked={image.isPublic} onChange={(event) => void update(image, { isPublic: event.target.checked })} /><span>Show Publicly on Website</span></label><footer><small>Uploaded {new Date(image.uploadDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</small><button type="button" onClick={() => void remove(image)}><i className="fa fa-trash" /> Delete</button></footer></div></article>)}</div>}
    </section>
  </div>;
}
