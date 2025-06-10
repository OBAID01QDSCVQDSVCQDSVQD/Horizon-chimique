import { NextResponse } from 'next/server'
import { getAllAttributes } from '@/lib/db/actions/attribute.actions'

export async function GET() {
  const attributes = await getAllAttributes()
  // إذا كانت الدالة ترجع success=false أو error، أرجع رسالة خطأ
  if (Array.isArray(attributes)) {
    return NextResponse.json({ data: attributes })
  } else if (attributes && attributes.success === false) {
    return NextResponse.json({ data: [], error: attributes.message }, { status: 500 })
  } else {
    return NextResponse.json({ data: [] })
  }
} 