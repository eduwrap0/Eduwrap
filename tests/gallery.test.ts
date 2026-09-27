import assert from "node:assert/strict";
import test from "node:test";
import { galleryBulkVisibilitySchema, galleryUpdateSchema } from "../lib/validators/gallery";

test("gallery updates require a useful alt tag or visibility change", () => {
  assert.equal(galleryUpdateSchema.safeParse({ altTag: "Students collaborating during an EduWrap class" }).success, true);
  assert.equal(galleryUpdateSchema.safeParse({ isPublic: true }).success, true);
  assert.equal(galleryUpdateSchema.safeParse({ altTag: " " }).success, false);
  assert.equal(galleryUpdateSchema.safeParse({}).success, false);
});

test("bulk gallery visibility validates selected MongoDB IDs", () => {
  const valid = "507f1f77bcf86cd799439011";
  assert.deepEqual(galleryBulkVisibilitySchema.parse({ ids: [valid], isPublic: false }), { ids: [valid], isPublic: false });
  assert.equal(galleryBulkVisibilitySchema.safeParse({ ids: [], isPublic: true }).success, false);
  assert.equal(galleryBulkVisibilitySchema.safeParse({ ids: ["not-an-id"], isPublic: true }).success, false);
});
