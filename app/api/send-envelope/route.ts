import { NextApiRequest, NextApiResponse } from 'next';
import { Wallet, ethers } from 'ethers';
import { connectToDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

const PRIVATE_KEY = process.env.ENVELOPE_PRIVATE_KEY!;
const PROVIDER_URL = process.env.MONAD_RPC_URL!;

export async function POST(request: NextRequest) {
  const { to, amount, fid ,name} = await request.json();
  if (!to || !amount) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  if(amount > 0.11) return NextResponse.json({ error: 'Amount must be less than 0.1' }, { status: 400 });
  const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);

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