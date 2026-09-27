import "server-only";
import { createHash } from "node:crypto";
import { connectMongoDB } from "@/lib/mongodb";
import { RateLimit } from "@/models/RateLimit";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function keyFor(scope: string, identity: string): string {
  return createHash("sha256").update(`${scope}:${identity}`).digest("hex");
}

export function requestIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

export async function checkRateLimit(scope: string, identity: string) {
  await connectMongoDB();
  const record = await RateLimit.findOne({ key: keyFor(scope, identity) }).lean();
  const now = Date.now();
  if (!record?.blockedUntil || record.blockedUntil.getTime() <= now) return { allowed: true as const };
  return {
    allowed: false as const,
    retryAfter: Math.max(1, Math.ceil((record.blockedUntil.getTime() - now) / 1000)),
  };
}

export async function recordRateLimitFailure(scope: string, identity: string): Promise<void> {
  await connectMongoDB();
  const key = keyFor(scope, identity);
  const now = new Date();
  const existing = await RateLimit.findOne({ key });
  const windowExpired = !existing || now.getTime() - existing.windowStartedAt.getTime() > WINDOW_MS;

  if (windowExpired) {
    await RateLimit.findOneAndUpdate(
      { key },
      { attempts: 1, windowStartedAt: now, expiresAt: new Date(now.getTime() + WINDOW_MS * 2), $unset: { blockedUntil: 1 } },
      { upsert: true },
    );
    return;
  }

  existing.attempts += 1;
  existing.expiresAt = new Date(now.getTime() + WINDOW_MS * 2);
  if (existing.attempts >= MAX_ATTEMPTS) existing.blockedUntil = new Date(now.getTime() + WINDOW_MS);
  await existing.save();
}

export async function clearRateLimit(scope: string, identity: string): Promise<void> {
  await connectMongoDB();
  await RateLimit.deleteOne({ key: keyFor(scope, identity) });
}

