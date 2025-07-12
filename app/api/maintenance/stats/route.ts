import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import MaintenanceStatus from '@/lib/db/models/maintenance.model'
import Garantie from '@/lib/db/models/garantie.model'
import { getServerSession } from 'next-auth'
import authConfig from '@/auth.config'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [MAINTENANCE STATS] Starting stats request...')
    
    await connectToDatabase()
    console.log('✅ [MAINTENANCE STATS] Database connected successfully')

    const session = await getServerSession(authConfig)
    console.log('🔍 [MAINTENANCE STATS] Session:', {
      exists: !!session,
      userId: session?.user?.id,
      role: session?.user?.role,
      email: session?.user?.email
    })
    
    if (!session?.user?.id) {
      console.log('❌ [MAINTENANCE STATS] No session or user ID found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // جلب الـ role من قاعدة البيانات إذا لم يكن موجود في الجلسة
    let userRole = session.user.role || ''
    if (!userRole) {
      console.log('🔍 [MAINTENANCE STATS] Role not in session, fetching from database...')
      const User = (await import('@/lib/db/models/user.model')).default
      const user = await User.findById(session.user.id)
      userRole = user?.role || ''
      console.log('🔍 [MAINTENANCE STATS] Role from database:', userRole)
    }

    // التحقق من الصلاحيات
    console.log('🔍 [MAINTENANCE STATS] Checking permissions for role:', userRole)
    if (!['ADMIN', 'APPLICATEUR'].includes(userRole)) {
      console.log('❌ [MAINTENANCE STATS] Insufficient permissions. Role:', userRole)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('✅ [MAINTENANCE STATS] Permissions verified, fetching stats...')

    // إحصائيات عامة
    const totalMaintenances = await MaintenanceStatus.countDocuments()
    const pendingMaintenances = await MaintenanceStatus.countDocuments({ status: 'PENDING' })
    const inProgressMaintenances = await MaintenanceStatus.countDocuments({ status: 'IN_PROGRESS' })
    const completedMaintenances = await MaintenanceStatus.countDocuments({ status: 'COMPLETED' })
    const cancelledMaintenances = await MaintenanceStatus.countDocuments({ status: 'CANCELLED' })

    console.log('📊 [MAINTENANCE STATS] Basic counts:', {
      total: totalMaintenances,
      pending: pendingMaintenances,
      inProgress: inProgressMaintenances,
      completed: completedMaintenances,
      cancelled: cancelledMaintenances
    })

    // إحصائيات حسب النوع
    const typeStats = await MaintenanceStatus.aggregate([
      {
        $group: {
          _id: '$maintenanceType',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      }
    ])

    console.log('📊 [MAINTENANCE STATS] Type stats:', typeStats)

    // إحصائيات حسب الشهر (آخر 6 أشهر)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyStats = await MaintenanceStatus.aggregate([
      {
        $match: {
          maintenanceDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$maintenanceDate' },
            month: { $month: '$maintenanceDate' }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          },
          totalCost: { $sum: '$cost' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ])

    console.log('📊 [MAINTENANCE STATS] Monthly stats:', monthlyStats)

    // إحصائيات الصيانات التي ستقام في السنة الحالية
    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1) // 1 يناير من السنة الحالية
    const endOfYear = new Date(currentYear, 11, 31) // 31 ديسمبر من السنة الحالية

    const maintenancesThisYear = await MaintenanceStatus.aggregate([
      {
        $match: {
          maintenanceDate: {
            $gte: startOfYear.toISOString().split('T')[0], // yyyy-mm-dd
            $lte: endOfYear.toISOString().split('T')[0]
          },
          status: { $in: ['PENDING', 'IN_PROGRESS'] } // الصيانات التي لم تنته بعد
        }
      },
      {
        $count: 'count'
      }
    ])

    console.log('📊 [MAINTENANCE STATS] Maintenances this year:', maintenancesThisYear)

    // إجمالي تكلفة الصيانة
    const totalCost = await MaintenanceStatus.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$cost' }
        }
      }
    ])

    console.log('📊 [MAINTENANCE STATS] Total cost:', totalCost)

    const stats = {
      overview: {
        total: totalMaintenances,
        pending: pendingMaintenances,
        inProgress: inProgressMaintenances,
        completed: completedMaintenances,
        cancelled: cancelledMaintenances
      },
      byType: typeStats,
      monthly: monthlyStats,
      garantiesNeedingMaintenance: maintenancesThisYear[0]?.count || 0,
      totalCost: totalCost[0]?.total || 0
    }

    console.log('✅ [MAINTENANCE STATS] Successfully generated stats:', stats)
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('❌ [MAINTENANCE STATS] Error fetching maintenance stats:', error)
    console.error('❌ [MAINTENANCE STATS] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 