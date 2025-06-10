import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

import Product from '@/lib/db/models/product.model'
import { Category } from '@/lib/db/models/category.model'
import { connectToDatabase } from '@/lib/db'

export const GET = async (request: NextRequest) => {
  const listType = request.nextUrl.searchParams.get('type') || 'history'
  const productIdsParam = request.nextUrl.searchParams.get('ids')
  const categoriesParam = request.nextUrl.searchParams.get('categories')

  if (!productIdsParam || !categoriesParam) {
    return NextResponse.json([])
  }

  const productIds = productIdsParam.split(',')
  const categoriesSlugs = categoriesParam.split(',').filter(Boolean)

  await connectToDatabase()

  // 🧠 استخرج الـ ObjectIds من الـ slugs
  const matchedCategories = await Category.find({
    name: { $in: categoriesSlugs },
  })

  const categoryIds = matchedCategories.map((cat) => cat._id)

  const filter =
    listType === 'history'
      ? { _id: { $in: productIds } }
      : categoryIds.length > 0
        ? { category: { $in: categoryIds }, _id: { $nin: productIds } }
        : { _id: { $nin: productIds } }

  const products = await Product.find(filter)

  if (listType === 'history') {
    return NextResponse.json(
      products.sort(
        (a, b) =>
          productIds.indexOf(a._id.toString()) - productIds.indexOf(b._id.toString())
      )
    )
  }

  return NextResponse.json(products)
}
