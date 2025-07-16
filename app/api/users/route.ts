import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import { getServerSession } from 'next-auth'
import authConfig from '@/auth.config'

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const session = await getServerSession(authConfig);
    const isAdmin = session?.user?.role === 'ADMIN';

    // فقط المديرون يمكنهم الوصول لقائمة المستخدمين
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const query: any = {};
    
    // إضافة معايير البحث
    if (searchParams.get('email')) query.email = { $regex: searchParams.get('email'), $options: 'i' };
    if (searchParams.get('name')) query.name = { $regex: searchParams.get('name'), $options: 'i' };
    if (searchParams.get('role')) query.role = searchParams.get('role');
    if (searchParams.get('company')) query.company = { $regex: searchParams.get('company'), $options: 'i' };

    // معاملات التصفح
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    console.log('=== USERS API DEBUG ===');
    console.log('Search Params:', Object.fromEntries(searchParams.entries()));
    console.log('Final Query:', JSON.stringify(query, null, 2));
    console.log('Pagination:', { page, limit, skip });
    
    // جلب إجمالي عدد المستخدمين
    const totalUsers = await User.countDocuments(query);
    
    // جلب المستخدمين مع التصفح
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log('Found Users Count:', users.length);
    console.log('Total Users:', totalUsers);
    
    return NextResponse.json({ 
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const session = await getServerSession(authConfig);
    const isAdmin = session?.user?.role === 'ADMIN';

    // فقط المديرون يمكنهم تحديث المستخدمين
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    // تحديث المستخدم
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    console.log('User updated:', updatedUser._id);

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      message: 'Utilisateur mis à jour avec succès'
    });
  } catch (error) {
    console.error('PUT /api/users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 