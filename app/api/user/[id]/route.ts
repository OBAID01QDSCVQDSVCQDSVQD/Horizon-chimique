import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/db/models/user.model';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const user = await User.findById(params.id).lean();
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération du profil' }, { status: 500 });
  }
} 