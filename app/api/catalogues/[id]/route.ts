import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/auth.config';
import connectDB from '@/lib/mongodb';
import Catalogue from '@/models/Catalogue';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/catalogues/[id]
export async function GET(
  request: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await connectDB();
    const catalogue = await Catalogue.findById(id);
    
    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(catalogue);
  } catch (error) {
    console.error('Erreur lors de la récupération du catalogue:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du catalogue' },
      { status: 500 }
    );
  }
}

// PUT /api/catalogues/[id]
export async function PUT(
  request: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await request.json();
    await connectDB();

    const catalogue = await Catalogue.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date(), shortdesc: data.shortdesc },
      { new: true, runValidators: true }
    );

    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(catalogue);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du catalogue:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour du catalogue' },
      { status: 500 }
    );
  }
}

// DELETE /api/catalogues/[id]
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await connectDB();
    const catalogue = await Catalogue.findByIdAndDelete(id);

    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Catalogue supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du catalogue:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du catalogue' },
      { status: 500 }
    );
  }
} 