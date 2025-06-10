import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Category } from '@/lib/db/models/category.model';

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
    await mongoose.connect(process.env.MONGODB_URI);
  }
};

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    const { id } = await context.params;
    const body = await request.json();
    const { name, description, image } = body;
    if (!name) {
      return NextResponse.json({ error: 'Le nom de la catégorie est requis' }, { status: 400 });
    }
    const updated = await Category.findByIdAndUpdate(
      id,
      { name, description, image },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Échec de la mise à jour', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    const { id } = await context.params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Échec de la suppression', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 