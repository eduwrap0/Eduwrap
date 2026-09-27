import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import sharp from "sharp";
import { site } from "@/content/site";

interface CertificateData {
  studentName: string;
  courseName: string;
  courseDuration: string;
  certificateNumber: string;
  completedAt: Date;
}

const PAGE_WIDTH = 512;
const PAGE_HEIGHT = 768;
const CERTIFICATE_ADDRESS = "2nd floor, SCO - 4, Balaji Enclave, Patiala Road, Zirakpur - 140603";
const maroon = rgb(0.56, 0.01, 0.07);
const gold = rgb(0.69, 0.39, 0.03);
const navy = rgb(0.015, 0.035, 0.1);
const charcoal = rgb(0.08, 0.08, 0.09);

function safeText(value: string): string {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "").trim();
}

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = charcoal) {
  const clean = safeText(text);
  page.drawText(clean, { x: (PAGE_WIDTH - font.widthOfTextAtSize(clean, size)) / 2, y, font, size, color });
}

function fittedSize(text: string, font: PDFFont, maximum: number, maxWidth: number, minimum: number): number {
  let size = maximum;
  while (size > minimum && font.widthOfTextAtSize(safeText(text), size) > maxWidth) size -= 0.5;
  return size;
}

function drawImageFromTop(page: PDFPage, image: PDFImage, x: number, top: number, width: number, height: number) {
  page.drawImage(image, { x, y: PAGE_HEIGHT - top - height, width, height });
}

function drawDiamond(page: PDFPage, x: number, y: number, size: number) {
  page.drawSvgPath("M 0 4 L 4 0 L 8 4 L 4 8 Z", { x: x - size / 2, y: y - size / 2, scale: size / 8, color: gold });
}

function drawDecoratedRule(page: PDFPage, y: number, left: number, right: number, centerX: number) {
  page.drawLine({ start: { x: left, y }, end: { x: centerX - 9, y }, thickness: 0.65, color: gold });
  page.drawLine({ start: { x: centerX + 9, y }, end: { x: right, y }, thickness: 0.65, color: gold });
  drawDiamond(page, centerX - 5, y, 5);
  drawDiamond(page, centerX, y, 7);
  drawDiamond(page, centerX + 5, y, 5);
}

function drawMicrotextWatermark(page: PDFPage, font: PDFFont) {
  const text = "EduWrap";
  for (let y = 50, row = 0; y < PAGE_HEIGHT - 44; y += 7.5, row += 1) {
    for (let x = 34 + (row % 2) * 8; x < PAGE_WIDTH - 38; x += 16) {
      page.drawText(text, {
        x,
        y,
        font,
        size: 3,
        color: maroon,
        opacity: 0.04,
      });
    }
  }
}

function centeredMixedLine(
  page: PDFPage,
  parts: Array<{ text: string; font: PDFFont; color?: ReturnType<typeof rgb> }>,
  y: number,
  size: number,
) {
  const widths = parts.map(({ text, font }) => font.widthOfTextAtSize(text, size));
  let x = (PAGE_WIDTH - widths.reduce((total, width) => total + width, 0)) / 2;
  parts.forEach((part, index) => {
    page.drawText(part.text, { x, y, font: part.font, size, color: part.color || charcoal });
    x += widths[index];
  });
}

async function embedWebp(document: PDFDocument, relativePath: string): Promise<PDFImage> {
  const source = await readFile(path.join(process.cwd(), "public", ...relativePath.split("/")));
  return document.embedPng(await sharp(source).png().toBuffer());
}

