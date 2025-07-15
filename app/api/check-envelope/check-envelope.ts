import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  const { fid } = await request.json();
  if (!fid) return NextResponse.json({ error: 'Missing fid' }, { status: 400 });

  const { db } = await connectToDatabase();
  const users = db.collection('players');

  const user = await users.findOne({ fid });
  return NextResponse.json({ claimed: !!(user && user.envelopeClaimed) });
} 