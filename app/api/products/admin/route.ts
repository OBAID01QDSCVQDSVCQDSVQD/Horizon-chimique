import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'

export async function GET(request: Request) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minStock = searchParams.get('minStock')
    const maxStock = searchParams.get('maxStock')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query
    let query: any = {}
    
    if (category) {
      query.categories = category
    }
    
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = parseFloat(minPrice)
      if (maxPrice) query.price.$lte = parseFloat(maxPrice)
    }
    
    if (minStock || maxStock) {
      query.countInStock = {}
      if (minStock) query.countInStock.$gte = parseInt(minStock)
      if (maxStock) query.countInStock.$lte = parseInt(maxStock)
    }

    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Calculate skip value
    const skip = (page - 1) * limit

    // Get total count
    const totalProducts = await Product.countDocuments(query)

    // Get products with pagination
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('categories', 'name')
      .lean()

    return NextResponse.json({
      products,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      currentPage: page,
      productsPerPage: limit
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 