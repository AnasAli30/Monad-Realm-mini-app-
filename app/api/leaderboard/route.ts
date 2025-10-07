import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { keccak256, toUtf8Bytes } from 'ethers';
import {connectToDatabase} from "@/lib/mongodb"

// MongoDB connection

interface PlayerDocument {
  _id?: string;
  fid: number;
  username: string;
  pfpUrl?: string;
  games: {
    [gameName: string]: {
      score: number;
      level?: number;
      time?: string;
      stonesDestroyed?: number;
      playerHits?: number;
      lastPlayed: Date;
      currentSeason?: { score: number }; // Added for new season tracking
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// GET - Retrieve leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get('game') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    const database = await connectToDatabase();
    const collection: Collection<PlayerDocument> = database.db.collection('players');

    let pipeline: any[] = [];

    if (game === 'all') {
      // Get best score across all games for each player
      pipeline = [
        {
          $project: {
            fid: 1,
            username: 1,
            pfpUrl: 1,
            bestGame: {
              $reduce: {
                input: { $objectToArray: '$games' },
                initialValue: { score: 0, game: '', data: {} },
                in: {
                  $cond: {
                    if: { $gt: ['$$this.v.score', '$$value.score'] },
                    then: {
                      score: '$$this.v.score',
                      game: '$$this.k',
                      data: '$$this.v'
                    },
                    else: '$$value'
                  }
                }
              }
            }
          }
        },
        { $match: { 'bestGame.score': { $gt: 0 } } },
        { $sort: { 'bestGame.score': -1 } },
        { $limit: limit }
      ];
    } else {
      // Get leaderboard for specific game
      pipeline = [
        { $match: { [`games.${game}.currentSeason.score`]: { $exists: true, $ne: null } } },
        {
          $project: {
            fid: 1,
            username: 1,
            pfpUrl: 1,
            gameData: `$games.${game}`,
            score: `$games.${game}.currentSeason.score`
          }
        },
        { $sort: { score: -1 } },
        { $limit: limit }
      ];
    }

    const leaderboard = await collection.aggregate(pipeline).toArray();

    return NextResponse.json({
      success: true,
      data: leaderboard,
      count: leaderboard.length
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

// POST - Submit new score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, username, pfpUrl, score, game, gameData, randomKey, fusedKey } = body;
    console.log(body);
    // Verification logic
    if (!randomKey || !fusedKey) {
      return NextResponse.json({ success: false, error: 'Missing verification keys' }, { status: 400 });
    }
    const verificationSecret = process.env.NEXT_PUBLIC_VERIFICATION_SECRET || "";
    // Fuse secret with randomKey, score, and fid for extra security (must match client)
    const scoreStr = score !== undefined ? String(score) : '';
    const fidStr = fid !== undefined ? String(fid) : '';
    const expectedFusedKey = keccak256(toUtf8Bytes(randomKey + verificationSecret + scoreStr + fidStr));
    if (fusedKey !== expectedFusedKey) {
      return NextResponse.json({ success: false, error: 'Invalid verification key' }, { status: 403 });
    }

    const database = await connectToDatabase();
    // Check fusedKey in DB
    const fusedKeyCollection = database.db.collection('usedFusedKeys');
    const existingFusedKey = await fusedKeyCollection.findOne({ fusedKey });
    if (existingFusedKey) {
      return NextResponse.json({ success: false, error: 'used' }, { status: 409 });
    }
    // Save fusedKey to DB
    await fusedKeyCollection.insertOne({ fusedKey, createdAt: new Date() });
    // Optionally: periodically clear old keys or use a TTL index in production

    // Validation
    if (!fid || !username || typeof score !== 'number' || !game) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fid, username, score, game' },
        { status: 400 }
      );
    }

    const collection: Collection<PlayerDocument> = database.db.collection('players');

    // Sanitize inputs
    const sanitizedScore = Math.max(0, Math.floor(score));
    const sanitizedGame = game.toString().trim();
    const sanitizedUsername = username.toString().trim().substring(0, 50);

    // Prepare game data
    const newGameData = {
      score: sanitizedScore,
      lastPlayed: new Date(),
      ...gameData
    };

    // Try to find existing player
    const existingPlayer = await collection.findOne({ fid });

    // Ensure games object exists
    let playerGames = existingPlayer?.games || {};
    const currentGameData = playerGames[sanitizedGame] || {};
    const currentSeasonData = currentGameData.currentSeason || { score: 0 };
    const allTimeBestScore = currentGameData.score || 0;

    // Check if new score is better than current season
    const shouldUpdateSeason = !currentSeasonData.score || sanitizedScore > currentSeasonData.score;
    // Check if new score is better than all-time best
    const shouldUpdateAllTime = !allTimeBestScore || sanitizedScore > allTimeBestScore;

    if (existingPlayer) {
      // Build update object
      const updateObj: any = {
        username: sanitizedUsername,
        pfpUrl: pfpUrl || existingPlayer.pfpUrl,
        updatedAt: new Date(),
      };
      if (shouldUpdateSeason) {
        updateObj[`games.${sanitizedGame}.currentSeason`] = newGameData;
      }
      if (shouldUpdateAllTime) {
        updateObj[`games.${sanitizedGame}.score`] = sanitizedScore;
        // Optionally update other all-time fields
        if (gameData?.level !== undefined) updateObj[`games.${sanitizedGame}.level`] = gameData.level;
        if (gameData?.time !== undefined) updateObj[`games.${sanitizedGame}.time`] = gameData.time;
        if (gameData?.stonesDestroyed !== undefined) updateObj[`games.${sanitizedGame}.stonesDestroyed`] = gameData.stonesDestroyed;
        if (gameData?.playerHits !== undefined) updateObj[`games.${sanitizedGame}.playerHits`] = gameData.playerHits;
        updateObj[`games.${sanitizedGame}.lastPlayed`] = new Date();
      }
      if (shouldUpdateSeason || shouldUpdateAllTime) {
        await collection.updateOne(
          { fid },
          { $set: updateObj }
        );
      }

      // Get player's rank for this game (all-time best)
      const rank = await collection.countDocuments({
        [`games.${sanitizedGame}.score`]: { $gt: sanitizedScore }
      }) + 1;

      return NextResponse.json({
        success: true,
        data: {
          fid,
          username: sanitizedUsername,
          pfpUrl: pfpUrl || existingPlayer.pfpUrl,
          score: sanitizedScore,
          game: sanitizedGame,
          rank
        }
      });
    } else {
      // Player does not exist, create new player with this game entry
      const newPlayer: PlayerDocument = {
        fid,
        username: sanitizedUsername,
        pfpUrl: pfpUrl || '',
        games: {
          [sanitizedGame]: {
            ...newGameData,
            currentSeason: newGameData // Initialize currentSeason with first score
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await collection.insertOne(newPlayer);
      return NextResponse.json({ success: true, data: { fid, username: sanitizedUsername, pfpUrl: pfpUrl || '', score: sanitizedScore, game: sanitizedGame, rank: 1 } });
    }

  } catch (error) {
    console.error('Error submitting score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}
