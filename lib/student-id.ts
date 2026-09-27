import "server-only";
import { randomBytes } from "node:crypto";
import { User } from "@/models/User";

export async function generateUniqueStudentId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = randomBytes(4).toString("hex").toUpperCase();
    const studentId = `EDU-${new Date().getUTCFullYear()}-${suffix}`;
    if (!(await User.exists({ studentId }))) return studentId;
  }
  throw new Error("Unable to allocate a unique student ID.");
}

