import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'

async function run() {
  await connectToDatabase()
  const products = await Product.find().lean()

  for (const p of products) {
    console.log(`🛍️ ${p.name}\n  ➤ category: ${p.category} (type: ${typeof p.category})\n`)
  }

  process.exit(0)
}

run().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
