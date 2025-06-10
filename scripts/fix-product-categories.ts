// fix-product-categories.ts

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { Category } from '@/lib/db/models/category.model'

const CATEGORY_MAP: Record<string, string> = {
  'T-Shirts': 't-shirts',
  'Jeans': 'jeans',
  'Shoes': 'shoes',
  'Wrist Watches': 'wrist-watches',
}

async function fixProductCategories() {
  await connectToDatabase()

  const categories = await Category.find().lean()
  const slugToId = Object.fromEntries(categories.map(cat => [cat.slug, cat._id]))

  const products = await Product.find({})
  let fixed = 0

  for (const product of products) {
    const rawCategory = product.category

    if (typeof rawCategory === 'string') {
      const slug = CATEGORY_MAP[rawCategory.trim()]
      const categoryId = slugToId[slug]

      if (categoryId) {
        product.category = categoryId
        await product.save()
        console.log(`✅ Fixed category for "${product.name}" → ${slug}`)
        fixed++
      } else {
        console.warn(`❌ No matching Category document found for "${rawCategory}"`)
      }

    } else {
      console.warn(`❌ Skipping "${product.name}": category is not a string`)
      console.log(`👉 category value is:`, rawCategory)
    }
  }

  console.log(`\n🎉 Done. Updated ${fixed} product(s).`)
  process.exit(0)
}

fixProductCategories().catch(err => {
  console.error('❌ Fix failed:', err)
  process.exit(1)
})
