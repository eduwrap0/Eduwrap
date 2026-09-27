import { z } from "zod";

export const galleryUpdateSchema = z.object({
  altTag: z.string().trim().min(2, "Alt tag must contain at least 2 characters").max(180, "Alt tag must not exceed 180 characters").optional(),
  isPublic: z.boolean().optional(),
}).refine((value) => value.altTag !== undefined || value.isPublic !== undefined, { message: "Provide an alt tag or visibility status" });

export const galleryBulkVisibilitySchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid image ID")).min(1, "Select at least one image").max(100),
  isPublic: z.boolean(),
});
