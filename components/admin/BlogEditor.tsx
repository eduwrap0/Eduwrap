"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { BlogStatus, type BlogCourseRecord, type BlogFormValues, type BlogPostRecord } from "@/types/blog";

const empty: BlogFormValues = { title: "", slug: "", excerpt: "", content: "<p>Start writing your article...</p>", featuredImage: "", featuredImageAlt: "", socialImage: "", courseIds: [], status: BlogStatus.Draft, featuredOnHome: false, seoTitle: "", metaDescription: "", focusKeyword: "", canonicalUrl: "" };
const slugify = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160).replace(/-+$/g, "");

function initialValues(blog?: BlogPostRecord): BlogFormValues {
  return blog ? { title: blog.title, slug: blog.slug, excerpt: blog.excerpt, content: blog.content, featuredImage: blog.featuredImage, featuredImageAlt: blog.featuredImageAlt, socialImage: blog.socialImage || "", courseIds: blog.courses.map((course) => course.id), status: blog.status, featuredOnHome: blog.featuredOnHome, seoTitle: blog.seoTitle || "", metaDescription: blog.metaDescription || "", focusKeyword: blog.focusKeyword || "", canonicalUrl: blog.canonicalUrl || "" } : empty;
}

export function BlogEditor({ courses, blog }: { courses: BlogCourseRecord[]; blog?: BlogPostRecord }) {
  const router = useRouter(); const [form, setForm] = useState(() => initialValues(blog)); const [slugEdited, setSlugEdited] = useState(Boolean(blog)); const [dirty, setDirty] = useState(false); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState<"featured" | "social" | null>(null);
  const pageTitle = blog ? "Edit blog" : "Create blog";
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty]);
  function confirmLeave(event: React.MouseEvent<HTMLAnchorElement>) { if (dirty && !window.confirm("You have unsaved blog changes. Leave this page?")) event.preventDefault(); }
  function update<K extends keyof BlogFormValues>(key: K, value: BlogFormValues[K]) { setForm((current) => ({ ...current, [key]: value })); setDirty(true); }
  function updateTitle(title: string) { setForm((current) => ({ ...current, title, ...(!slugEdited ? { slug: slugify(title) } : {}) })); setDirty(true); }
  const selectedCourses = useMemo(() => new Set(form.courseIds), [form.courseIds]);

  async function upload(file: File | undefined, target: "featured" | "social") {
    if (!file) return; setUploading(target);
    try { const body = new FormData(); body.set("file", file); const response = await fetch("/api/admin/blogs/upload", { method: "POST", body }); const result = await response.json() as { message: string; data?: { url: string } }; if (!response.ok || !result.data) throw new Error(result.message); update(target === "featured" ? "featuredImage" : "socialImage", result.data.url); toast.success(target === "featured" ? "Featured image uploaded" : "Social image uploaded"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to upload image."); } finally { setUploading(null); }
  }

  async function save(status: BlogStatus) {
    setSaving(true);
    try {
      const payload = { ...form, status };
      const response = await fetch(blog ? `/api/admin/blogs/${blog.id}` : "/api/admin/blogs", { method: blog ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { message: string; data?: { blog?: BlogPostRecord }; errors?: Record<string, string[]> };
      if (!response.ok) throw new Error(result.errors ? Object.values(result.errors).flat()[0] : result.message);
      setDirty(false); toast.success(result.message);
      const saved = result.data?.blog; if (!blog && saved) router.replace(`/admin/blogs/${saved.id}/edit`); else { setForm((current) => ({ ...current, status })); router.refresh(); }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save blog."); } finally { setSaving(false); }
  }

  return <div className="blog-editor-page">
    <header className="blog-editor-header"><div><Link href="/admin/blogs" onClick={confirmLeave}><i className="fa fa-arrow-left" /> Blogs</Link><span className="dashboard-section-label">Content studio</span><h1>{pageTitle}</h1><p>{blog ? "Update content, assignments, publishing, and search appearance." : "Write a useful article and save it as a draft or publish it."}</p></div><div>{blog && <Link href={`/admin/blogs/${blog.id}/preview`} target="_blank" onClick={confirmLeave}><i className="fa fa-eye" /> Preview</Link>}<button type="button" disabled={saving} onClick={() => void save(BlogStatus.Draft)}><i className="fa fa-save" /> Save draft</button><button className="primary" type="button" disabled={saving} onClick={() => void save(BlogStatus.Published)}><i className={`fa fa-${saving ? "spinner fa-spin" : "check"}`} /> Publish</button></div></header>
    <div className="blog-editor-layout"><main>
      <section className="app-card blog-editor-section"><header><span><i className="fa fa-file-text-o" /></span><div><h2>Article content</h2><p>Use a clear title, concise excerpt, and structured headings.</p></div></header><div className="blog-editor-fields"><label><span>Title</span><input className="form-control" required maxLength={180} value={form.title} onChange={(event) => updateTitle(event.target.value)} placeholder="A useful, specific blog title" /></label><label><span>Slug</span><div className="blog-slug-field"><span>/blog/</span><input className="form-control" required maxLength={160} value={form.slug} onChange={(event) => { setSlugEdited(true); update("slug", slugify(event.target.value)); }} /></div></label><label><span>Excerpt <small>{form.excerpt.length}/500</small></span><textarea className="form-control" rows={4} maxLength={500} value={form.excerpt} onChange={(event) => update("excerpt", event.target.value)} placeholder="Summarize what readers will learn." /></label><label><span>Content</span><RichTextEditor value={form.content} onChange={(value) => update("content", value)} /></label></div></section>
      <section className="app-card blog-editor-section"><header><span><i className="fa fa-search" /></span><div><h2>Search appearance</h2><p>Optional SEO overrides fall back to the article title and excerpt.</p></div></header><div className="blog-editor-fields two-columns"><label><span>SEO title <small>{form.seoTitle.length}/70</small></span><input className="form-control" maxLength={70} value={form.seoTitle} onChange={(event) => update("seoTitle", event.target.value)} /></label><label><span>Focus keyword</span><input className="form-control" maxLength={100} value={form.focusKeyword} onChange={(event) => update("focusKeyword", event.target.value)} /></label><label className="wide"><span>Meta description <small>{form.metaDescription.length}/170</small></span><textarea className="form-control" rows={3} maxLength={170} value={form.metaDescription} onChange={(event) => update("metaDescription", event.target.value)} /></label><label className="wide"><span>Canonical URL <small>(optional HTTPS URL)</small></span><input className="form-control" type="url" value={form.canonicalUrl} onChange={(event) => update("canonicalUrl", event.target.value)} placeholder="https://eduwrap.com/blog/example" /></label></div></section>
    </main><aside>
      <section className="app-card blog-editor-side"><h2>Publishing</h2><div className="blog-current-status"><span className={`blog-status is-${form.status.toLowerCase()}`}><i />{form.status === BlogStatus.Published ? "Published" : "Draft"}</span>{dirty && <small>Unsaved changes</small>}</div><label className="blog-feature-toggle"><input type="checkbox" checked={form.featuredOnHome} onChange={(event) => update("featuredOnHome", event.target.checked)} /><span><i className="fa fa-star" /></span><div><strong>Show on homepage</strong><small>Only applies while published</small></div></label></section>
      <section className="app-card blog-editor-side"><h2>Related courses</h2><p>Choose one or more relevant courses.</p><div className="blog-course-checks">{courses.map((course) => <label key={course.id}><input type="checkbox" checked={selectedCourses.has(course.id)} onChange={(event) => update("courseIds", event.target.checked ? [...form.courseIds, course.id] : form.courseIds.filter((id) => id !== course.id))} /><span><i className="fa fa-check" /></span>{course.name}</label>)}</div></section>
      <section className="app-card blog-editor-side"><h2>Featured image</h2><p>JPG, PNG, or WebP; at least 640 × 360 and up to 5 MB.</p><label className="blog-upload"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(event.target.files?.[0], "featured")} /><span><i className={`fa fa-${uploading === "featured" ? "spinner fa-spin" : "cloud-upload"}`} /> {form.featuredImage ? "Replace image" : "Upload image"}</span></label>{form.featuredImage && <span className="blog-uploaded-url"><i className="fa fa-check-circle" /> Image ready</span>}<label><span>Meaningful image alt text</span><textarea className="form-control" rows={3} maxLength={180} value={form.featuredImageAlt} onChange={(event) => update("featuredImageAlt", event.target.value)} /></label></section>
      <section className="app-card blog-editor-side"><h2>Social image</h2><p>Optional. The featured image is used by default.</p><label className="blog-upload"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(event.target.files?.[0], "social")} /><span><i className={`fa fa-${uploading === "social" ? "spinner fa-spin" : "share-alt"}`} /> {form.socialImage ? "Replace social image" : "Upload social image"}</span></label>{form.socialImage && <button className="blog-remove-social" type="button" onClick={() => update("socialImage", "")}>Remove social image</button>}</section>
    </aside></div>
  </div>;
}
