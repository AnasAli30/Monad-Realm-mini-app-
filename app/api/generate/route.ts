import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
// import Pusher from 'pusher';
import { connectToDatabase } from '../../../lib/mongodb';

const SERVER_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY_1;

const CLIENT_SECRET_KEY = process.env.NEXT_PUBLIC_VERIFICATION_SECRET; // Must match NEXT_PUBLIC_CLIENT_SECRET_KEY

// const pusher = new Pusher({
//   appId: process.env.PUSHER_APP_ID!,
//   key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
//   secret: process.env.PUSHER_SECRET!,
//   cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
//   useTLS: true
// });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, tokenAddress, amount, tokenName, randomKey, fusedKey, name, pfpUrl, score, fid } = body;
    console.log('Request params:', { userAddress, tokenAddress, amount, tokenName, fusedKey, randomKey, pfpUrl, score, fid });

    if (!userAddress || !tokenAddress || !amount || !tokenName || !randomKey || !fusedKey || score === undefined || fid === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!SERVER_PRIVATE_KEY || !CLIENT_SECRET_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const VERIFICATION_SECRET = process.env.NEXT_PUBLIC_VERIFICATION_SECRET || "";
    // Use the same fusedKey logic as leaderboard
    const scoreStr = String(score);
    const fidStr = String(fid);
    const expectedFusedKey = ethers.keccak256(ethers.toUtf8Bytes(randomKey + VERIFICATION_SECRET + scoreStr + fidStr));
    if (fusedKey !== expectedFusedKey) {
      return NextResponse.json({ error: 'Invalid key verification' }, { status: 401 });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // --- NEW: Check if submitted score matches DB best score for this user/game ---
    // Assume 'game' is sent in the request body
    const game = body.game;
    if (!game) {
      return NextResponse.json({ error: 'Missing game parameter' }, { status: 400 });
    }
    const player = await db.collection('players').findOne({ fid: Number(fid) });
    if (!player || !player.games || !player.games[game]) {
      return NextResponse.json({ error: 'No score found for this user/game' }, { status: 403 });
    }
    const dbBestScore = player.games[game].score;
    console.log('DB Best Score:', dbBestScore, 'Submitted Score:', score);
    
    // For daily gifts, the score sent is the best score from DB (sent by /api/daily-gifts/claim)
    // So we just verify it matches the database to prevent tampering
    if (Number(score) !== dbBestScore) {
      return NextResponse.json({ error: 'Score does not match database. Please refresh and try again.' }, { status: 403 });
    }
    // --- END NEW ---

    // Check if this key has been used before
    const usedKey = await db.collection('used-keys').findOne({ fusedKey: fusedKey });
    if (usedKey) {
      return NextResponse.json({ error: 'Key already used' }, { status: 401 });
    }

    // Store the used key
    await db.collection('used-keys').insertOne({
      randomKey,
      fusedKey,
      userAddress,
      timestamp: new Date(),
      tokenName,
      amount
    });

    // Create the message hash exactly as in the contract using abi.encodePacked
    const packedData = ethers.solidityPacked(
      ["address", "address", "uint256"],
      [userAddress, tokenAddress, amount]
    );
    const messageHash = ethers.keccak256(packedData);

    // Sign the message
    const wallet = new ethers.Wallet(SERVER_PRIVATE_KEY);
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    // Optionally: emit win event to Pusher (commented out)
    // try{
    // await pusher.trigger('monado-spin', 'win', {
    //   name: name,
    //   address: userAddress,
    //   amount: amount,
    //   token: tokenName,
    //   pfpUrl: pfpUrl
    // });
    // }catch(error){
    //   console.error('Error triggering win event:', error);
    // }
    return NextResponse.json({ signature });
  } catch (error) {
    console.error('Error generating signature:', error);
    return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 });
  }
} 