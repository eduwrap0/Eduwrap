import "server-only";
import nodemailer, { type SendMailOptions } from "nodemailer";
import { site } from "@/content/site";

type Attachment = NonNullable<SendMailOptions["attachments"]>[number];

interface RegistrationEmailInput {
  name: string;
  email: string;
  role: "student" | "faculty";
  studentId?: string;
  courses: string[];
}

interface FeeReceiptEmailInput {
  name: string;
  email: string;
  receiptId: string;
  amount: number;
  paymentDate: Date;
  paymentMode: "cash" | "upi" | "online";
  receipt: Uint8Array;
}

interface CompletionEmailInput {
  name: string;
  email: string;
  studentId?: string;
  courses: string[];
  completedAt: Date;
  certificateNumber: string;
  certificate: Uint8Array;
}

interface ContactEnquiryEmailInput {
  fullName: string;
  email: string;
  phone: string;
  course: string;
  submittedAt: Date;
}

function clean(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function portalUrl(role: "student" | "faculty"): string {
  return `${site.url.replace(/\/$/, "")}/login?role=${role}`;
}

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

function layout(title: string, greeting: string, content: string, action?: { label: string; url: string }): string {
  const actionHtml = action
    ? `<p style="margin:28px 0"><a href="${escapeHtml(action.url)}" style="background:#8c0529;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:700">${escapeHtml(action.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f7f3f4;font-family:Arial,sans-serif;color:#272124"><div style="max-width:620px;margin:0 auto;padding:28px 14px"><div style="background:#8c0529;color:#fff;padding:18px 24px;font-size:22px;font-weight:700">${escapeHtml(site.name)}</div><div style="background:#fff;padding:28px 24px;border:1px solid #eadde1"><h1 style="font-size:22px;margin:0 0 18px;color:#8c0529">${escapeHtml(title)}</h1><p>${escapeHtml(greeting)}</p>${content}${actionHtml}<p style="margin-top:28px">Regards,<br><strong>${escapeHtml(site.name)} Computer Training Institute</strong></p></div><div style="padding:16px 24px;color:#6f6468;font-size:12px">${escapeHtml(site.address)}<br>${escapeHtml(site.phone)} · ${escapeHtml(site.email)}</div></div></body></html>`;
}

function mailConfiguration(): { transporter: ReturnType<typeof nodemailer.createTransport>; from: string; replyTo: string } | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password) return null;

  const parsedPort = Number(process.env.SMTP_PORT || "587");
  const port = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65_535 ? parsedPort : 587;
  const secure = process.env.SMTP_SECURE?.trim().toLowerCase() === "true" || port === 465;
  const fromEmail = clean(process.env.SMTP_FROM_EMAIL?.trim() || user);
  const fromName = clean(process.env.SMTP_FROM_NAME?.trim() || site.name);
  return {
    transporter: nodemailer.createTransport({ host, port, secure, auth: { user, pass: password } }),
    from: `"${fromName.replace(/["\\]/g, "")}" <${fromEmail}>`,
    replyTo: site.email,
  };
}

async function sendSafely(message: Omit<SendMailOptions, "from">): Promise<boolean> {
  const configuration = mailConfiguration();
  if (!configuration) {
    console.warn(JSON.stringify({ type: "email_skipped", reason: "smtp_not_configured" }));
    return false;
  }
  try {
    await configuration.transporter.sendMail({ replyTo: configuration.replyTo, ...message, from: configuration.from });
    return true;
  } catch (error) {
    console.error(JSON.stringify({ type: "email_delivery_error", name: error instanceof Error ? error.name : "UnknownError" }));
    return false;
  }
}

export async function sendContactEnquiryEmail(input: ContactEnquiryEmailInput): Promise<boolean> {
  const recipient = clean(process.env.CONTACT_EMAIL?.trim() || "eduwrap0@gmail.com");
  const submittedAt = input.submittedAt.toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kolkata" });
  const details = [
    `Name: ${input.fullName}`,
    `Phone: ${input.phone}`,
    `Email: ${input.email || "Not provided"}`,
    `Course: ${input.course || "Not selected"}`,
    `Submitted: ${submittedAt}`,
  ];
  const content = `<p>A new course enquiry was submitted on the EduWrap website.</p><div style="background:#faf7f8;border-left:4px solid #b27a16;padding:12px 16px">${details.map((line) => `<div style="margin:5px 0">${escapeHtml(line)}</div>`).join("")}</div>`;
  return sendSafely({
    to: recipient,
    ...(input.email ? { replyTo: clean(input.email) } : {}),
    subject: `New course enquiry from ${clean(input.fullName)}`,
    text: ["A new course enquiry was submitted on the EduWrap website.", ...details].join("\n\n"),
    html: layout("New course enquiry", "Hello EduWrap team,", content),
  });
}

