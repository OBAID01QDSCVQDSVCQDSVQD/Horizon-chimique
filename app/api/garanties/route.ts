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

    // معاملات التصفح
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const session = await getServerSession(authConfig);
    const isAdmin = session?.user?.role === 'ADMIN';
    const isApplicateur = session?.user?.role === 'APPLICATEUR';
    const isAuthenticated = !!session?.user?.id;

    console.log('=== GARANTIES API DEBUG ===');
    console.log('Session:', { 
      isAuthenticated, 
      role: session?.user?.role, 
      userId: session?.user?.id 
    });
    console.log('Search Params:', Object.fromEntries(searchParams.entries()));
    console.log('Pagination:', { page, limit, skip });

    const query: any = {};
    
    // إضافة معايير البحث
    if (searchParams.get('phone')) query.phone = searchParams.get('phone');
    if (searchParams.get('name')) query.name = { $regex: searchParams.get('name'), $options: 'i' };
    if (searchParams.get('company')) query.company = { $regex: searchParams.get('company'), $options: 'i' };
    if (searchParams.get('status')) query.status = searchParams.get('status');
    if (searchParams.get('installDate')) query.installDate = searchParams.get('installDate');
    if (searchParams.get('userId')) query.userId = searchParams.get('userId');

    // منطق الأمان: المستخدمون العاديون والزوار يمكنهم فقط رؤية الضمانات التي تتطابق مع رقم هاتفهم
    if (!isAdmin && !isApplicateur) {
      // إذا لم يكن المستخدم مدير أو مقدم طلب، يجب أن يكون هناك رقم هاتف في البحث
      const searchPhone = searchParams.get('phone');
      if (!searchPhone) {
        console.log('Access denied: No phone number provided for non-admin user');
        return NextResponse.json({ 
          error: 'Vous devez fournir un numéro de téléphone pour rechercher des garanties',
          garanties: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            pages: 0
          }
        }, { status: 403 });
      }
      
      // إضافة رقم الهاتف كشرط إجباري للبحث
      query.phone = searchPhone;
      
      // المستخدمون العاديون والزوار يرون فقط الضمانات المعتمدة
      query.status = 'APPROVED';
      
      console.log('Non-admin user search - phone required:', searchPhone);
    } else {
      // المديرون ومقدمو الطلبات يمكنهم رؤية جميع الضمانات
      // إذا لم يتم تحديد حالة في البحث، لا نضيف فلترة للحالة
      // إذا تم تحديد حالة، نستخدمها
      if (!searchParams.get('status')) {
        // لا نضيف فلترة للحالة - نعرض جميع الضمانات
        console.log('Admin/Applicateur - showing all garanties');
      } else {
        // نستخدم الحالة المحددة في البحث
        console.log('Admin/Applicateur - filtering by status:', searchParams.get('status'));
      }
    }

    console.log('Final Query:', JSON.stringify(query, null, 2));
    
    // جلب إجمالي عدد الضمانات
    const totalGaranties = await Garantie.countDocuments(query);
    
    // جلب الضمانات مع التصفح
    const garanties = await Garantie.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log('Found Garanties Count:', garanties.length);
    console.log('Total Garanties:', totalGaranties);
    console.log('Found Garanties:', garanties.map(g => ({ 
      id: g._id, 
      status: g.status, 
      company: g.company, 
      phone: g.phone,
      userId: g.userId
    })));
    
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
    
    return NextResponse.json({ 
      garanties: garantiesWithMaintenance,
      pagination: {
        page,
        limit,
        total: totalGaranties,
        pages: Math.ceil(totalGaranties / limit)
      }
    });
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