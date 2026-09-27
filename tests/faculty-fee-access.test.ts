import assert from "node:assert/strict";
import test from "node:test";
import { buildFacultyPaymentAccessConditions } from "../lib/faculty-fee-access";

const id = (value: string) => ({ toString: () => value });

test("faculty payment scope uses each current assignment date as its cutoff", () => {
  const firstDate = new Date("2026-08-01T10:00:00.000Z");
  const secondDate = new Date("2026-08-05T12:30:00.000Z");
  const conditions = buildFacultyPaymentAccessConditions([
    { _id: "student-1", facultyAssignments: [{ facultyId: id("faculty-1"), assignedAt: firstDate }] },
    { _id: "student-2", facultyAssignments: [{ facultyId: id("faculty-1"), assignedAt: secondDate }] },
    { _id: "student-3", facultyAssignments: [{ facultyId: id("faculty-2"), assignedAt: firstDate }] },
  ], "faculty-1");

  assert.deepEqual(conditions, [
    { student: "student-1", createdAt: { $gte: firstDate } },
    { student: "student-2", createdAt: { $gte: secondDate } },
  ]);
});