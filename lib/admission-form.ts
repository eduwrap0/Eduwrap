import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import sharp from "sharp";
import { site } from "@/content/site";

export interface AdmissionFormData {
  studentId: string;
  name: string;
  email: string;
  phone: string;
  profileImageUrl?: string;
  profile: Array<[string, string]>;
  guardian: Array<[string, string]>;
  enrollment: Array<[string, string]>;
  address: string;
  generatedAt: Date;
}

const maroon = rgb(0.55, 0.02, 0.16);
const gold = rgb(0.7, 0.44, 0.09);
const ink = rgb(0.14, 0.12, 0.14);
const muted = rgb(0.42, 0.39, 0.41);
const paper = rgb(0.998, 0.995, 0.986);

function safeText(value: string): string {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "").trim() || "Not provided";
}

function fit(text: string, font: PDFFont, maximum: number, width: number, minimum = 6.5): number {
  let size = maximum;
  while (size > minimum && font.widthOfTextAtSize(safeText(text), size) > width) size -= 0.5;
  return size;
}

function drawField(page: PDFPage, regular: PDFFont, bold: PDFFont, label: string, value: string, x: number, y: number, width: number) {
  page.drawText(safeText(label).toUpperCase(), { x, y: y + 11, font: bold, size: 6.5, color: muted });
  const clean = safeText(value);
  page.drawText(clean, { x, y: y - 2, font: regular, size: fit(clean, regular, 9, width - 8), color: ink });
  page.drawLine({ start: { x, y: y - 7 }, end: { x: x + width, y: y - 7 }, thickness: 0.45, color: rgb(0.81, 0.78, 0.79) });
}

async function brandedPage(document: PDFDocument, pageNumber: number, totalPages: number, regular: PDFFont, bold: PDFFont) {
  const page = document.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 16, y: 16, width: width - 32, height: height - 32, color: paper, borderColor: maroon, borderWidth: 2 });
  page.drawRectangle({ x: 23, y: 23, width: width - 46, height: height - 46, borderColor: gold, borderWidth: 0.7 });
  try {
    const logoPath = path.join(process.cwd(), "public", "assets", "images", "logo-dark.webp");
    const logo = await document.embedPng(await sharp(await readFile(logoPath)).png().toBuffer());
    const scaled = logo.scaleToFit(145, 49);
    page.drawImage(logo, { x: 38, y: height - 77, width: scaled.width, height: scaled.height });
  } catch {
    page.drawText("EduWrap", { x: 42, y: height - 60, font: bold, size: 22, color: maroon });
  }
  page.drawText("STUDENT ADMISSION FORM", { x: width - 252, y: height - 51, font: bold, size: 16, color: maroon });
  page.drawText("COMPUTER TRAINING INSTITUTE", { x: width - 252, y: height - 66, font: bold, size: 7.5, color: ink });
  page.drawLine({ start: { x: 38, y: height - 90 }, end: { x: width - 38, y: height - 90 }, thickness: 1, color: gold });
  page.drawText(`${site.email}  |  ${site.phone}`, { x: 38, y: 34, font: regular, size: 6.5, color: muted });
  page.drawText(`Page ${pageNumber} of ${totalPages}`, { x: width - 82, y: 34, font: regular, size: 6.5, color: muted });
  return page;
}

function sectionTitle(page: PDFPage, bold: PDFFont, title: string, y: number) {
  page.drawRectangle({ x: 38, y: y - 4, width: 519, height: 22, color: rgb(0.97, 0.91, 0.93), borderColor: rgb(0.87, 0.72, 0.78), borderWidth: 0.5 });
  page.drawText(safeText(title).toUpperCase(), { x: 48, y: y + 3, font: bold, size: 8, color: maroon });
}

function drawThreeColumnFields(page: PDFPage, regular: PDFFont, bold: PDFFont, fields: Array<[string, string]>, startY: number): number {
  const gap = 13;
  const columnWidth = (509 - gap * 2) / 3;
  let y = startY;
  for (let index = 0; index < fields.length; index += 3) {
    for (let column = 0; column < 3; column += 1) {
      const field = fields[index + column];
      if (field) drawField(page, regular, bold, field[0], field[1], 43 + column * (columnWidth + gap), y, columnWidth);
    }
    y -= 29;
  }
  return y;
}