export async function sendRegistrationEmail(input: RegistrationEmailInput): Promise<boolean> {
  const roleLabel = input.role === "student" ? "Student" : "Faculty";
  const url = portalUrl(input.role);
  const details = [
    input.studentId ? `Student ID: ${input.studentId}` : undefined,
    `Registered email: ${input.email}`,
    input.courses.length ? `Courses: ${input.courses.join(", ")}` : undefined,
  ].filter((value): value is string => Boolean(value));
  const content = `<p>Your ${roleLabel.toLowerCase()} account has been created successfully.</p><div style="background:#faf7f8;border-left:4px solid #b27a16;padding:12px 16px">${details.map((line) => `<div style="margin:5px 0">${escapeHtml(line)}</div>`).join("")}</div><p>Use the email address above and the password provided to you by the institute to sign in.</p>`;
  return sendSafely({
    to: input.email,
    subject: `${site.name} ${roleLabel} Account Created`,
    text: [`Hello ${input.name},`, `Your ${roleLabel.toLowerCase()} account has been created successfully.`, ...details, `Sign in: ${url}`, `Regards, ${site.name}`].join("\n\n"),
    html: layout(`${roleLabel} account created`, `Hello ${input.name},`, content, { label: `Open ${roleLabel} Portal`, url }),
  });
}

export async function sendFeeReceiptEmail(input: FeeReceiptEmailInput): Promise<boolean> {
  const amount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(input.amount);
  const mode = input.paymentMode === "upi" ? "UPI" : input.paymentMode.charAt(0).toUpperCase() + input.paymentMode.slice(1);
  const details = [`Receipt number: ${input.receiptId}`, `Amount paid: ${amount}`, `Payment date: ${formatDate(input.paymentDate)}`, `Payment mode: ${mode}`];
  const content = `<p>We have received your fee payment. Your official receipt is attached to this email.</p><div style="background:#faf7f8;border-left:4px solid #b27a16;padding:12px 16px">${details.map((line) => `<div style="margin:5px 0">${escapeHtml(line)}</div>`).join("")}</div>`;
  const filename = `EduWrap-Fee-Receipt-${input.receiptId.replace(/[^a-zA-Z0-9_-]+/g, "-")}.pdf`;
  const attachments: Attachment[] = [{ filename, content: Buffer.from(input.receipt), contentType: "application/pdf" }];
  return sendSafely({
    to: input.email,
    subject: `${site.name} Fee Receipt ${clean(input.receiptId)}`,
    text: [`Hello ${input.name},`, "We have received your fee payment. Your official receipt is attached.", ...details, `Regards, ${site.name}`].join("\n\n"),
    html: layout("Fee payment received", `Hello ${input.name},`, content),
    attachments,
  });
}

export async function sendCompletionEmail(input: CompletionEmailInput): Promise<boolean> {
  const url = `${site.url.replace(/\/$/, "")}/verify-certificate`;
  const details = [
    input.studentId ? `Student ID: ${input.studentId}` : undefined,
    input.courses.length ? `Course: ${input.courses.join(", ")}` : undefined,
    `Completion date: ${formatDate(input.completedAt)}`,
    `Certificate number: ${input.certificateNumber}`,
  ].filter((value): value is string => Boolean(value));
  const content = `<p>Congratulations on successfully completing your course. Your official completion certificate is attached.</p><div style="background:#faf7f8;border-left:4px solid #b27a16;padding:12px 16px">${details.map((line) => `<div style="margin:5px 0">${escapeHtml(line)}</div>`).join("")}</div>`;
  const filename = `EduWrap-Certificate-${(input.studentId || input.name).replace(/[^a-zA-Z0-9_-]+/g, "-")}.pdf`;
  const attachments: Attachment[] = [{ filename, content: Buffer.from(input.certificate), contentType: "application/pdf" }];
  return sendSafely({
    to: input.email,
    subject: `Congratulations on Completing Your Course at ${site.name}`,
    text: [`Hello ${input.name},`, "Congratulations on successfully completing your course. Your official certificate is attached.", ...details, `Verify certificate: ${url}`, `Regards, ${site.name}`].join("\n\n"),
    html: layout("Course completed — congratulations!", `Hello ${input.name},`, content, { label: "Verify Certificate", url }),
    attachments,
  });
}
