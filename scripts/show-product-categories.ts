import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'

async function run() {
  await connectToDatabase()
  const products = await Product.find().lean()

  for (const p of products) {
    console.log(`🛍️ ${p.name}`)
    console.log(`  ➤ categories: ${JSON.stringify(p.categories)} (type: ${typeof p.categories})`)
    
    if (p.categories && Array.isArray(p.categories)) {
      p.categories.forEach((cat, index) => {
        console.log(`    [${index}] ${cat} (${typeof cat})`)
      })
    }
    console.log('') // Empty line for better readability
  }

  process.exit(0)
}

run().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
