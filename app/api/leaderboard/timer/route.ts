import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'monad-realm';

let client: MongoClient;
let db: any;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  }
  return db;
}

export async function GET(request: NextRequest) {
  try {
    const objectId = "686aba24a8c9e9ed61f288dc";
    const database = await connectToDatabase();
    const collection = database.collection('data');
    const doc = await collection.findOne({ game: "monadrealm" });
    // console.log(doc);
    if (!doc ) {
      return NextResponse.json({ success: false, error: 'Timer not found' }, { status: 404 });
    }
    return NextResponse.json({ timer: "1754241350" , success: true});
  } catch (error) {
    console.error('Error fetching timer:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch timer' }, { status: 500 });
  }
} 