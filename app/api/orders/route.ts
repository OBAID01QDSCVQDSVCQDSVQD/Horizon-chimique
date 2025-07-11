// app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { createOrderWithShipping } from '@/lib/db/actions/order.actions'
import axios from 'axios'

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN as string;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID as string;
const ADMIN_PHONE = process.env.ADMIN_PHONE as string;

async function sendWhatsAppMessage(to: string, message: string) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  )
}

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

    // إرسال رسالة واتساب بعد إنشاء الطلب
    try {
      console.log('سأرسل رسالة واتساب الآن...');
      // بناء قائمة المنتجات مع الكمية
      const produits = cartItems?.map((item: any) => `- ${item.name} (x${item.quantity})`).join('\n') || '';
      await sendWhatsAppMessage(
        ADMIN_PHONE,
        `🛒 Nouvelle commande :\nNom: ${shippingData?.firstName || ''} ${shippingData?.lastName || ''}\nTéléphone: ${shippingData?.phone}\nEmail: ${shippingData?.email}\nAdresse: ${shippingData?.address}, ${shippingData?.city}, ${shippingData?.postalCode}, ${shippingData?.country}\nProduits:\n${produits}\nTotal: ${totalPrice} DT\nNombre d'articles: ${cartItems?.length}`
      );
      console.log('تمت محاولة إرسال رسالة واتساب');
    } catch (err) {
    }

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
