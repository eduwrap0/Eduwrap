"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ThemeSelect } from "@/components/ui/ThemeSelect";

type PageSettings = { path: string; title: string; description: string; keywords: string[]; canonicalUrl: string; openGraphTitle: string; openGraphDescription: string; openGraphImage: string; structuredData: string; customTags: string };
type Settings = { pages: PageSettings[]; sitewideTags: string };

const blankPage = (path = ""): PageSettings => ({ path, title: "", description: "", keywords: [], canonicalUrl: "", openGraphTitle: "", openGraphDescription: "", openGraphImage: "", structuredData: "", customTags: "" });

export function SeoSettingsManager({ initial, suggestedPaths }: { initial: Settings; suggestedPaths: string[] }) {
  const [settings, setSettings] = useState(initial);
  const [active, setActive] = useState<"pages" | "sitewide" | "pageTags">("pages");
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
    <header className="seo-admin-hero"><div><span>Website visibility</span><h1>SEO settings</h1><p>Control search metadata and structured data per page, plus tracking tags across the public website.</p></div><button className="btn btn-primary" type="button" disabled={saving} onClick={save}><i className={`fa fa-${saving ? "spinner fa-spin" : "save"}`} /> {saving ? "Saving…" : "Save changes"}</button></header>
    <div className="seo-tabs" role="tablist"><button type="button" className={active === "pages" ? "active" : ""} onClick={() => setActive("pages")}><i className="fa fa-file-text-o" /> Page SEO</button><button type="button" className={active === "sitewide" ? "active" : ""} onClick={() => setActive("sitewide")}><i className="fa fa-code" /> Sitewide tags</button><button type="button" className={active === "pageTags" ? "active" : ""} onClick={() => setActive("pageTags")}><i className="fa fa-tags" /> Page-specific tag</button></div>

    {active === "pages" ? <>
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
          <div className="seo-field-divider wide"><span>Structured data</span><small>Valid JSON-LD object or array</small></div>
          <label className="wide"><span>Schema JSON</span><textarea className="form-control seo-code" rows={9} value={page.structuredData} onChange={(e) => updatePage(index, "structuredData", e.target.value)} placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "WebPage"\n}'} /></label>
          <div className="seo-card-actions wide"><button type="button" onClick={() => removePage(index)}><i className="fa fa-trash" /> Remove page override</button></div>
        </div>
      </details>)}</div>
    </> : active === "sitewide" ? <section className="app-card seo-sitewide"><header><span><i className="fa fa-code" /></span><div><h2>Sitewide tag code</h2><p>Paste complete tag snippets here. They load across every public page.</p></div></header><div className="seo-fields">
      <label className="wide"><span>Paste complete tags</span><textarea className="form-control seo-code" rows={20} value={settings.sitewideTags} onChange={(e) => setSettings({ ...settings, sitewideTags: e.target.value })} placeholder={'<!-- Paste Google Analytics, GTM, Meta Pixel, or any other tags here -->\n<script>\n  // your code\n</script>'} /><small>The code is saved exactly as entered and rendered on public website pages only.</small></label>
    </div></section> : <>
      <section className="app-card seo-add-page"><div><h2>Add page-specific tags</h2><p>Select the exact page where your pasted tag code should load.</p></div><div>{unusedPaths.length > 0 && <ThemeSelect value="" options={unusedPaths.map((path) => ({ value: path, label: path === "/" ? "/ — Homepage" : path }))} onChange={addPage} placeholder="Choose a page…" ariaLabel="Choose a page for tags" searchable searchPlaceholder="Search pages..." />}<button type="button" className="btn btn-outline-secondary" onClick={() => addPage()}><i className="fa fa-plus" /> Custom path</button></div></section>
      <div className="seo-page-list">{settings.pages.length === 0 && <div className="app-card seo-empty"><i className="fa fa-tags" /><h2>No page-specific tags yet</h2><p>Add a page, paste its tag code, and save your changes.</p></div>}{settings.pages.map((page, index) => <details className="app-card seo-page-card seo-page-tag-card" key={`tag-${index}-${page.path}`}>
        <summary><span><i className="fa fa-tag" /><strong>{page.path || "New page"}</strong><small>{page.customTags ? "Page-specific tag code added" : "No tag code added"}</small></span><i className="fa fa-chevron-down" /></summary>
        <div className="seo-fields">
          <label className="wide"><span>Page path *</span><input className="form-control" value={page.path} onChange={(event) => updatePage(index, "path", event.target.value)} placeholder="/ or /courses/example" /></label>
          <label className="wide"><span>Paste complete tags</span><textarea className="form-control seo-code" rows={12} value={page.customTags} onChange={(event) => updatePage(index, "customTags", event.target.value)} placeholder={'<!-- Paste any page-specific tags here -->\n<script>\n  // conversion or tracking code\n</script>'} /><small>Accepts complete HTML tags, including meta, link, script, noscript, and verification tags.</small></label>
          <div className="seo-card-actions wide">{page.customTags && <button type="button" onClick={() => updatePage(index, "customTags", "")}><i className="fa fa-eraser" /> Clear tag code</button>}<button type="button" onClick={() => removePage(index)}><i className="fa fa-trash" /> Remove page override</button></div>
        </div>
      </details>)}</div>
    </>}
  </div>;
}
