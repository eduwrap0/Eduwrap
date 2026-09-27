import { z } from "zod";

export const certificateVerificationSchema = z.object({
  certificateNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(6, "Enter a complete certificate number.")
    .max(60, "Certificate number is too long.")
    .regex(/^[A-Z0-9][A-Z0-9/._-]*$/, "Enter a valid certificate number."),
}).strict();

