import { Category } from '@/lib/db/models/category.model'
import { connectToDatabase } from '@/lib/db'

export async function getAllCategories() {
  await connectToDatabase()
  const categories = await Category.find({}, { _id: 1, name: 1 }).lean()
  return JSON.parse(JSON.stringify(categories))
} 