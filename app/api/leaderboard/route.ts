import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, Db, Collection } from 'mongodb';

// MongoDB connection
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
    const collection: Collection<PlayerDocument> = database.collection('players');

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
        { $match: { [`games.${game}`]: { $exists: true } } },
        {
          $project: {
            fid: 1,
            username: 1,
            pfpUrl: 1,
            gameData: `$games.${game}`,
            score: `$games.${game}.score`
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
    const { fid, username, pfpUrl, score, game, gameData } = body;

    // Validation
    if (!fid || !username || typeof score !== 'number' || !game) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fid, username, score, game' },
        { status: 400 }
      );
    }

    const database = await connectToDatabase();
    const collection: Collection<PlayerDocument> = database.collection('players');

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

    if (existingPlayer) {
      // Check if new score is better than existing score
      const currentGameData = existingPlayer.games[sanitizedGame];
      const shouldUpdate = !currentGameData || sanitizedScore > currentGameData.score;

      if (shouldUpdate) {
        // Update player with new best score
        const result = await collection.updateOne(
          { fid },
          {
            $set: {
              username: sanitizedUsername,
              pfpUrl: pfpUrl || existingPlayer.pfpUrl,
              [`games.${sanitizedGame}`]: newGameData,
              updatedAt: new Date()
            }
          }
        );

        // Get player's rank for this game
        const rank = await collection.countDocuments({
          [`games.${sanitizedGame}.score`]: { $gt: sanitizedScore }
        }) + 1;

        return NextResponse.json({
          success: true,
          data: {
            fid,
            username: sanitizedUsername,
            game: sanitizedGame,
            score: sanitizedScore,
            rank,
            isNewRecord: true,
            previousBest: currentGameData?.score || 0
          }
        });
      } else {
        // Score not better, but update last played
        await collection.updateOne(
          { fid },
          {
            $set: {
              username: sanitizedUsername,
              pfpUrl: pfpUrl || existingPlayer.pfpUrl,
              [`games.${sanitizedGame}.lastPlayed`]: new Date(),
              updatedAt: new Date()
            }
          }
        );

        return NextResponse.json({
          success: true,
          data: {
            fid,
            username: sanitizedUsername,
            game: sanitizedGame,
            score: sanitizedScore,
            rank: null,
            isNewRecord: false,
            currentBest: currentGameData.score
          }
        });
      }
    } else {
      // Create new player document
      const newPlayer: PlayerDocument = {
        fid,
        username: sanitizedUsername,
        pfpUrl: pfpUrl || '',
        games: {
          [sanitizedGame]: newGameData
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(newPlayer);

      // Get player's rank
      const rank = await collection.countDocuments({
        [`games.${sanitizedGame}.score`]: { $gt: sanitizedScore }
      }) + 1;

      return NextResponse.json({
        success: true,
        data: {
          id: result.insertedId,
          fid,
          username: sanitizedUsername,
          game: sanitizedGame,
          score: sanitizedScore,
          rank,
          isNewRecord: true,
          previousBest: 0
        }
      });
    }

  } catch (error) {
    console.error('Error submitting score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit score' },
      { status: 500 }
    );
  }
} 