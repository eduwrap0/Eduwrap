import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { objectIdSchema } from "@/lib/validators/auth";
import { FeePayment } from "@/models/FeePayment";

type RouteContext = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, "admin");
  if (!auth.ok) return auth.response;
  const id = objectIdSchema.safeParse((await context.params).id);
  if (!id.success) return validationError(id.error);

  try {
    await connectMongoDB();
    const payment = await FeePayment.findByIdAndDelete(id.data);
    if (!payment) return apiError("Fee entry not found", 404);
    auditSecurityEvent("fee_payment_deleted", auth.user._id.toString(), payment._id.toString());
    return apiSuccess("Fee entry deleted successfully", {});
  } catch {
    return apiError("Unable to delete fee entry", 500);
  }
}
