import "server-only";

const durationPattern = /^(\d+)([smhd])$/;

export function getMongoUri(): string {
  const value = process.env.MONGODB_URI?.trim();
  if (!value) throw new Error("MONGODB_URI is not configured.");
  return value;
}

export function getJwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }
  return new TextEncoder().encode(value);
}

export function getJwtExpiration(): { value: string; seconds: number } {
  const value = process.env.JWT_EXPIRES_IN?.trim() || "1d";
  const match = durationPattern.exec(value);
  if (!match) throw new Error("JWT_EXPIRES_IN must use s, m, h, or d (for example, 1d).");

  const amount = Number(match[1]);
  const multipliers = { s: 1, m: 60, h: 3_600, d: 86_400 } as const;
  const seconds = amount * multipliers[match[2] as keyof typeof multipliers];
  if (!Number.isSafeInteger(seconds) || seconds < 300 || seconds > 2_592_000) {
    throw new Error("JWT_EXPIRES_IN must be between 5 minutes and 30 days.");
  }
  return { value, seconds };
}

