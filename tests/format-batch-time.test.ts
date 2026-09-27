import assert from "node:assert/strict";
import test from "node:test";
import { formatBatchTime } from "../lib/format-batch-time";

test("formats stored batch times with AM and PM", () => {
  assert.equal(formatBatchTime("00:00"), "12:00 AM");
  assert.equal(formatBatchTime("10:30"), "10:30 AM");
  assert.equal(formatBatchTime("12:00"), "12:00 PM");
  assert.equal(formatBatchTime("14:15"), "02:15 PM");
});

test("uses the requested fallback when batch timing is missing", () => {
  assert.equal(formatBatchTime(undefined), "Not assigned");
  assert.equal(formatBatchTime("", "—"), "—");
});