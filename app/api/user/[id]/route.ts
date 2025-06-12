import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/db/models/user.model';

type Props = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  props: Props
) {
  try {
    await connectToDatabase();
    const { id } = await props.params;
    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération du profil' }, { status: 500 });
  }
} 