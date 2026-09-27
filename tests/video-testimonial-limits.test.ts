import assert from "node:assert/strict";
import test from "node:test";
import { MAX_TESTIMONIAL_UPLOAD_BODY_BYTES, MAX_TESTIMONIAL_VIDEO_BYTES, MAX_TESTIMONIAL_VIDEO_LABEL } from "@/lib/video-testimonial-limits";

test("video testimonial uploads allow files up to 100 MB", () => {
  assert.equal(MAX_TESTIMONIAL_VIDEO_BYTES, 100 * 1024 * 1024);
  assert.equal(MAX_TESTIMONIAL_VIDEO_LABEL, "100 MB");
  assert.ok(MAX_TESTIMONIAL_UPLOAD_BODY_BYTES > MAX_TESTIMONIAL_VIDEO_BYTES);
});
