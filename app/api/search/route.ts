import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongoose'
import { Category } from '@/lib/db/models/category.model'
import Product from '@/lib/db/models/product.model'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const categorySlug = searchParams.get('category')

    if (!query) {
      return NextResponse.json({ products: [] })
    }

    await connectToDatabase()

    let searchQuery: any = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }

    if (categorySlug && categorySlug !== 'All') {
      const categoryDoc = await Category.findOne({ slug: categorySlug }).select('_id')
      if (categoryDoc) {
        searchQuery.category = categoryDoc._id
      } else {
        return NextResponse.json({ products: [] })
      }
    }

    const products = await Product.find(searchQuery)
      .select('name description price images category slug')
      .limit(10)

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 