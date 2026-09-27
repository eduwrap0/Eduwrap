import mongoose from "mongoose";
import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { authorizeApi } from "@/lib/auth";
import { canAccessAnyCourseMaterials, materialCourses } from "@/lib/materials";
import { connectMongoDB } from "@/lib/mongodb";
import { CourseMaterial } from "@/models/CourseMaterial";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApi(request);
  if (!auth.ok) return auth.response;
  if (auth.user.role === "student" && auth.user.courseStatus !== "completed") return apiError("Course materials are locked until your course is marked as completed", 403);
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return apiError("Material not found", 404);
  await connectMongoDB();
  const material = await CourseMaterial.findById(id);
  if (!material) return apiError("Material not found", 404);
  if (!canAccessAnyCourseMaterials(auth.user, materialCourses(material))) return apiError("You are not enrolled in a course containing this material", 403);
  try {
    const upstream = await fetch(material.cloudinaryUrl, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) return apiError("File is temporarily unavailable", 502);
    const filename = material.originalName.replace(/[\r\n"\\]/g, "_");
    return new Response(upstream.body, { headers: { "Content-Type": material.mimeType, "Content-Length": String(material.bytes), "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
  } catch { return apiError("Unable to download file", 502); }
}
