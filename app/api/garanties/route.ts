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

    // إزالة شرط الجلسة للسماح بالبحث بدون تسجيل دخول
    // const session = await getServerSession(authConfig);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const query: any = {};
    if (searchParams.get('phone')) query.phone = searchParams.get('phone');
    if (searchParams.get('name')) query.name = { $regex: searchParams.get('name'), $options: 'i' };
    if (searchParams.get('company')) query.company = { $regex: searchParams.get('company'), $options: 'i' };
    if (searchParams.get('status')) query.status = searchParams.get('status');
    if (searchParams.get('installDate')) query.installDate = searchParams.get('installDate');

    // لا نحتاج لفلترة حسب المستخدم لأن الضمانات غير مرتبطة بالمستخدم
    // كل من لديه رقم الهاتف يمكنه رؤية المعلومات

    console.log('=== GARANTIES API DEBUG ===');
    console.log('Search Params:', Object.fromEntries(searchParams.entries()));
    console.log('Final Query:', JSON.stringify(query, null, 2));
    
    // جلب جميع الضمانات أولاً للتحقق
    const allGaranties = await Garantie.find({});
    console.log('ALL Garanties in DB:', allGaranties.length);
    console.log('ALL Garanties Statuses:', allGaranties.map(g => ({ id: g._id, status: g.status, company: g.company, phone: g.phone })));
    
    // تحقق من الضمان المحدد في الرسالة
    const specificGarantie = await Garantie.findById('6849da6b4c12678f8068dd94');
    console.log('Specific Garantie Check:', specificGarantie ? {
      id: specificGarantie._id,
      status: specificGarantie.status,
      company: specificGarantie.company,
      phone: specificGarantie.phone
    } : 'Not found');
    
    const garanties = await Garantie.find(query);
    
    console.log('Found Garanties Count:', garanties.length);
    console.log('Found Garanties:', garanties.map(g => ({ id: g._id, status: g.status, company: g.company, phone: g.phone })));
    
    // تحقق إضافي من الضمانات المعتمدة فقط
    const approvedGaranties = garanties.filter(g => g.status === 'APPROVED');
    console.log('Approved Garanties Count:', approvedGaranties.length);
    console.log('Approved Garanties:', approvedGaranties.map(g => ({ id: g._id, status: g.status, company: g.company, phone: g.phone })));
    
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