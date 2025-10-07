import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

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
    const { fid } = await request.json();
    if (!fid) return NextResponse.json({ error: 'Missing fid' }, { status: 400 });

    const { db } = await connectToDatabase();
    const players = db.collection('players');

    const now = new Date();
    const user = await players.findOne({ fid: Number(fid) });

    const baseState = GAMES.reduce((acc, game) => {
      acc[game] = {
        claimed: 0,
        limit: LIMIT_PER_GAME,
        windowHours: WINDOW_HOURS,
        resetsAt: getResetTime(now),
      };
      return acc;
    }, {} as Record<GameKey, { claimed: number; limit: number; windowHours: number; resetsAt: Date }>);

    let dailyGifts = user?.dailyGifts as typeof baseState | undefined;

    // Initialize if missing
    if (!dailyGifts) {
      dailyGifts = baseState;
      await players.updateOne(
        { fid: Number(fid) },
        { $set: { dailyGifts } },
        { upsert: true }
      );
    }

    // Reset if window passed
    let changed = false;
    for (const game of GAMES) {
      const g = dailyGifts[game];
      const resetsAt = new Date(g.resetsAt);
      if (now >= resetsAt) {
        dailyGifts[game] = {
          claimed: 0,
          limit: LIMIT_PER_GAME,
          windowHours: WINDOW_HOURS,
          resetsAt: getResetTime(now),
        };
        changed = true;
      }
    }
    if (changed) {
      await players.updateOne(
        { fid: Number(fid) },
        { $set: { dailyGifts } }
      );
    }

    const responsePerGame = Object.fromEntries(
      GAMES.map((game) => {
        const g = dailyGifts![game];
        const resetsAt = new Date(g.resetsAt);
        const remaining = Math.max(0, g.limit - g.claimed);
        const msLeft = Math.max(0, resetsAt.getTime() - now.getTime());
        return [game, {
          claimed: g.claimed,
          limit: g.limit,
          remaining,
          resetsAt,
          msLeft,
          windowHours: g.windowHours,
        }];
      })
    );

    const totals = Object.values(responsePerGame).reduce((acc: { remaining: number; limit: number; claimed: number }, g: any) => {
      acc.claimed += g.claimed;
      acc.limit += g.limit;
      acc.remaining += g.remaining;
      return acc;
    }, { claimed: 0, limit: 0, remaining: 0 });

    return NextResponse.json({
      success: true,
      perGame: responsePerGame,
      totals,
      now,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


