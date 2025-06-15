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
  let newProduct = new Product(data)

  let isUnique = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 10; // لتجنب حلقة لا نهائية

  while (!isUnique && attempts < MAX_ATTEMPTS) {
    try {
      if (attempts > 0) {
        // إذا لم يكن فريدًا في المحاولة الأولى، أضف رقمًا عشوائيًا
        const randomString = Math.random().toString(36).substring(2, 8); // سلسلة عشوائية قصيرة
        newProduct.slug = `${data.slug}-${randomString}`;
      }
      await newProduct.save();
      isUnique = true;
    } catch (error: any) {
      if (error.code === 11000) { // خطأ تكرار المفتاح
        attempts++;
        // لا تفعل شيئًا، ستحاول الحلقة مرة أخرى بـ slug مختلف
      } else {
        throw error; // أخطاء أخرى يجب أن يتم طرحها
      }
    }
  }

  if (!isUnique) {
    throw new Error("Failed to create unique slug after multiple attempts.");
  }

  return JSON.parse(JSON.stringify(newProduct))
}

export async function updateProduct(data: any) {
  try {
    await connectToDatabase()
    console.log('Data received in updateProduct action:', data);
    
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
    console.log('Updated product from DB in updateProduct action:', updatedProduct);

    return { success: true, product: updatedProduct }
  } catch (error) {
    console.error('Error updating product:', error)
    return { success: false, message: 'Failed to update product' }
  }
}
