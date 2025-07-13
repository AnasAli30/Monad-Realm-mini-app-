import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'monad-realm';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  }
  if (!db) {
    throw new Error('Database is undefined after connection attempt');
  }
  return { db };
} 