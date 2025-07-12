import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import MaintenanceStatus from '@/lib/db/models/maintenance.model'
import Garantie from '@/lib/db/models/garantie.model'
import { getServerSession } from 'next-auth'
import authConfig from '@/auth.config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const maintenance = await MaintenanceStatus.findById(id)
      .populate('garantieId', 'company name phone userId')
      .populate('completedBy', 'name email')

    if (!maintenance) {
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 })
    }

    // التحقق من الصلاحيات
    const garantie = maintenance.garantieId as any
    if (!['ADMIN', 'APPLICATEUR'].includes(session.user.role || '') && 
        garantie.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ maintenance })
  } catch (error) {
    console.error('Error fetching maintenance record:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const body = await request.json()

    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // البحث عن سجل الصيانة
    const maintenance = await MaintenanceStatus.findById(id)
      .populate('garantieId', 'userId')
    
    if (!maintenance) {
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 })
    }

    // التحقق من الصلاحيات
    const garantie = maintenance.garantieId as any
    if (!['ADMIN', 'APPLICATEUR'].includes(session.user.role || '') && 
        garantie.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // تحديث سجل الصيانة
    const updateData: any = {
      status: body.status,
      notes: body.notes,
      cost: body.cost,
      maintenanceDate: body.maintenanceDate,
      duration: body.duration
    }

    // إذا تم تغيير الحالة إلى مكتمل، تحديث completedBy و completedDate
    if (body.status === 'COMPLETED' && maintenance.status !== 'COMPLETED') {
      updateData.completedBy = session.user.id
      updateData.completedDate = new Date()
    }

    const updatedMaintenance = await MaintenanceStatus.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('garantieId', 'company name phone')
     .populate('completedBy', 'name email')

    // تحديث إحصائيات الضمان إذا تم إكمال الصيانة
    if (body.status === 'COMPLETED' && maintenance.status !== 'COMPLETED') {
      await Garantie.findByIdAndUpdate(maintenance.garantieId, {
        $inc: { 
          maintenanceCount: 1,
          totalMaintenanceCost: body.cost || 0
        },
        lastMaintenanceDate: body.maintenanceDate || new Date()
      })
    }

    return NextResponse.json({ 
      success: true, 
      maintenance: updatedMaintenance 
    })
  } catch (error) {
    console.error('Error updating maintenance record:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // البحث عن سجل الصيانة
    const maintenance = await MaintenanceStatus.findById(id)
      .populate('garantieId', 'userId')
    
    if (!maintenance) {
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 })
    }

    // التحقق من الصلاحيات - فقط المدير يمكنه الحذف
    if (!['ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await MaintenanceStatus.findByIdAndDelete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting maintenance record:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 