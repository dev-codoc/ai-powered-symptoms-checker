import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || "symptom_checker";

if (!MONGODB_URI) {
  throw new Error('Missing environment variable: "MONGO_URI"');
}

let mongouri = MONGODB_URI as string;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // ✅ TypeScript now knows MONGODB_URI is a string (checked above)
  const client = new MongoClient(mongouri);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw new Error("Failed to connect to database");
  }
}

export const COLLECTIONS = {
  USERS: "users",
  SYMPTOMS: "symptom_submissions",
} as const;

export async function getCollection<T extends object>(collectionName: string) {
  const { db } = await connectToDatabase();
  return db.collection<T>(collectionName);
}