import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import MaintenanceStatus from '@/lib/db/models/maintenance.model'
import Garantie from '@/lib/db/models/garantie.model'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectToDatabase()
    const { id } = await context.params

    // التحقق من وجود الضمان
    const garantie = await Garantie.findById(id)
    if (!garantie) {
      return NextResponse.json({ error: 'Garantie not found' }, { status: 404 })
    }

    // جلب جميع سجلات الصيانة للضمان
    const maintenances = await MaintenanceStatus.find({ garantieId: id })
      .sort({ maintenanceDate: 1 }) // ترتيب حسب التاريخ
      .populate('completedBy', 'name email') // جلب معلومات من قام بالصيانة

    // حساب الإحصائيات
    const stats = {
      total: maintenances.length,
      completed: maintenances.filter(m => m.status === 'COMPLETED').length,
      pending: maintenances.filter(m => m.status === 'PENDING').length,
      overdue: maintenances.filter(m => m.status === 'OVERDUE').length,
      cancelled: maintenances.filter(m => m.status === 'CANCELLED').length,
      totalCost: maintenances.reduce((sum, m) => sum + (m.cost || 0), 0)
    }

    return NextResponse.json({ 
      garantie,
      maintenances,
      stats
    })
  } catch (error) {
    console.error('Error fetching maintenance records:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 