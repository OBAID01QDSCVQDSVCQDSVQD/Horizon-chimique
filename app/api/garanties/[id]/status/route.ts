import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Garantie from '@/lib/db/models/garantie.model'
import { getServerSession } from 'next-auth'
import authConfig from '@/auth.config'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectToDatabase()
    const { id } = await context.params
    const body = await request.json()

    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // جلب الضمان
    const garantie = await Garantie.findById(id)
    if (!garantie) {
      return NextResponse.json({ error: 'Garantie not found' }, { status: 404 })
    }

    // التحقق من أن المستخدم يملك الضمان أو هو مدير
    if (!['ADMIN', 'APPLICATEUR'].includes(session.user.role || '') && 
        garantie.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // التحقق من صحة الحالة الجديدة
    const validStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED']
    if (!validStatuses.includes(body.garantieStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // تحديث حالة الضمان
    const updatedGarantie = await Garantie.findByIdAndUpdate(
      id,
      { garantieStatus: body.garantieStatus },
      { new: true }
    )

    return NextResponse.json({ 
      success: true, 
      garantie: updatedGarantie 
    })
  } catch (error) {
    console.error('Error updating garantie status:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 