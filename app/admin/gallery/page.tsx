import type { Metadata } from "next";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { requirePageRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Gallery Management", robots: { index: false, follow: false } };

export default async function AdminGalleryPage() {
  await requirePageRole("admin");
  return <GalleryManager />;
}
