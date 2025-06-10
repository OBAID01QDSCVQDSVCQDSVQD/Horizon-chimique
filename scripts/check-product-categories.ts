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
    if (!isValidObjectId(product.category)) {
      console.warn(`❌ Invalid category in "${product.name}" → ${product.category}`)
      invalidCount++
    }
  }

  if (invalidCount === 0) {
    console.log('✅ All products have valid category ObjectIds.')
  } else {
    console.log(`🚨 Found ${invalidCount} product(s) with invalid category.`)
  }

  process.exit(0)
}

checkProductCategories().catch(err => {
  console.error('❌ Error checking categories:', err)
  process.exit(1)
})
