import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { getJwtSecret } from "@/lib/env";

const issuer = "eduwrap-contact-form";
const audience = "eduwrap-contact-captcha";

type CaptchaPayload = { first: number; second: number };

export async function createContactCaptcha(): Promise<{ question: string; token: string }> {
  const first = randomInteger(3, 10);
  const second = randomInteger(1, first);
  const token = await new SignJWT({ first, second })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getJwtSecret());

  return { question: `${first} - ${second} = ?`, token };
}

export async function verifyContactCaptcha(token: string, answer: unknown): Promise<boolean> {
  if (!token || !/^\d{1,2}$/.test(String(answer ?? "").trim())) return false;

  try {
    const { payload } = await jwtVerify<CaptchaPayload>(token, getJwtSecret(), { issuer, audience });
    return Number(answer) === payload.first - payload.second;
  } catch {
    return false;
  }
}

function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
