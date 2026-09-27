import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { setServers } from "node:dns";
import { z } from "zod";

loadEnvConfig(process.cwd());

const seedEnvironmentSchema = z.object({
  MONGODB_URI: z.string().trim().min(1),
  MONGODB_DNS_SERVERS: z.string().trim().optional(),
  ADMIN_NAME: z.string().trim().min(2).max(100),
  ADMIN_EMAIL: z.string().trim().toLowerCase().email().max(254),
  ADMIN_PASSWORD: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

async function seedAdmin() {
  const environment = seedEnvironmentSchema.parse(process.env);
  const dnsServers = environment.MONGODB_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);
  if (dnsServers?.length) setServers(dnsServers);

  const { User } = await import("@/models/User");
  await mongoose.connect(environment.MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
  });

  const existing = await User.findOne({ email: environment.ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== "admin") throw new Error("The configured admin email belongs to a non-admin account.");
    console.info("Admin account already exists; no changes were made.");
    return;
  }

  const password = await bcrypt.hash(environment.ADMIN_PASSWORD, 12);
  await User.create({
    name: environment.ADMIN_NAME,
    email: environment.ADMIN_EMAIL,
    password,
    role: "admin",
    isActive: true,
  });
  console.info("Initial admin account created successfully.");
}

function formatSeedError(error: unknown): string {
  if (!(error instanceof Error)) return "Unknown error.";

  return error.message.replace(/(mongodb(?:\+srv)?:\/\/)[^@\s]+@/gi, "$1<credentials>@");
}

seedAdmin()
  .catch((error: unknown) => {
    console.error(`Admin seed failed: ${formatSeedError(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
