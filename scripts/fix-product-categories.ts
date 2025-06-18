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
    // Check if categories array exists and contains string values that need to be converted
    if (!product.categories || !Array.isArray(product.categories)) {
      console.warn(`❌ Skipping "${product.name}": categories is not an array`)
      continue
    }

    let needsUpdate = false
    const newCategories = []

    for (const rawCategory of product.categories) {
      const categoryStr = rawCategory.toString()
      
      if (typeof rawCategory === 'string' && CATEGORY_MAP[categoryStr.trim()]) {
        const slug = CATEGORY_MAP[categoryStr.trim()]
        const categoryId = slugToId[slug]

        if (categoryId) {
          newCategories.push(categoryId)
          console.log(`✅ Converting category for "${product.name}": "${categoryStr}" → ${slug}`)
          needsUpdate = true
        } else {
          console.warn(`❌ No matching Category document found for "${categoryStr}"`)
          // Keep the original value if no mapping found
          newCategories.push(rawCategory)
        }
      } else {
        // Keep ObjectId categories as they are
        newCategories.push(rawCategory)
      }
    }

    if (needsUpdate) {
      product.categories = newCategories
      await product.save()
      fixed++
    }
  }

  console.log(`\n🎉 Done. Updated ${fixed} product(s).`)
  process.exit(0)
}

fixProductCategories().catch(err => {
  console.error('❌ Fix failed:', err)
  process.exit(1)
})
