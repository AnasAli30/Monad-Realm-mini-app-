import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, Db, Collection } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'monad-realm';

let client: MongoClient;
let db: Db;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  }
  return db;
}

interface UserInfoDocument {
  fid: number;
  name?: string;
  username?: string;
  pfpUrl?: string;
  walletAddress?: string;
  updatedAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, name, username, pfpUrl, walletAddress } = body;

    if (!fid) {
      return NextResponse.json({ success: false, error: 'Missing fid' }, { status: 400 });
    }

    const database = await connectToDatabase();
    const collection: Collection<UserInfoDocument> = database.collection('players');

    const updateDoc: Partial<UserInfoDocument> = {
      updatedAt: new Date(),
    };
    if (name) updateDoc.name = name;
    if (username) updateDoc.username = username;
    if (pfpUrl) updateDoc.pfpUrl = pfpUrl;
    if (walletAddress) updateDoc.walletAddress = walletAddress;

    // Upsert user info by fid
    await collection.updateOne(
      { fid },
      { $set: updateDoc },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing user info:', error);
    return NextResponse.json({ success: false, error: 'Failed to store user info' }, { status: 500 });
  }
} 