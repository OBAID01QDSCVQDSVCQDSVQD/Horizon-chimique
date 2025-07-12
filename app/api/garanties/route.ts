import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Garantie from '@/lib/db/models/garantie.model'
import MaintenanceStatus from '@/lib/db/models/maintenance.model'
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
    
    // إضافة معلومات الصيانة المحدثة لكل ضمان
    const garantiesWithMaintenance = await Promise.all(
      garanties.map(async (garantie) => {
        // جلب سجلات الصيانة لهذا الضمان
        const maintenances = await MaintenanceStatus.find({ garantieId: garantie._id }).sort({ maintenanceDate: 1 });
        
        // حساب إحصائيات الصيانة
        const completedMaintenances = maintenances.filter(m => m.status === 'COMPLETED');
        const pendingMaintenances = maintenances.filter(m => m.status === 'PENDING');
        const totalCost = completedMaintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
        
        // تحديد آخر صيانة وموعد الصيانة القادمة
        const lastMaintenance = completedMaintenances.length > 0 
          ? completedMaintenances[completedMaintenances.length - 1] 
          : null;
        const nextMaintenance = pendingMaintenances.length > 0 
          ? pendingMaintenances[0] 
          : null;
        
        // تحويل الضمان إلى كائن عادي وإضافة معلومات الصيانة
        const garantieObj = garantie.toObject();
        return {
          ...garantieObj,
          maintenanceCount: completedMaintenances.length,
          totalMaintenanceCost: totalCost,
          lastMaintenanceDate: lastMaintenance?.maintenanceDate || null,
          nextMaintenanceDate: nextMaintenance?.maintenanceDate || null,
          // إضافة أوقات الصيانة المحدثة
          maintenanceSchedule: maintenances.map(m => ({
            date: m.maintenanceDate,
            status: m.status,
            type: m.maintenanceType,
            cost: m.cost || 0,
            notes: m.notes || ''
          }))
        };
      })
    );
    
    return NextResponse.json({ garanties: garantiesWithMaintenance });
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

    // إنشاء الضمان الجديد
    const newGarantie = await Garantie.create({
      ...body,
      userId: session.user.id,
    });

    // إنشاء سجلات الصيانة تلقائياً إذا كانت موجودة
    if (body.maintenances && body.maintenances.length > 0) {
      const maintenanceRecords = body.maintenances.map((maintenance: any) => ({
        garantieId: newGarantie._id,
        userId: newGarantie.userId, // إضافة userId
        maintenanceDate: maintenance.date,
        status: 'PENDING',
        maintenanceType: 'PREVENTIVE',
        priority: 'MEDIUM',
        isScheduled: true
      }));

      await MaintenanceStatus.insertMany(maintenanceRecords);
      
      // تحديث الضمان بمعلومات الصيانة
      await Garantie.findByIdAndUpdate(newGarantie._id, {
        nextMaintenanceDate: body.maintenances[0]?.date || null
      });

      console.log(`✅ Created ${maintenanceRecords.length} maintenance records for garantie ${newGarantie._id}`);
    }

    return NextResponse.json({ success: true, garantie: newGarantie });
  } catch (error) {
    console.error('POST /api/garanties error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 