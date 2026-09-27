import "server-only";
import mongoose, { type Mongoose } from "mongoose";
import { setServers } from "node:dns";
import { getMongoUri } from "@/lib/env";

interface MongooseCache {
  connection: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache = global.mongooseCache ?? { connection: null, promise: null };
global.mongooseCache = cache;

function configureDnsServers(): void {
  const servers = process.env.MONGODB_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);
  if (servers?.length) setServers(servers);
}

export async function connectMongoDB(): Promise<Mongoose> {
  if (cache.connection) return cache.connection;

  if (!cache.promise) {
    configureDnsServers();
    cache.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}
