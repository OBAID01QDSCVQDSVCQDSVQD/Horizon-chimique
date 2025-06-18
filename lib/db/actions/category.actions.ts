import { Category } from '@/lib/db/models/category.model'
import { connectToDatabase } from '@/lib/db'
import Catalogue from '@/lib/db/models/catalogue.model'

export async function getAllCategories() {
  await connectToDatabase()
  const categories = await Category.find({}, { _id: 1, name: 1 }).lean()
  return JSON.parse(JSON.stringify(categories))
}

export async function getAllCatalogues() {
  await connectToDatabase()
  const catalogues = await Catalogue.find({}).lean()
  return JSON.parse(JSON.stringify(catalogues))
} 