import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authConfig from '@/auth.config';
import connectDB from '@/lib/mongodb';
import Catalogue from '@/models/Catalogue';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await connectDB();
    const catalogues = await Catalogue.find().sort({ createdAt: -1 });
    return NextResponse.json(catalogues);
  } catch (error) {
    console.error('Erreur lors de la récupération des catalogues:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des catalogues' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await req.json();
    await connectDB();

    const catalogue = await Catalogue.create({
      ...data,
      shortdesc: data.shortdesc,
    });
    return NextResponse.json(catalogue, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création du catalogue:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du catalogue' },
      { status: 500 }
    );
  }
} 