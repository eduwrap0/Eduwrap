import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import sharp from "sharp";

export interface FeeReceiptData {
  receiptId: string;
  studentId: string;
  studentName: string;
  fatherName?: string;
  studentPhone?: string;
  courses: string[];
  paymentDate: Date;
  amount: number;
  paymentMode: "cash" | "upi" | "online";
  recordedBy: string;
  generatedAt: Date;
}

const maroon = rgb(0.55, 0.02, 0.16);
const gold = rgb(0.7, 0.44, 0.09);
const ink = rgb(0.14, 0.12, 0.14);
const muted = rgb(0.43, 0.39, 0.42);
const pale = rgb(0.985, 0.967, 0.973);

function safeText(value: string): string {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "").trim() || "Not provided";
}

function fit(text: string, font: PDFFont, maximum: number, width: number, minimum = 7): number {
  let size = maximum;
  while (size > minimum && font.widthOfTextAtSize(safeText(text), size) > width) size -= 0.5;
  return size;
}

function field(page: PDFPage, regular: PDFFont, bold: PDFFont, label: string, value: string, x: number, y: number, width: number) {
  page.drawText(label.toUpperCase(), { x, y, font: bold, size: 7.8, color: muted });
  const clean = safeText(value);
  page.drawText(clean, { x, y: y - 17, font: regular, size: fit(clean, regular, 11, width), color: ink });
}

export async function generateFeeReceiptPdf(data: FeeReceiptData): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  document.setTitle(`Fee Receipt - ${safeText(data.receiptId)}`);
  document.setAuthor("EduWrap");
  document.setSubject(`Fee payment receipt for ${safeText(data.studentName)}`);
  document.setCreationDate(data.generatedAt);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  // ISO A5 portrait dimensions in PDF points.
  const page = document.addPage([419.53, 595.28]);
  const { width, height } = page.getSize();

  page.drawRectangle({ x: 14, y: 14, width: width - 28, height: height - 28, color: rgb(1, 0.998, 0.993), borderColor: maroon, borderWidth: 1.6 });
  page.drawRectangle({ x: 19, y: 19, width: width - 38, height: height - 38, borderColor: gold, borderWidth: 0.55 });
  try {
    const logoPath = path.join(process.cwd(), "public", "assets", "images", "logo-dark.webp");
    const logo = await document.embedPng(await sharp(await readFile(logoPath)).png().toBuffer());
    const scaled = logo.scaleToFit(145, 49);
    page.drawImage(logo, { x: 30, y: height - 74, width: scaled.width, height: scaled.height });
  } catch {
    page.drawText("EduWrap", { x: 30, y: height - 55, font: bold, size: 22, color: maroon });
  }

  const receiptTitle = "FEE RECEIPT";
  const receiptTitleSize = 20;
  const receiptTitleX = width - 30 - bold.widthOfTextAtSize(receiptTitle, receiptTitleSize);
  page.drawText(receiptTitle, { x: receiptTitleX, y: height - 49, font: bold, size: receiptTitleSize, color: maroon });
  const instituteLabel = "COMPUTER TRAINING INSTITUTE";
  page.drawText(instituteLabel, { x: width - 30 - bold.widthOfTextAtSize(instituteLabel, 7.5), y: height - 65, font: bold, size: 7.5, color: ink });
  page.drawLine({ start: { x: 30, y: height - 84 }, end: { x: width - 30, y: height - 84 }, thickness: 1, color: gold });
  page.drawText("2nd Floor, SCO-4, Balaji Enclave, Patiala Rd, Badal Colony,", { x: 30, y: height - 101, font: regular, size: 8.2, color: muted });
  page.drawText("Utrathiya, Zirakpur, Punjab 140603", { x: 30, y: height - 114, font: regular, size: 8.2, color: muted });
  page.drawText("Phone: 7740009619, 9996299619", { x: 30, y: height - 127, font: bold, size: 8.2, color: ink });

  page.drawRectangle({ x: 30, y: height - 184, width: width - 60, height: 40, color: pale, borderColor: rgb(0.9, 0.82, 0.85), borderWidth: 0.5 });
  page.drawText("RECEIPT NUMBER", { x: 41, y: height - 160, font: bold, size: 7.8, color: muted });
  page.drawText(safeText(data.receiptId), { x: 41, y: height - 176, font: bold, size: 11, color: maroon });
  page.drawText("PAYMENT DATE", { x: width - 150, y: height - 160, font: bold, size: 7.8, color: muted });
  page.drawText(data.paymentDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }), { x: width - 150, y: height - 176, font: regular, size: 10, color: ink });

  field(page, regular, bold, "Student name", data.studentName, 35, height - 213, 165);
  field(page, regular, bold, "Student ID", data.studentId, 220, height - 213, 164);
  field(page, regular, bold, "Father's name", data.fatherName || "Not provided", 35, height - 254, 165);
  field(page, regular, bold, "Student phone", data.studentPhone || "Not provided", 220, height - 254, 164);
  field(page, regular, bold, "Course", data.courses.join(", ") || "Not provided", 35, height - 295, 349);
  page.drawLine({ start: { x: 30, y: height - 328 }, end: { x: width - 30, y: height - 328 }, thickness: 0.55, color: rgb(0.82, 0.78, 0.8) });

  page.drawText("PAYMENT DETAILS", { x: 35, y: height - 349, font: bold, size: 9, color: maroon });
  page.drawRectangle({ x: 30, y: height - 433, width: width - 60, height: 66, color: rgb(0.997, 0.993, 0.984), borderColor: rgb(0.86, 0.82, 0.79), borderWidth: 0.6 });
  field(page, regular, bold, "Payment mode", data.paymentMode === "upi" ? "UPI" : data.paymentMode.charAt(0).toUpperCase() + data.paymentMode.slice(1), 41, height - 387, 105);
  field(page, regular, bold, "Status", "Paid", 157, height - 387, 70);
  page.drawText("AMOUNT PAID", { x: 250, y: height - 387, font: bold, size: 7.8, color: muted });
  const amount = `INR ${data.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  page.drawText(amount, { x: 250, y: height - 414, font: bold, size: fit(amount, bold, 19, 134, 12), color: maroon });

  field(page, regular, bold, "Recorded by", data.recordedBy, 35, height - 462, 165);
  field(page, regular, bold, "Generated on", data.generatedAt.toLocaleString("en-IN"), 220, height - 462, 164);
  page.drawRectangle({ x: 30, y: height - 518, width: width - 60, height: 34, color: rgb(1, 0.96, 0.89), borderColor: gold, borderWidth: 0.6 });
  page.drawText("Fees once paid are non-refundable.", { x: 41, y: height - 505, font: bold, size: 9.5, color: maroon });
  page.drawLine({ start: { x: width - 162, y: 50 }, end: { x: width - 30, y: 50 }, thickness: 0.7, color: muted });
  page.drawText("DIRECTOR SIGNATURE", { x: width - 142, y: 34, font: bold, size: 8.2, color: ink });
  page.drawText("Thank you for choosing EduWrap.", { x: 30, y: 34, font: bold, size: 8.2, color: maroon });

  return document.save();
}
