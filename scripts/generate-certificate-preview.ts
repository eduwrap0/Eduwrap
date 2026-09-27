import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateCertificatePdf } from "@/lib/certificate";

async function main() {
  const outputDirectory = path.join(process.cwd(), "tmp", "certificate-preview");
  await mkdir(outputDirectory, { recursive: true });
  const pdf = await generateCertificatePdf({
    studentName: "Your Name",
    courseName: "Course Name",
    courseDuration: "3 months",
    certificateNumber: "EWCTI/2025/0001",
    completedAt: new Date("2025-06-01T00:00:00.000Z"),
  });
  const outputPath = path.join(outputDirectory, "EduWrap-Certificate-preview.pdf");
  await writeFile(outputPath, pdf);
  console.log(outputPath);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
