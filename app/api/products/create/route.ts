import { NextResponse } from 'next/server'
import { createProduct } from '@/lib/db/actions/product.actions'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const product = await createProduct(body)
    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('CREATE PRODUCT ERROR:', error)
    return NextResponse.json({
      success: false,
      message: 'Error creating product',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 