import { NextApiRequest, NextApiResponse } from 'next';
import { Wallet, ethers, keccak256, toUtf8Bytes } from 'ethers';
import { connectToDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

const PRIVATE_KEYS = [
  process.env.ENVELOPE_PRIVATE_KEY,
  process.env.ENVELOPE_PRIVATE_KEY2,
  process.env.ENVELOPE_PRIVATE_KEY3,
].filter(Boolean);

function getRandomPrivateKey() {
  return PRIVATE_KEYS[Math.floor(Math.random() * PRIVATE_KEYS.length)]!;
}

const PROVIDER_URL = process.env.MONAD_RPC_URL!;
const VERIFICATION_SECRET = process.env.NEXT_PUBLIC_VERIFICATION_SECRET || 'demo_secret';

export async function POST(request: NextRequest) {
  const { to, amount, fid, name, randomKey, fusedKey, score } = await request.json();
  if (!to || !amount || !randomKey || !fusedKey) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  if(amount > 0.12) return NextResponse.json({ error: 'Amount must be less than 0.1' }, { status: 400 });

  // Verification step
  const expectedFusedKey = keccak256(
    toUtf8Bytes(
      randomKey + VERIFICATION_SECRET + (score !== undefined ? String(score) : '') + (fid !== undefined ? String(fid) : '')
    )
  );
  if (fusedKey !== expectedFusedKey) {
    return NextResponse.json({ error: 'Invalid verification' }, { status: 403 });
  }

  const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
  const wallet = new Wallet(getRandomPrivateKey(), provider);

  try {
    const { db } = await connectToDatabase();
    const users = db.collection('players');
    const user = await users.findOne({ fid });
    if(!user) return NextResponse.json({ error: 'User not found' }, { status: 400 });
    if(user.envelopeClaimed) return NextResponse.json({ error: 'User already claimed envelope' }, { status: 400 });
    const tx = await wallet.sendTransaction({
      to,
      value: ethers.parseEther(amount.toString())
    });
    await tx.wait();
    await users.updateOne({ fid }, { $set: { envelopeClaimed: true } });
    return NextResponse.json({ txHash: tx.hash });
  } catch (e: any) {
    console.log(e.message)
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}