import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

type GameKey = 'Candy Crush' | 'Bounce Blaster' | 'Monad Jump';

const GAMES: GameKey[] = ['Candy Crush', 'Bounce Blaster', 'Monad Jump'];

export async function POST(request: NextRequest) {
  try {
    const { fid } = await request.json();
    if (!fid) return NextResponse.json({ error: 'Missing fid' }, { status: 400 });

    const { db } = await connectToDatabase();
    const players = db.collection('players');
    const user = await players.findOne({ fid: Number(fid) });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const profile = {
      fid: user.fid,
      username: user.username || user.name,
      pfpUrl: user.pfpUrl,
      walletAddress: user.walletAddress,
    };

    const games: Record<string, { score: number }> = {};
    for (const g of GAMES) {
      games[g] = { score: user?.games?.[g]?.score ?? 0 };
    }

    const dailyGifts = user.dailyGifts || {};

    return NextResponse.json({ success: true, profile, games, dailyGifts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


