import bcrypt from "bcryptjs";
import { User, UserPublic } from "./types";

// Password hashing
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Simple session token generation (in production, use proper JWT or session management)
export function generateSessionToken(userId: string): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  return Buffer.from(`${userId}:${timestamp}:${randomPart}`).toString("base64");
}

export function parseSessionToken(token: string): { userId: string; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [userId, timestampStr] = decoded.split(":");
    const timestamp = parseInt(timestampStr, 10);
    
    if (!userId || isNaN(timestamp)) {
      return null;
    }
    
    // Check if token is expired (24 hours)
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - timestamp > expirationTime) {
      return null;
    }
    
    return { userId, timestamp };
  } catch {
    return null;
  }
}

export function validateUser(user: User | undefined | null): user is User {
  return user !== null && user !== undefined && typeof user.id === "string" && typeof user.email === "string";
}

// Convert User to UserPublic (removes sensitive data)
export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    age: user.age,
    createdAt: user.createdAt,
  };
}
