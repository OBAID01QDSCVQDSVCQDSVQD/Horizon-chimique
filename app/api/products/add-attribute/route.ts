import { NextResponse } from 'next/server'
import Product from '@/lib/db/models/product.model'
import { connectToDatabase } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { productId, attributeId, values } = body

    await connectToDatabase()

    // أضف الـ Attribute الجديد إلى مصفوفة attributes في المنتج
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $push: {
          attributes: {
            attribute: attributeId,
            value: values[0]?.value || '', // يمكنك تعديل هذا حسب الحاجة
            image: values[0]?.image || '',
            price: values[0]?.price || undefined,
          }
        }
      },
      { new: true }
    )

    if (!updatedProduct) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error adding attribute to product',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}


