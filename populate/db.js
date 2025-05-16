import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);
let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db();
  }
}

export function getDB() {
  if (!db) {
    throw new Error("❌ Database not initialized. Call connectDB() first.");
  }
  return db;
}