export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  document.setTitle(`Certificate of Completion - ${safeText(data.studentName)}`);
  document.setAuthor(`${site.name} Computer Training Institute`);
  document.setSubject(`Certificate ${safeText(data.certificateNumber)}`);
  document.setCreationDate(data.completedAt);

  const page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const serif = await document.embedFont(StandardFonts.TimesRoman);
  const serifBold = await document.embedFont(StandardFonts.TimesRomanBold);

  const [background, isoBadge, logo, seal, directorSignature] = await Promise.all([
    embedWebp(document, "assets/images/certificate/certificate-background.webp"),
    embedWebp(document, "assets/images/certificate/iso-certified.webp"),
    embedWebp(document, "assets/images/logo-dark.webp"),
    embedWebp(document, "assets/images/certificate/completion-seal.webp"),
    embedWebp(document, "assets/images/certificate/director-signature.png"),
  ]);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: rgb(0.998, 0.996, 0.988) });
  page.drawImage(background, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });
  drawMicrotextWatermark(page, bold);

  page.drawText("Cert. No.", { x: 48, y: 682, font: regular, size: 10.5, color: charcoal });
  page.drawText(safeText(data.certificateNumber), { x: 48, y: 664, font: bold, size: 11.5, color: maroon });
  page.drawLine({ start: { x: 43, y: 649 }, end: { x: 87, y: 649 }, thickness: 0.7, color: gold });
  page.drawLine({ start: { x: 105, y: 649 }, end: { x: 146, y: 649 }, thickness: 0.7, color: gold });
  drawDiamond(page, 91, 649, 5); drawDiamond(page, 95, 649, 8); drawDiamond(page, 100, 649, 5);

  drawImageFromTop(page, isoBadge, 370, 65, 108, 72);
  drawImageFromTop(page, logo, 84, 164, 348, 77);

  centered(page, "C E R T I F I C A T E", 459, serif, 37, navy);
  centered(page, "OF COMPLETION", 423, serifBold, 17.5, maroon);
  page.drawLine({ start: { x: 79, y: 430 }, end: { x: 155, y: 430 }, thickness: 0.7, color: gold });
  page.drawLine({ start: { x: 357, y: 430 }, end: { x: 434, y: 430 }, thickness: 0.7, color: gold });
  drawDiamond(page, 151, 430, 5); drawDiamond(page, 361, 430, 5);

  centered(page, "This is to certify that", 389, regular, 12);
  const nameSize = fittedSize(data.studentName, serifBold, 30, PAGE_WIDTH - 115, 20);
  centered(page, data.studentName, 342, serifBold, nameSize, maroon);
  drawDecoratedRule(page, 312, 102, 410, PAGE_WIDTH / 2);

  centered(page, "has successfully completed the course", 286, regular, 11);
  const course = safeText(data.courseName);
  centered(page, course, 260, bold, fittedSize(course, bold, 12.5, PAGE_WIDTH - 105, 8.5), maroon);
  centeredMixedLine(page, [
    { text: "Course duration: ", font: regular },
    { text: safeText(data.courseDuration), font: bold, color: maroon },
  ], 243, 9.2);
  centeredMixedLine(page, [
    { text: "conducted by ", font: regular },
    { text: "EduWrap", font: bold, color: maroon },
    { text: " Computer Training Institute.", font: regular },
  ], 225, 10.3);
  centered(page, "We appreciate your dedication and commitment towards learning.", 205, regular, 9.5);

  page.drawImage(directorSignature, { x: 72.5, y: 143, width: 78, height: 44 });
  page.drawLine({ start: { x: 61, y: 140 }, end: { x: 162, y: 140 }, thickness: 0.65, color: gold });
  page.drawLine({ start: { x: 334, y: 140 }, end: { x: 435, y: 140 }, thickness: 0.65, color: gold });
  page.drawCircle({ x: 61, y: 140, size: 1.8, color: gold });
  page.drawCircle({ x: 162, y: 140, size: 1.8, color: gold });
  page.drawCircle({ x: 334, y: 140, size: 1.8, color: gold });
  page.drawCircle({ x: 435, y: 140, size: 1.8, color: gold });
  page.drawText("DIRECTOR", { x: 90, y: 124, font: bold, size: 8.5, color: maroon });
  page.drawText("COURSE COORDINATOR", { x: 339, y: 124, font: bold, size: 8.5, color: maroon });
  page.drawText("EduWrap Computer", { x: 73, y: 111, font: regular, size: 8.5, color: charcoal });
  page.drawText("Training Institute", { x: 79, y: 99, font: regular, size: 8.5, color: charcoal });
  page.drawText("EduWrap Computer", { x: 350, y: 111, font: regular, size: 8.5, color: charcoal });
  page.drawText("Training Institute", { x: 356, y: 99, font: regular, size: 8.5, color: charcoal });

  drawImageFromTop(page, seal, 202, 573, 108, 99);
  drawDecoratedRule(page, 86, 198, 314, PAGE_WIDTH / 2);
  centered(page, "Date of Completion", 64, regular, 8.5);
  centered(page, data.completedAt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }), 51, bold, 10.5, maroon);

  const addressSize = fittedSize(CERTIFICATE_ADDRESS, regular, 8.5, PAGE_WIDTH - 130, 6.5);
  const addressWidth = regular.widthOfTextAtSize(CERTIFICATE_ADDRESS, addressSize);
  const addressX = (PAGE_WIDTH - addressWidth) / 2 + 5;
  page.drawCircle({ x: addressX - 9, y: 34.5, size: 3.7, color: maroon });
  page.drawCircle({ x: addressX - 9, y: 35.2, size: 1.2, color: rgb(1, 1, 1) });
  page.drawSvgPath("M 0 0 L 6 0 L 3 -5 Z", { x: addressX - 12, y: 32.5, color: maroon });
  page.drawText(CERTIFICATE_ADDRESS, { x: addressX, y: 30, font: regular, size: addressSize, color: charcoal });

  return document.save();
}
