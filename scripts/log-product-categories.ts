import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'

async function logProductCategories() {
  await connectToDatabase()

  const products = await Product.find({}).lean()

  for (const product of products) {
    console.log(`🛍️ ${product.name}`)
    console.log(`   ➤ categories:`, product.categories)
    
    if (product.categories && Array.isArray(product.categories)) {
      product.categories.forEach((cat, index) => {
        console.log(`     [${index}] ${typeof cat === 'string' ? cat : cat.toString()}`)
      })
    } else {
      console.log(`     ❌ No categories or invalid categories array`)
    }
    console.log('') // Empty line for better readability
  }

  console.log(`\n🔍 Total products found: ${products.length}`)
  process.exit(0)
}

logProductCategories().catch((err) => {
  console.error('❌ Failed to fetch products:', err)
  process.exit(1)
})
