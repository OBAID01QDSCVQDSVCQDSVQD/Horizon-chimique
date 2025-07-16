import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Order } from '@/lib/db/models/order.model';
import { Document, Types } from 'mongoose';
import { ShippingInfo } from '@/lib/db/models/shipping.model';

interface OrderDocument extends Document {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  cartItems: Array<{
    _id: string;
    variantId: string | null;
    [key: string]: any;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    const { searchParams } = new URL(request.url);
    
    // معاملات التصفح
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // معاملات الفلترة
    const status = searchParams.get('status');
    const phone = searchParams.get('phone');
    const client = searchParams.get('client');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    await connectToDatabase();
    
    // بناء query الفلترة
    const query: any = {};
    if (status) query.status = status;
    if (phone) query['shippingInfo.phone'] = { $regex: phone, $options: 'i' };
    if (client) query['userId.name'] = { $regex: client, $options: 'i' };
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    console.log('=== ORDERS API DEBUG ===');
    console.log('Search Params:', Object.fromEntries(searchParams.entries()));
    console.log('Query:', JSON.stringify(query, null, 2));
    console.log('Pagination:', { page, limit, skip });

    // جلب إجمالي عدد الأوردرات
    const totalOrders = await Order.countDocuments(query);
    
    // جلب الأوردرات مع التصفح
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'userId',
        select: 'name email phone',
        model: 'User'
      })
      .lean();

    if (!orders) {
      return NextResponse.json(
        { error: 'No orders found' },
        { status: 404 }
      );
    }

    const formattedOrders = await Promise.all(orders.map(async (order: any) => {
      let shippingInfo = order.shippingInfo;
      if (shippingInfo && Types.ObjectId.isValid(shippingInfo)) {
        const shippingDoc = await ShippingInfo.findById(shippingInfo).lean();
        if (shippingDoc && !Array.isArray(shippingDoc) && (shippingDoc as any)._id) {
          shippingInfo = { ...shippingDoc, _id: (shippingDoc as any)._id.toString() };
        } else {
          shippingInfo = null;
        }
      } else if (shippingInfo && typeof shippingInfo === 'object') {
        shippingInfo = { ...shippingInfo };
      } else {
        shippingInfo = null;
      }
      return {
        ...order,
        _id: order._id.toString(),
        userId: order.userId ? {
          ...order.userId,
          _id: order.userId._id.toString()
        } : null,
        shippingInfo,
        cartItems: order.cartItems.map((item: any) => ({
          ...item,
          _id: item._id.toString(),
          variantId: item.variantId ? item.variantId.toString() : null
        }))
      };
    }));

    console.log('Found Orders Count:', formattedOrders.length);
    console.log('Total Orders:', totalOrders);

    return NextResponse.json({ 
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        pages: Math.ceil(totalOrders / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const body = await request.json();
    const { status } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // تأكد من وجود MONGODB_URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // الاتصال بقاعدة البيانات
    await connectToDatabase();
    
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    )
    .populate({
      path: 'userId',
      select: 'name email phone',
      model: 'User'
    })
    .populate({
      path: 'shippingInfo',
      model: 'ShippingInfo'
    })
    .lean();

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // تحويل ObjectId إلى string
    const formattedOrder = {
      ...updatedOrder,
      _id: (updatedOrder as any)._id.toString(),
      userId: (updatedOrder as any).userId ? {
        ...(updatedOrder as any).userId,
        _id: (updatedOrder as any).userId._id.toString()
      } : null,
      shippingInfo: (updatedOrder as any).shippingInfo ? {
        ...(updatedOrder as any).shippingInfo,
        _id: (updatedOrder as any).shippingInfo._id.toString()
      } : null,
      cartItems: (updatedOrder as any).cartItems.map((item: any) => ({
        ...item,
        _id: item._id.toString(),
        variantId: item.variantId ? item.variantId.toString() : null
      }))
    };

    return NextResponse.json({ order: formattedOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: (error as Error).message },
      { status: 500 }
    );
  }
}