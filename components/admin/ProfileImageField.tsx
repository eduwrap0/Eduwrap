"use client";

import { ChangeEvent, useEffect, useState } from "react";

const MAX_UPLOAD_BYTES = 200 * 1024;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadProfileImageFile(file: File): Promise<string> {
  const body = new FormData();
  body.set("image", file);
  const response = await fetch("/api/uploads/profile-image", { method: "POST", body });
  const result = await response.json() as { message?: string; data?: { profileImageUrl?: string } };
  if (!response.ok || !result.data?.profileImageUrl) throw new Error(result.message || "Unable to upload profile image.");
  return result.data.profileImageUrl;
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Unable to compress this image.")), "image/jpeg", quality);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unable to read this image.")); };
    image.src = url;
  });
}

async function compressProfileImage(file: File): Promise<File> {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("The original image must be smaller than 10 MB.");

  const image = await loadImage(file);
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
  let scale = Math.min(1, 1200 / longestSide);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image compression is not supported by this browser.");

  for (let resizeAttempt = 0; resizeAttempt < 7; resizeAttempt += 1) {
    canvas.width = Math.max(240, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(240, Math.round(image.naturalHeight * scale));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (let quality = 0.86; quality >= 0.34; quality -= 0.08) {
      const blob = await canvasBlob(canvas, quality);
      if (blob.size <= MAX_UPLOAD_BYTES) {
        return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "profile"}.jpg`, { type: "image/jpeg" });
      }
    }
    scale *= 0.82;
  }
  throw new Error("The image could not be compressed below 200 KB. Please choose another image.");
}

export function ProfileImageField({ id, onChange, error, initialUrl }: { id: string; onChange: (file: File | null) => void; error?: string; initialUrl?: string }) {
  const [preview, setPreview] = useState(initialUrl || "");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  async function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const source = event.target.files?.[0];
    if (!source) return;
    setMessage("");
    onChange(null);
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview("");

    setProcessing(true);
    try {
      const compressed = await compressProfileImage(source);
      setPreview(URL.createObjectURL(compressed));
      setMessage(`Ready to upload (${Math.ceil(compressed.size / 1024)} KB)`);
      onChange(compressed);
    } catch (imageError) {
      event.target.value = "";
      setPreview(initialUrl || "");
      setMessage(imageError instanceof Error ? imageError.message : "Unable to process this image.");
    } finally {
      setProcessing(false);
    }
  }

  return <div className={`profile-image-field ${error ? "has-error" : ""}`}>
    <div className="profile-image-preview" aria-hidden="true" style={preview ? { backgroundImage: `url(${preview})` } : undefined}>
      {!preview && <i className="fa fa-user" />}
    </div>
    <div className="profile-image-control">
      <label htmlFor={id} className="form-label">Profile image <span className="optional-label">Optional</span></label>
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} disabled={processing} />
      <label htmlFor={id} className="profile-image-button"><i className={`fa ${processing ? "fa-spinner fa-spin" : "fa-cloud-upload"}`} /> {processing ? "Compressing…" : preview ? "Change image" : "Choose image"}</label>
      <small className={message && !preview ? "is-error" : ""}>{message || "JPG, PNG or WebP. Automatically compressed below 200 KB."}</small>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  </div>;
}
