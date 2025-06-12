import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/db/models/user.model';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      bio,
      company,
      address,
      surface,
      surfaceValue,
      montant,
      installDate,
      duration,
      notes,
      matriculeFiscale,
      website,
      socialMedia,
    } = body;

    await connectToDatabase();

    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    let updateFields: any = {
      name,
      phone,
      bio,
      company,
      address,
      surface,
      surfaceValue,
      montant,
      installDate,
      duration,
      notes,
      matriculeFiscale,
      website,
      socialMedia,
      profileImage: body.profileImage,
      companyLogo: body.companyLogo,
      updatedAt: new Date(),
    };
    if (email && email !== currentUser.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 400 });
      }
      updateFields.email = email;
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      updateFields,
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
} 