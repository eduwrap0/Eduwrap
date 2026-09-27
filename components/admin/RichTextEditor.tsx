"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";

export function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editor = useRef<HTMLDivElement>(null); const imageInput = useRef<HTMLInputElement>(null); const [uploading, setUploading] = useState(false);
  function command(name: string, argument?: string) { editor.current?.focus(); document.execCommand(name, false, argument); onChange(editor.current?.innerHTML || ""); }
  function addLink() { const href = window.prompt("Enter a secure HTTPS link"); if (href) command("createLink", href); }
  async function insertImage(file?: File) {
    if (!file) return; setUploading(true);
    try { const body = new FormData(); body.set("file", file); const response = await fetch("/api/admin/blogs/upload", { method: "POST", body }); const result = await response.json() as { message: string; data?: { url: string } }; if (!response.ok || !result.data) throw new Error(result.message); command("insertImage", result.data.url); toast.success("Image inserted"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to upload image."); } finally { setUploading(false); if (imageInput.current) imageInput.current.value = ""; }
  }
  const buttons: Array<[string, string, string?]> = [["bold", "bold"], ["italic", "italic"], ["list-ul", "insertUnorderedList"], ["list-ol", "insertOrderedList"], ["quote-left", "formatBlock", "blockquote"], ["code", "formatBlock", "pre"], ["undo", "undo"], ["repeat", "redo"]];
  return <div className="rich-editor"><div className="rich-editor-toolbar" role="toolbar" aria-label="Rich text formatting"><select aria-label="Text style" defaultValue="p" onChange={(event) => command("formatBlock", event.target.value)}><option value="p">Paragraph</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="h4">Heading 4</option></select>{buttons.map(([icon, name, argument]) => <button key={`${name}-${argument || ""}`} type="button" aria-label={name} title={name} onClick={() => command(name, argument)}><i className={`fa fa-${icon}`} /></button>)}<button type="button" aria-label="Add link" title="Add link" onClick={addLink}><i className="fa fa-link" /></button><button type="button" aria-label="Insert image" title="Insert image" disabled={uploading} onClick={() => imageInput.current?.click()}><i className={`fa fa-${uploading ? "spinner fa-spin" : "image"}`} /></button><input ref={imageInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void insertImage(event.target.files?.[0])} /></div><div ref={editor} className="rich-editor-surface" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: value }} onInput={(event) => onChange(event.currentTarget.innerHTML)} /></div>;
}
