import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ethers } from 'ethers';
import { getRandomValue, getTokenAddress, getTokenDecimals, rewardTypes } from '@/lib/rewards';

type GameKey = 'Candy Crush' | 'Bounce Blaster' | 'Monad Jump';

const GAMES: GameKey[] = ['Candy Crush', 'Bounce Blaster', 'Monad Jump'];
const WINDOW_HOURS = 12;
const LIMIT_PER_GAME = 5;

function getResetTime(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(d.getHours() + WINDOW_HOURS);
  return d;
}

export async function POST(request: NextRequest) {
  try {
    const { fid, game } = await request.json() as { fid: number; game: GameKey };
    if (!fid || !game) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    if (!GAMES.includes(game)) return NextResponse.json({ error: 'Invalid game' }, { status: 400 });

    const { db } = await connectToDatabase();
    const players = db.collection('players');
    const now = new Date();

    const user = await players.findOne({ fid: Number(fid) });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Initialize dailyGifts if missing
    const dailyGifts = user.dailyGifts || GAMES.reduce((acc, g) => {
      acc[g] = { claimed: 0, limit: LIMIT_PER_GAME, windowHours: WINDOW_HOURS, resetsAt: getResetTime(now) };
      return acc;
    }, {} as Record<GameKey, { claimed: number; limit: number; windowHours: number; resetsAt: Date }>);

    // Reset if expired
    let changed = false;
    for (const g of GAMES) {
      const info = dailyGifts[g];
      const resetsAt = new Date(info.resetsAt);
      if (now >= resetsAt) {
        dailyGifts[g] = { claimed: 0, limit: LIMIT_PER_GAME, windowHours: WINDOW_HOURS, resetsAt: getResetTime(now) };
        changed = true;
      }
    }
    if (changed) {
      await players.updateOne({ fid: Number(fid) }, { $set: { dailyGifts } });
    }

    // Check availability
    const entry = dailyGifts[game];
    if (entry.claimed >= entry.limit) {
      const msLeft = Math.max(0, new Date(entry.resetsAt).getTime() - now.getTime());
      return NextResponse.json({ error: 'No gifts left in this window', msLeft }, { status: 429 });
    }

    // Determine reward
    const rewardType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
    const amount = getRandomValue(rewardType);
    const tokenAddress = getTokenAddress(rewardType as any);
    const decimals = getTokenDecimals(rewardType as any);

    // Increment atomically
    const res = await players.updateOne(
      { fid: Number(fid), [`dailyGifts.${game}.claimed`]: { $lt: LIMIT_PER_GAME } },
      { $inc: { [`dailyGifts.${game}.claimed`]: 1 }, $setOnInsert: { [`dailyGifts.${game}.resetsAt`]: getResetTime(now) } },
      { upsert: true }
    );
    if (res.matchedCount === 0 && res.upsertedCount === 0 && res.modifiedCount === 0) {
      return NextResponse.json({ error: 'Claim race condition, try again' }, { status: 409 });
    }

    // Determine best score for this game to satisfy /api/generate verification
    const bestScore = user?.games?.[game]?.score ?? 0;

    // Return claim payload for client to request signature via /api/generate
    return NextResponse.json({
      success: true,
      reward: { token: rewardType, amount, tokenAddress, decimals },
      window: { resetsAt: dailyGifts[game].resetsAt, claimed: entry.claimed + 1, limit: entry.limit },
      bestScore,
      game
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


