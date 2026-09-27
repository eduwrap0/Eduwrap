import assert from "node:assert/strict";
import test from "node:test";
import { videoTestimonialBulkSchema, videoTestimonialFieldsSchema, videoTestimonialUpdateSchema } from "../lib/validators/video-testimonial";

test("video testimonial fields validate metadata and ordering", () => {
  assert.equal(videoTestimonialFieldsSchema.safeParse({ studentName: "Aarav", videoAltText: "Aarav shares his learning experience", displayOrder: 2, isActive: true }).success, true);
  assert.equal(videoTestimonialFieldsSchema.safeParse({ studentName: "", videoAltText: "x", displayOrder: -1, isActive: true }).success, false);
});

test("video testimonial updates and bulk visibility require useful input", () => {
  const id = "507f1f77bcf86cd799439011";
  assert.equal(videoTestimonialUpdateSchema.safeParse({ displayOrder: 0 }).success, true);
  assert.equal(videoTestimonialUpdateSchema.safeParse({}).success, false);
  assert.equal(videoTestimonialBulkSchema.safeParse({ ids: [id], isActive: false }).success, true);
  assert.equal(videoTestimonialBulkSchema.safeParse({ ids: [], isActive: true }).success, false);
});
