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

    // إضافة الحقول المفقودة تلقائياً للبيانات القديمة
    const cat = catalogue.toObject();
    
    // إضافة الحقول الإنجليزية إذا لم تكن موجودة
    if (!cat.title_en) cat.title_en = '';
    if (!cat.shortdesc_en) cat.shortdesc_en = '';
    if (!cat.description_en) cat.description_en = '';
    if (!cat.domaine_en) cat.domaine_en = '';
    if (!cat.proprietes_en) cat.proprietes_en = '';
    if (!cat.preparation_en) cat.preparation_en = '';
    if (!cat.conditions_en) cat.conditions_en = '';
    if (!cat.application_en) cat.application_en = '';
    if (!cat.consommation_en) cat.consommation_en = '';
    if (!cat.nettoyage_en) cat.nettoyage_en = '';
    if (!cat.stockage_en) cat.stockage_en = '';
    if (!cat.consignes_en) cat.consignes_en = '';
    
    // إضافة الحقول العربية إذا لم تكن موجودة
    if (!cat.title_ar) cat.title_ar = '';
    if (!cat.shortdesc_ar) cat.shortdesc_ar = '';
    if (!cat.description_ar) cat.description_ar = '';
    if (!cat.domaine_ar) cat.domaine_ar = '';
    if (!cat.proprietes_ar) cat.proprietes_ar = '';
    if (!cat.preparation_ar) cat.preparation_ar = '';
    if (!cat.conditions_ar) cat.conditions_ar = '';
    if (!cat.application_ar) cat.application_ar = '';
    if (!cat.consommation_ar) cat.consommation_ar = '';
    if (!cat.nettoyage_ar) cat.nettoyage_ar = '';
    if (!cat.stockage_ar) cat.stockage_ar = '';
    if (!cat.consignes_ar) cat.consignes_ar = '';
    
    // إضافة الحقول الفرنسية الفارغة إذا لم تكن موجودة  
    if (!cat.domaine) cat.domaine = '';
    if (!cat.preparation) cat.preparation = '';
    if (!cat.conditions) cat.conditions = '';
    if (!cat.application) cat.application = '';
    if (!cat.consommation) cat.consommation = '';
    if (!cat.nettoyage) cat.nettoyage = '';
    if (!cat.stockage) cat.stockage = '';
    if (!cat.consignes) cat.consignes = '';

    return NextResponse.json(cat);
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
    console.log('PUT: Received data for catalogue update:', {
      id,
      title: data.title,
      title_en: data.title_en,
      title_ar: data.title_ar,
      hasEnglish: !!data.title_en,
      hasArabic: !!data.title_ar
    });
    
    await connectDB();

    const catalogue = await Catalogue.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date(), shortdesc: data.shortdesc },
      { new: true, runValidators: true }
    );
    
    console.log('PUT: Updated catalogue result:', {
      id: catalogue?._id,
      title: catalogue?.title,
      title_en: catalogue?.title_en,
      title_ar: catalogue?.title_ar
    });

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