import { z } from "zod";

export const videoTestimonialFieldsSchema = z.object({
  studentName: z.string().trim().min(2, "Student name must contain at least 2 characters").max(100),
  videoAltText: z.string().trim().min(2, "Video alt text must contain at least 2 characters").max(180),
  displayOrder: z.coerce.number().int().min(0).max(10000),
  isActive: z.boolean(),
});
export const videoTestimonialUpdateSchema = videoTestimonialFieldsSchema.partial().refine((value) => Object.keys(value).length > 0, { message: "Provide at least one field to update" });
export const videoTestimonialBulkSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid testimonial ID")).min(1, "Select at least one testimonial").max(100),
  isActive: z.boolean(),
});
