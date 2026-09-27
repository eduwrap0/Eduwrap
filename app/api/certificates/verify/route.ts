import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { hasValidRequestOrigin } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { checkRateLimit, recordRateLimitFailure, requestIp } from "@/lib/rate-limit";
import { certificateVerificationSchema } from "@/lib/validators/certificate";
import { User } from "@/models/User";
import { site } from "@/content/site";

export const runtime = "nodejs";

function protectedResponse(response: Response): Response {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return protectedResponse(apiError("Invalid request origin", 403));

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return protectedResponse(apiError("Invalid request", 400));
  }

  const parsed = certificateVerificationSchema.safeParse(body);
  if (!parsed.success) return protectedResponse(validationError(parsed.error));

  const identity = requestIp(request.headers);
  try {
    const limit = await checkRateLimit("certificate-verification", identity);
    if (!limit.allowed) {
      const response = protectedResponse(apiError("Too many unsuccessful verification attempts. Please try again later.", 429));
      response.headers.set("Retry-After", String(limit.retryAfter));
      return response;
    }

    await connectMongoDB();
    const student = await User.findOne({
      certificateNumber: parsed.data.certificateNumber,
      role: "student",
      courseStatus: "completed",
      courseCompletedAt: { $exists: true },
    }).select("name courses course courseDuration courseCompletedAt certificateNumber").lean();

    if (!student?.certificateNumber || !student.courseCompletedAt) {
      await recordRateLimitFailure("certificate-verification", identity);
      return protectedResponse(apiError("No valid certificate was found for the supplied number.", 404));
    }

    const courses = student.courses?.length ? student.courses : student.course ? [student.course] : [];
    return protectedResponse(apiSuccess("Certificate verified", {
      status: "valid" as const,
      certificateNumber: student.certificateNumber,
      holderName: student.name,
      courseName: courses.join(", ") || "Professional Training Program",
      courseDuration: student.courseDuration || "Not specified",
      completedAt: student.courseCompletedAt.toISOString(),
      issuer: site.name,
      verifiedAt: new Date().toISOString(),
    }));
  } catch {
    return protectedResponse(apiError("Certificate verification is temporarily unavailable.", 503));
  }
}

