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
    
    // إضافة الحقول المفقودة تلقائياً للبيانات القديمة
    const cataloguesWithDefaults = catalogues.map(catalogue => {
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
      
      return cat;
    });
    
    return NextResponse.json(cataloguesWithDefaults);
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
    console.log('POST: Creating catalogue with data:', {
      title: data.title,
      title_en: data.title_en,
      title_ar: data.title_ar,
      hasEnglish: !!data.title_en,
      hasArabic: !!data.title_ar
    });
    
    await connectDB();

    const catalogue = await Catalogue.create({
      ...data,
      shortdesc: data.shortdesc,
    });
    
    console.log('POST: Created catalogue result:', {
      id: catalogue._id,
      title: catalogue.title,
      title_en: catalogue.title_en,
      title_ar: catalogue.title_ar
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