async function drawProfilePhoto(document: PDFDocument, page: PDFPage, imageUrl?: string) {
  const x = 43;
  const y = 588;
  const width = 109;
  const height = 125;
  page.drawRectangle({ x, y, width, height, color: rgb(0.98, 0.96, 0.97), borderColor: maroon, borderWidth: 0.8 });
  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") throw new Error("Invalid profile image host");
      const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000) });
      if (!response.ok) throw new Error("Profile image unavailable");
      const source = Buffer.from(await response.arrayBuffer());
      if (source.length > 1024 * 1024) throw new Error("Profile image is too large");
      const png = await sharp(source).resize(Math.round(width * 3), Math.round(height * 3), { fit: "contain", position: "centre", background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toBuffer();
      const image = await document.embedPng(png);
      page.drawImage(image, { x: x + 2, y: y + 2, width: width - 4, height: height - 4 });
      return;
    } catch {
      // Keep the professional placeholder when a remote profile image cannot be loaded.
    }
  }
  page.drawCircle({ x: x + width / 2, y: y + 47, size: 12, color: rgb(0.88, 0.82, 0.84) });
  page.drawRectangle({ x: x + 18, y: y + 10, width: 31, height: 22, color: rgb(0.88, 0.82, 0.84) });
  page.drawText("PHOTO", { x: x + 22, y: y + 5, size: 6.5, color: muted });
}

export async function generateAdmissionFormPdf(data: AdmissionFormData): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  document.setTitle(`Admission Form - ${safeText(data.name)}`);
  document.setAuthor(site.name);
  document.setSubject(`Student admission record ${safeText(data.studentId)}`);
  document.setCreationDate(data.generatedAt);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const italic = await document.embedFont(StandardFonts.HelveticaOblique);

  const page = await brandedPage(document, 1, 1, regular, bold);
  sectionTitle(page, bold, "Admission record", 724);
  const admissionFields: Array<[string, string]> = [
    ["Student ID", data.studentId], ["Admission date", data.enrollment.find(([label]) => label === "Admission date")?.[1] || "Not provided"],
    ["Student name", data.name], ["Phone number", data.phone],
    ["Email address", data.email],
  ];
  let y = 688;
  for (let index = 0; index < admissionFields.length; index += 2) {
    drawField(page, regular, bold, admissionFields[index][0], admissionFields[index][1], 165, y, admissionFields[index + 1] ? 167 : 387);
    if (admissionFields[index + 1]) drawField(page, regular, bold, admissionFields[index + 1][0], admissionFields[index + 1][1], 345, y, 207);
    y -= 29;
  }
  await drawProfilePhoto(document, page, data.profileImageUrl);
  y = Math.min(y, 568);
  sectionTitle(page, bold, "Personal information", y - 4);
  y = drawThreeColumnFields(page, regular, bold, data.profile, y - 34);
  sectionTitle(page, bold, "Residential address", y - 4);
  drawField(page, regular, bold, "Complete address", data.address, 43, y - 34, 509);
  y -= 63;
  sectionTitle(page, bold, "Parent / guardian information", y - 4);
  y = drawThreeColumnFields(page, regular, bold, data.guardian, y - 34);
  sectionTitle(page, bold, "Course and enrollment information", y - 4);
  y = drawThreeColumnFields(page, regular, bold, data.enrollment.filter(([label]) => label !== "Admission date"), y - 34);
  sectionTitle(page, bold, "Student declaration", y - 4);
  const declaration = "I confirm that the information recorded in this admission form is correct to the best of my knowledge. I agree to follow the institute's academic, attendance, fee, and conduct policies.";
  const words = declaration.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = `${line} ${word}`.trim();
    if (regular.widthOfTextAtSize(candidate, 8.5) > 492) { lines.push(line); line = word; } else line = candidate;
  }
  if (line) lines.push(line);
  lines.forEach((text, index) => page.drawText(text, { x: 48, y: y - 23 - index * 12, font: regular, size: 7.5, color: ink }));
  const signatureY = Math.max(82, y - 82);
  page.drawLine({ start: { x: 58, y: signatureY }, end: { x: 225, y: signatureY }, thickness: 0.6, color: muted });
  page.drawLine({ start: { x: 370, y: signatureY }, end: { x: 537, y: signatureY }, thickness: 0.6, color: muted });
  page.drawText("Student / Guardian signature", { x: 75, y: signatureY - 14, font: bold, size: 7.5, color: ink });
  page.drawText("Authorized signatory", { x: 408, y: signatureY - 14, font: bold, size: 7.5, color: ink });
  page.drawText(`Generated securely on ${data.generatedAt.toLocaleString("en-IN")}`, { x: 48, y: 50, font: italic, size: 6.5, color: muted });

  return document.save();
}
