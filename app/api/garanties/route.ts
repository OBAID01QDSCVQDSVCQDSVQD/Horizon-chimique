import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Garantie from '@/lib/db/models/garantie.model'
import { getServerSession } from 'next-auth'
import authConfig from '@/auth.config'

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const query: any = {};
    if (searchParams.get('phone')) query.phone = searchParams.get('phone');
    if (searchParams.get('name')) query.name = { $regex: searchParams.get('name'), $options: 'i' };
    if (searchParams.get('company')) query.company = { $regex: searchParams.get('company'), $options: 'i' };
    if (searchParams.get('status')) query.status = searchParams.get('status');
    if (searchParams.get('installDate')) query.installDate = searchParams.get('installDate');

    const garanties = await Garantie.find(query);
    return NextResponse.json({ garanties });
  } catch (error) {
    console.error('GET /api/garanties error:', error);
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