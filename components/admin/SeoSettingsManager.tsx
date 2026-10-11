"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ThemeSelect } from "@/components/ui/ThemeSelect";

type PageSettings = { path: string; title: string; description: string; keywords: string[]; canonicalUrl: string; openGraphTitle: string; openGraphDescription: string; openGraphImage: string };
type Settings = { pages: PageSettings[] };

const blankPage = (path = ""): PageSettings => ({ path, title: "", description: "", keywords: [], canonicalUrl: "", openGraphTitle: "", openGraphDescription: "", openGraphImage: "" });

export function SeoSettingsManager({ initial, suggestedPaths }: { initial: Settings; suggestedPaths: string[] }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploadingOg, setUploadingOg] = useState<number | null>(null);
  const unusedPaths = useMemo(() => suggestedPaths.filter((path) => !settings.pages.some((page) => page.path === path)), [settings.pages, suggestedPaths]);

  function updatePage(index: number, field: keyof PageSettings, value: string | string[]) {
    setSettings((current) => ({ ...current, pages: current.pages.map((page, pageIndex) => pageIndex === index ? { ...page, [field]: value } : page) }));
  }

  function addPage(path = "") { setSettings((current) => ({ ...current, pages: [...current.pages, blankPage(path)] })); }
  function removePage(index: number) { setSettings((current) => ({ ...current, pages: current.pages.filter((_, pageIndex) => pageIndex !== index) })); }

  async function uploadOgImage(index: number, file: File) {
    if (!(["image/jpeg", "image/png", "image/webp"].includes(file.type))) { toast.error("Choose a JPG, PNG, or WebP image"); return; }
    if (file.size === 0 || file.size > 100 * 1024) { toast.error("OG image must be no larger than 100 KB"); return; }
    setUploadingOg(index);
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch("/api/admin/seo/og-image", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to upload OG image");
      updatePage(index, "openGraphImage", result.data.url);
      toast.success("OG image uploaded. Save changes to apply it.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to upload OG image"); }
    finally { setUploadingOg(null); }
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/seo", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const result = await response.json();
      if (!response.ok) {
        const firstError = result.errors && Object.values(result.errors).flat()[0];
        throw new Error(typeof firstError === "string" ? firstError : result.message || "Unable to save settings");
      }
      toast.success(result.message || "SEO settings saved");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save settings"); }
    finally { setSaving(false); }
  }

  return <div className="seo-admin">
    <header className="seo-admin-hero"><div><span>Website visibility</span><h1>SEO settings</h1><p>Control search metadata and structured data for each page.</p></div><button className="btn btn-primary" type="button" disabled={saving} onClick={save}><i className={`fa fa-${saving ? "spinner fa-spin" : "save"}`} /> {saving ? "Saving…" : "Save changes"}</button></header>
    <>
     <section className="app-card seo-add-page"><div><h2>Add a page</h2><p>Choose a known public page or enter any exact URL path, including dynamic pages.</p></div><div>{unusedPaths.length > 0 && <ThemeSelect value="" options={unusedPaths.map((path) => ({ value: path, label: path === "/" ? "/ — Homepage" : path }))} onChange={addPage} placeholder="Choose a page…" ariaLabel="Choose a page" searchable searchPlaceholder="Search pages..." />}<button type="button" className="btn btn-outline-secondary" onClick={() => addPage()}><i className="fa fa-plus" /> Custom path</button></div></section>
      <div className="seo-page-list">{settings.pages.length === 0 && <div className="app-card seo-empty"><i className="fa fa-search" /><h2>No page overrides yet</h2><p>Your existing metadata remains active until you add an override.</p></div>}{settings.pages.map((page, index) => <details className="app-card seo-page-card" key={`${index}-${page.path}`}>
        <summary><span><i className="fa fa-globe" /><strong>{page.path || "New page"}</strong><small>{page.title || "Using the page's default metadata"}</small></span><i className="fa fa-chevron-down" /></summary>
        <div className="seo-fields">
          <label><span>Page path *</span><input className="form-control" value={page.path} onChange={(e) => updatePage(index, "path", e.target.value)} placeholder="/ or /courses/example" /></label>
          <label><span>Canonical URL</span><input className="form-control" value={page.canonicalUrl} onChange={(e) => updatePage(index, "canonicalUrl", e.target.value)} placeholder="https://eduwrap.com/page" /></label>
          <label className="wide"><span>Meta title <small>{page.title.length}/70</small></span><input className="form-control" maxLength={70} value={page.title} onChange={(e) => updatePage(index, "title", e.target.value)} placeholder="Leave blank to use the current title" /></label>
          <label className="wide"><span>Meta description <small>{page.description.length}/320</small></span><textarea className="form-control" rows={3} maxLength={320} value={page.description} onChange={(e) => updatePage(index, "description", e.target.value)} placeholder="Leave blank to use the current description" /></label>
          <label className="wide"><span>Keywords <small>Comma-separated</small></span><input className="form-control" value={page.keywords.join(", ")} onChange={(e) => updatePage(index, "keywords", e.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></label>
          <div className="seo-field-divider wide"><span>Open Graph</span></div>
          <label><span>OG title</span><input className="form-control" value={page.openGraphTitle} onChange={(e) => updatePage(index, "openGraphTitle", e.target.value)} /></label>
          <div className="seo-og-field"><span>OG image <small>Maximum 100 KB</small></span>{page.openGraphImage ? <div className="seo-og-preview"><Image src={page.openGraphImage} alt="Open Graph preview" width={160} height={84} unoptimized /><div><strong>Image uploaded</strong><small>Stored securely in Cloudinary</small><label className={uploadingOg === index ? "disabled" : ""}><i className={`fa fa-${uploadingOg === index ? "spinner fa-spin" : "refresh"}`} /> Replace<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingOg === index} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void uploadOgImage(index, file); }} /></label><button type="button" disabled={uploadingOg === index} onClick={() => updatePage(index, "openGraphImage", "")}><i className="fa fa-trash" /> Remove</button></div></div> : <label className={`seo-og-dropzone ${uploadingOg === index ? "disabled" : ""}`}><i className={`fa fa-${uploadingOg === index ? "spinner fa-spin" : "cloud-upload"}`} /><strong>{uploadingOg === index ? "Uploading…" : "Upload OG image"}</strong><small>JPG, PNG or WebP · up to 100 KB</small><input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingOg === index} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void uploadOgImage(index, file); }} /></label>}</div>
          <label className="wide"><span>OG description</span><textarea className="form-control" rows={2} value={page.openGraphDescription} onChange={(e) => updatePage(index, "openGraphDescription", e.target.value)} /></label>
          <div className="seo-card-actions wide"><button type="button" onClick={() => removePage(index)}><i className="fa fa-trash" /> Remove page override</button></div>
        </div>
      </details>)}</div>
    </>
  </div>;
}
