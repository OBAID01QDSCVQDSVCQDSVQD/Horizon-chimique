import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Order } from '@/lib/db/models/order.model';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  if (!phone) {
    return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
  }
  await connectToDatabase();
  // ابحث عن الطلبات التي تحتوي على رقم الهاتف في بيانات الشحن
  const orders = await Order.find({ 'shippingInfo.phone': phone }).lean();
  return NextResponse.json({ orders });
} 