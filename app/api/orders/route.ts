// app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { createOrderWithShipping } from '@/lib/db/actions/order.actions'

export async function POST(req: NextRequest) {
  console.log('✅ /api/orders reached')

  try {
    await connectToDatabase()

    const body = await req.json()
    console.log('📦 Received body:', body)

    const { shippingData, cartItems, totalPrice, userId } = body

    if (!shippingData || !cartItems || !totalPrice) {
      return NextResponse.json(
        { error: 'Missing required data in the request body' },
        { status: 400 }
      )
    }

    const order = await createOrderWithShipping(shippingData, cartItems, totalPrice, userId)

    return NextResponse.json({ order })
  } catch (error: any) {
    console.error('❌ Error creating order:', error)

    // Handle stock error
    if (typeof error.message === 'string' && error.message.includes('STOCK_ERROR')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'فشل إنشاء الطلب', details: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
