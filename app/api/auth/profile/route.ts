import type { NextRequest } from "next/server";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { authorizeApi, hasValidRequestOrigin } from "@/lib/auth";
import { deleteProfileImage } from "@/lib/cloudinary";
import { connectMongoDB } from "@/lib/mongodb";
import { auditSecurityEvent } from "@/lib/security-audit";
import { updateOwnProfileSchema } from "@/lib/validators/auth";
import { User, toSafeUser } from "@/models/User";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return apiError("Invalid request origin", 403);
  const auth = await authorizeApi(request, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError("Invalid request", 400); }
  const parsed = updateOwnProfileSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    await connectMongoDB();
    const previousImageUrl = auth.user.profileImageUrl;
    const user = await User.findByIdAndUpdate(auth.user._id, { $set: { profileImageUrl: parsed.data.profileImageUrl } }, { returnDocument: "after", runValidators: true });
    if (!user) return apiError("Account not found", 404);
    auditSecurityEvent("own_profile_updated", user._id.toString(), user._id.toString());
    if (previousImageUrl && previousImageUrl !== user.profileImageUrl) {
      try { await deleteProfileImage(previousImageUrl); }
      catch (cleanupError) { console.error(JSON.stringify({ type: "profile_image_cleanup_error", userId: user._id.toString(), message: cleanupError instanceof Error ? cleanupError.message : "Unknown error" })); }
    }
    return apiSuccess("Profile image updated successfully", { user: toSafeUser(user) });
  } catch {
    return apiError("Unable to update profile image", 500);
  }
}
