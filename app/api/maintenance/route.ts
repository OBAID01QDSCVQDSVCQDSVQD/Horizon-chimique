import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import MaintenanceStatus from '@/lib/db/models/maintenance.model'
import Garantie from '@/lib/db/models/garantie.model'
import { getServerSession } from 'next-auth'
import authConfig from '@/auth.config'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()

    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // التحقق من وجود الضمان
    const garantie = await Garantie.findById(body.garantieId)
    if (!garantie) {
      return NextResponse.json({ error: 'Garantie not found' }, { status: 404 })
    }

    // التحقق من أن المستخدم يملك الضمان أو هو مدير
    if (!['ADMIN', 'APPLICATEUR'].includes(session.user.role || '') && 
        garantie.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // إنشاء سجل الصيانة الجديد
    const maintenance = await MaintenanceStatus.create({
      ...body,
      userId: session.user.id,
      completedBy: body.status === 'COMPLETED' ? session.user.id : undefined
    })

    // تحديث إحصائيات الضمان إذا كانت الصيانة مكتملة
    if (body.status === 'COMPLETED') {
      await Garantie.findByIdAndUpdate(body.garantieId, {
        $inc: { 
          maintenanceCount: 1,
          totalMaintenanceCost: body.cost || 0
        },
        lastMaintenanceDate: body.completedDate || body.maintenanceDate
      })
    }

    return NextResponse.json({ 
      success: true, 
      maintenance 
    })
  } catch (error) {
    console.error('Error creating maintenance record:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)

    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const query: any = {}
    
    // فلترة حسب الحالة
    if (searchParams.get('status')) {
      query.status = searchParams.get('status')
    }
    
    // فلترة حسب النوع
    if (searchParams.get('type')) {
      query.maintenanceType = searchParams.get('type')
    }

    // فلترة حسب السنة
    if (searchParams.get('year') && searchParams.get('year') !== '') {
      const year = searchParams.get('year')
      const startOfYear = new Date(parseInt(year!), 0, 1) // 1 يناير من السنة المحددة
      const endOfYear = new Date(parseInt(year!), 11, 31) // 31 ديسمبر من السنة المحددة
      
      query.maintenanceDate = {
        $gte: startOfYear.toISOString().split('T')[0], // yyyy-mm-dd
        $lte: endOfYear.toISOString().split('T')[0]
      }
    }

    // فلترة حسب رقم الهاتف
    if (searchParams.get('garantieId')) {
      const phoneNumber = searchParams.get('garantieId')
      // البحث عن الضمانات التي لها هذا الرقم
      const garantiesWithPhone = await Garantie.find({ phone: phoneNumber }).select('_id')
      const garantieIds = garantiesWithPhone.map(g => g._id)
      query.garantieId = { $in: garantieIds }
    }

    // للمستخدمين العاديين، عرض فقط صيانة ضماناتهم
    if (!['ADMIN', 'APPLICATEUR'].includes(session.user.role || '')) {
      const userGaranties = await Garantie.find({ userId: session.user.id }).select('_id')
      const garantieIds = userGaranties.map(g => g._id)
      query.garantieId = { $in: garantieIds }
    }

    let maintenances;
    try {
      maintenances = await MaintenanceStatus.aggregate([
      { $match: query },
      {
        $addFields: {
          maintenanceDateSort: {
            $cond: {
              if: { $regexMatch: { input: "$maintenanceDate", regex: "^\\d{4}-\\d{2}-\\d{2}$" } },
              then: {
                $dateFromString: {
                  dateString: "$maintenanceDate",
                  format: "%Y-%m-%d"
                }
              },
              else: {
                $dateFromString: {
                  dateString: "$maintenanceDate"
                }
              }
            }
          },
          completedDateSort: {
            $cond: {
              if: { $and: [
                { $ne: ["$completedDate", null] },
                { $ne: ["$completedDate", ""] }
              ]},
              then: {
                $cond: {
                  if: { $regexMatch: { input: "$completedDate", regex: "^\\d{4}-\\d{2}-\\d{2}$" } },
                  then: {
                    $dateFromString: {
                      dateString: "$completedDate",
                      format: "%Y-%m-%d"
                    }
                  },
                  else: {
                    $dateFromString: {
                      dateString: "$completedDate"
                    }
                  }
                }
              },
              else: null
            }
          },
          statusOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", "PENDING"] }, then: 1 },
                { case: { $eq: ["$status", "IN_PROGRESS"] }, then: 2 },
                { case: { $eq: ["$status", "COMPLETED"] }, then: 3 },
                { case: { $eq: ["$status", "CANCELLED"] }, then: 4 }
              ],
              default: 5
            }
          }
        }
      },
      {
        $sort: {
          statusOrder: 1,
          maintenanceDateSort: 1,
          completedDateSort: -1,
          updatedAt: 1,
          _id: 1
        }
      },
      {
        $lookup: {
          from: 'garanties',
          localField: 'garantieId',
          foreignField: '_id',
          as: 'garantieId'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'completedBy',
          foreignField: '_id',
          as: 'completedBy'
        }
      },
      {
        $addFields: {
          garantieId: { $arrayElemAt: ['$garantieId', 0] },
          completedBy: { $arrayElemAt: ['$completedBy', 0] }
        }
      },
      {
        $project: {
          garantieId: { company: 1, name: 1, phone: 1 },
          completedBy: { name: 1, email: 1 },
          maintenanceDate: 1,
          status: 1,
          notes: 1,
          cost: 1,
          duration: 1,
          maintenanceType: 1,
          completedDate: 1,
          createdAt: 1,
          updatedAt: 1,
          _id: 1
        }
      }
    ])
    } catch (error) {
      console.error('Aggregation error:', error)
      // Fallback to simple find if aggregation fails
      maintenances = await MaintenanceStatus.find(query)
        .populate('garantieId', 'company name phone')
        .populate('completedBy', 'name email')
        .then(results => {
          // Sort manually to ensure PENDING comes first
          return results.sort((a, b) => {
            const statusOrder = { PENDING: 1, IN_PROGRESS: 2, COMPLETED: 3, CANCELLED: 4 };
            const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 5;
            const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 5;
            
            if (aOrder !== bOrder) {
              return aOrder - bOrder;
            }
            
            // If same status, sort by maintenance date
            return a.maintenanceDate.localeCompare(b.maintenanceDate);
          });
        })
    }

    return NextResponse.json({ maintenances })
  } catch (error) {
    console.error('Error fetching maintenance records:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 