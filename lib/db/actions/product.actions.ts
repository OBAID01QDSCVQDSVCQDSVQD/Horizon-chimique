import Product, { IProduct } from '@/lib/db/models/product.model'
import { connectToDatabase } from '@/lib/db'

export async function getProductsByTag({
  tag,
  limit = 10,
}: {
  tag: string
  limit?: number
}) {
  await connectToDatabase()

  const products = await Product.find({
    tags: { $in: [tag] },
    isPublished: true,
  })
    .populate('attributes.attribute') // 💡 هذه هي الإضافة المهمة
    .sort({ createdAt: 'desc' })
    .limit(limit)

  return JSON.parse(JSON.stringify(products)) as IProduct[]
}

export async function getAllProducts() {
  await connectToDatabase()
  const products = await Product.find({}, { _id: 1, name: 1 }).lean()
  return products
}

export async function createProduct(data: any) {
  await connectToDatabase()
  const newProduct = new Product(data)
  await newProduct.save()
  return JSON.parse(JSON.stringify(newProduct))
}

export async function updateProduct(data: any) {
  try {
    await connectToDatabase()
    
    // If updating variants, calculate total stock
    if (data.variants && Array.isArray(data.variants)) {
      const totalStock = data.variants.reduce((sum: number, variant: any) => sum + (Number(variant.stock) || 0), 0)
      data.countInStock = totalStock
    } else if (data.stock !== undefined) {
      data.countInStock = Number(data.stock) || 0
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      data._id,
      { $set: data },
      { new: true }
    ).populate('category', 'name')

    if (!updatedProduct) {
      return { success: false, message: 'Product not found' }
    }

    return { success: true, product: updatedProduct }
  } catch (error) {
    console.error('Error updating product:', error)
    return { success: false, message: 'Failed to update product' }
  }
}
