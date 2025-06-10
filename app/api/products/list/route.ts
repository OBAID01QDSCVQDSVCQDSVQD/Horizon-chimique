import { NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/db/actions/product.actions'

export async function GET() {
  const products = await getAllProducts()
  return NextResponse.json(products)
}


