import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Product from '@/lib/db/models/product.model'

// Connect to MongoDB
const connectToDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!)
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    throw error
  }
}

export async function GET(request: Request) {
  try {
    await connectToDB()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const query: any = {}
    if (category) query.category = category
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (page - 1) * limit
    const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('category')
      .populate('ficheTechnique')
      .populate({
        path: 'attributes.attribute',
        model: 'Attribute',
        select: 'name'
      })
      .populate({
        path: 'variants.options.attributeId',
        model: 'Attribute',
        select: 'name'
      })

    const total = await Product.countDocuments(query)

    return NextResponse.json({
      data: products,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('API /api/products error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await connectToDB()
    const body = await request.json()
    const product = await Product.create(body)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
