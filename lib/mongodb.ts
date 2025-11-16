import mongoose, { Mongoose } from "mongoose";

/**
 * Cached connection object shape stored in the global scope.
 * This prevents creating multiple connections in development
 * when Next.js does hot reloading.
 */
interface MongooseGlobal {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Augment the NodeJS global type so TypeScript knows about our cached mongoose instance.
declare global {
  // eslint-disable-next-line no-var
  var mongooseGlobal: MongooseGlobal | undefined;
}

// Initialize the cached object on the global scope (for dev) or reuse if it already exists.
const cached: MongooseGlobal = global.mongooseGlobal ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseGlobal) {
  global.mongooseGlobal = cached;
}

/**
 * Establishes (or reuses) a Mongoose connection to MongoDB.
 *
 * This function is safe to call from any server-side environment in Next.js
 * (e.g. route handlers, server components, API routes).
 */
export async function connectToDatabase(): Promise<Mongoose> {
  // Ensure the MongoDB connection URI is defined.
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable in your environment.",
    );
  }

  // If an active connection already exists, reuse it.
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection promise is already in-flight, reuse it instead of creating a new one.
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      // Add common, production-safe options here when needed.
      // Example: serverSelectionTimeoutMS: 30_000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // If connection fails, reset the cached promise to allow future retries.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
