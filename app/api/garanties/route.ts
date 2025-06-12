import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Garantie from '@/lib/db/models/garantie.model'
import { getServerSession } from 'next-auth'
import authConfig from '@/auth.config'

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    const garanties = await Garantie.find({});
    return NextResponse.json({ garanties });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newGarantie = await Garantie.create({
      ...body,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, garantie: newGarantie });
  } catch (error) {
    console.error('POST /api/garanties error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 