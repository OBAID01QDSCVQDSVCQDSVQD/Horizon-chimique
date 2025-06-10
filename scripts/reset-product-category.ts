// scripts/reset-product-category.ts
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { Category } from '@/lib/db/models/category.model'

const BRAND_TO_CATEGORY: Record<string, string> = {
  'Jerzees': 'T-Shirts',
  'Muscle Cmdr': 'T-Shirts',
  'Hanes': 'T-Shirts',
  'Dickies': 'Jeans',
  'Casio': 'Wrist Watches',
  'Wearbreeze': 'Shoes',
  'Decrum': 'T-Shirts',
  'Levi\'s': 'Jeans',
  'adidas': 'Shoes',
  'Wrangler': 'Jeans',
  'Seiko': 'Wrist Watches',
  'Fossil': 'Wrist Watches',
  'Skechers': 'Shoes',
  'ASICS': 'Shoes',
  'Nike': 'T-Shirts',
  'Silver Jeans': 'Jeans',
  'Essentials': 'Jeans',
  'Buffalo David Bitton': 'Jeans',
  'ziitop': 'Shoes',
  'DLWKIPV': 'Shoes',
}

async function resetProductCategories() {
  await connectToDatabase()

  // نجيب جميع الكاتيجوري بالاسم متاعها ونبني منهم Map
  const categories = await Category.find().lean()
  const categoryMap = Object.fromEntries(
    categories.map((cat) => [cat.name.toLowerCase(), cat._id])
  )

  const products = await Product.find({})
  let updated = 0

  for (const product of products) {
    const brand = product.brand?.trim()
    const categoryName = BRAND_TO_CATEGORY[brand]
    if (!categoryName) {
      console.warn(`❌ No matching category for brand: "${brand}"`)
      continue
    }

    const categoryId = categoryMap[categoryName.toLowerCase()]
    if (!categoryId) {
      console.warn(`❌ No category in DB for: "${categoryName}"`)
      continue
    }

    product.category = categoryId
    await product.save()
    console.log(`✅ Updated "${product.name}" → ${categoryName}`)
    updated++
  }

  console.log(`\n🎉 Done. Restored category ObjectId for ${updated} product(s).`)
  process.exit(0)
}

resetProductCategories().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
