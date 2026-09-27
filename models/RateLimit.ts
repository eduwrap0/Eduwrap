import mongoose, { Schema, type Model } from "mongoose";

interface IRateLimit {
  key: string;
  attempts: number;
  windowStartedAt: Date;
  blockedUntil?: Date;
  expiresAt: Date;
}

const rateLimitSchema = new Schema<IRateLimit>(
  {
    key: { type: String, required: true, unique: true },
    attempts: { type: Number, required: true, default: 0 },
    windowStartedAt: { type: Date, required: true },
    blockedUntil: Date,
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit || mongoose.model<IRateLimit>("RateLimit", rateLimitSchema);

