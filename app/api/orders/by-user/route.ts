import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { connectToDatabase } from '@/lib/db';
import { Order } from '@/lib/db/models/order.model';

export async function GET(req: Request) {
  const session = await getServerSession(authConfig);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  await connectToDatabase();
  const orders = await Order.find({ userId }).lean();
  return NextResponse.json({ orders });
} 