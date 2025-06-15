import { NextRequest, NextResponse } from 'next/server'
import { updateProduct } from '@/lib/db/actions/product.actions'
import Product from '@/lib/db/models/product.model'
import connectToDB from '@/lib/mongodb'

export async function PUT(
  req: NextRequest,
  context: any
) {
  console.log('PUT request received')
  try {
    const id = context.params.id
    console.log('Product ID:', id)
    
    const data = await req.json()
    console.log('Received data:', data)
    console.log('Received images in API route:', data.images);

    // Get existing product
    const existingProduct = await Product.findById(id).lean()
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      _id: id,
      name: data.name,
      price: parseFloat(data.price),
      category: data.category,
      description: data.description || '',
      images: data.images,
      ficheTechnique: data.ficheTechnique || null
    }

    // Handle stock updates
    if (data.variants && Array.isArray(data.variants)) {
      // Update variants with their stocks
      updateData.variants = data.variants.map((variant: any) => ({
        ...variant,
        stock: Number(variant.stock) || 0
      }))
    } else if (data.stock !== undefined) {
      // Update main stock if no variants
      updateData.stock = Number(data.stock) || 0
    }

    console.log('Sending to updateProduct:', updateData)

    const result = await updateProduct(updateData)
    console.log('Update result:', result)

    if (!result.success) {
      console.error('Update failed:', result.message)
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    const updatedProduct = await Product.findById(id)
      .populate('category', 'name')
      .lean()

    console.log('Updated product:', updatedProduct)

    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    console.error('Error in PUT /api/products/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: any
) {
  try {
    await connectToDB()
    const id = context.params.id
    console.log(`DELETE request received for product ID: ${id}`)

    const deletedProduct = await Product.findByIdAndDelete(id)

    if (!deletedProduct) {
      console.log(`Product with ID: ${id} not found.`)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    console.log(`Product with ID: ${id} deleted successfully.`)
    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/products/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
