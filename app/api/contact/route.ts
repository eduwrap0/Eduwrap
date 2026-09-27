import { NextResponse } from "next/server";
import { createContactCaptcha, verifyContactCaptcha } from "@/lib/contact-captcha";
import { sendContactEnquiryEmail } from "@/lib/email";

const phonePattern = /^\d{10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.com$/i;

export async function GET() {
  try {
    return NextResponse.json(await createContactCaptcha(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Captcha is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const fullName = String(body.fullName || "").trim().slice(0, 100);
  const email = String(body.email || "").trim().slice(0, 200);
  const phone = String(body.phone || "").replace(/\D/g, "");
  const course = String(body.course || "").trim().slice(0, 100);
  const captchaToken = String(body.captchaToken || "");

  if (fullName.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 422 });
  if (!phonePattern.test(phone)) return NextResponse.json({ error: "Phone number must contain exactly 10 digits." }, { status: 422 });
  if (email && !emailPattern.test(email)) return NextResponse.json({ error: "Email must include @ and end with .com." }, { status: 422 });
  if (!(await verifyContactCaptcha(captchaToken, body.captchaAnswer))) {
    return NextResponse.json({ error: "Please solve the new security question.", code: "INVALID_CAPTCHA" }, { status: 422 });
  }

  const sent = await sendContactEnquiryEmail({ fullName, email, phone, course, submittedAt: new Date() });
  if (!sent) return NextResponse.json({ error: "We could not send your request. Please call or WhatsApp us." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
