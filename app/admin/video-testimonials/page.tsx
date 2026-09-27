import type { Metadata } from "next";
import { VideoTestimonialManager } from "@/components/admin/VideoTestimonialManager";
import { requirePageRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Video Testimonials", robots: { index: false, follow: false } };
export default async function VideoTestimonialsPage() { await requirePageRole("admin"); return <VideoTestimonialManager />; }
