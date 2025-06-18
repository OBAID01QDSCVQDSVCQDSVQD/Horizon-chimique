import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { isValidObjectId } from 'mongoose'

async function checkProductCategories() {
  await connectToDatabase()

  const products = await Product.find({})
  let invalidCount = 0

  for (const product of products) {
    // Check if categories array exists and has valid ObjectIds
    if (!product.categories || !Array.isArray(product.categories)) {
      console.warn(`❌ Missing or invalid categories array in "${product.name}"`)
      invalidCount++
    } else {
      // Check each category ID in the array
      for (const categoryId of product.categories) {
        if (!isValidObjectId(categoryId)) {
          console.warn(`❌ Invalid category ID in "${product.name}" → ${categoryId}`)
          invalidCount++
        }
      }
    }
  }

  if (invalidCount === 0) {
    console.log('✅ All products have valid category ObjectIds.')
  } else {
    console.log(`🚨 Found ${invalidCount} product(s) with invalid categories.`)
  }

  process.exit(0)
}

checkProductCategories().catch(err => {
  console.error('❌ Error checking categories:', err)
  process.exit(1)
})
