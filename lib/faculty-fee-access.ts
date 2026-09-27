interface FacultyAssignmentSource {
  _id: unknown;
  facultyAssignments?: Array<{ facultyId: { toString(): string }; assignedAt: Date }>;
}

export function buildFacultyPaymentAccessConditions(students: FacultyAssignmentSource[], facultyId: string) {
  return students.flatMap((student) => {
    const assignment = student.facultyAssignments?.find((item) => item.facultyId.toString() === facultyId);
    return assignment ? [{ student: student._id, createdAt: { $gte: assignment.assignedAt } }] : [];
  });
}