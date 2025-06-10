import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongoose'
import { Category } from '@/lib/db/models/category.model'
import Product from '@/lib/db/models/product.model'

export async function GET() {
  await connectToDatabase()
  // aggregation لحساب عدد المنتجات لكل تصنيف
  const categories = await Category.aggregate([
    {
      $lookup: {
        from: 'products', // اسم مجموعة المنتجات
        localField: '_id',
        foreignField: 'category',
        as: 'products',
      },
    },
    {
      $addFields: {
        productsCount: { $size: '$products' },
      },
    },
    {
      $project: {
        products: 0, // لا نعيد قائمة المنتجات نفسها
      },
    },
  ])
  return NextResponse.json({ categories })
}

export async function POST(request: Request) {
  await connectToDatabase();
  const body = await request.json();
  const { name, description, image } = body;
  if (!name) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
  }
  // توليد slug تلقائيًا من الاسم
  const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  // تحقق من عدم تكرار الاسم أو السلاج
  const exists = await Category.findOne({ $or: [{ name }, { slug }] });
  if (exists) {
    return NextResponse.json({ error: 'Category name or slug already exists' }, { status: 409 });
  }
  try {
    const category = await Category.create({ name, description, image, slug });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 