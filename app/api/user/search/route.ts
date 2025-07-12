import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import { getServerSession } from 'next-auth'
import authConfig from '@/auth.config'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // التحقق من الصلاحيات - يمكن للمستخدم الوصول لبياناته فقط أو المدير
    if (session.user.email !== email && !['ADMIN', 'APPLICATEUR'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await User.findOne({ email }).select('name email company role phone address bio profileImage companyLogo matriculeFiscale website socialMedia whatsapp createdAt updatedAt')
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error searching user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 