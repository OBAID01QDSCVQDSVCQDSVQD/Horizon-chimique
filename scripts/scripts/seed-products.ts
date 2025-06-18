
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

// ✨ resolve aliases like @/lib
import moduleAlias from 'module-alias'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
moduleAlias.addAlias('@', path.join(__dirname, '../lib'))

const { connectToDatabase } = await import('@/lib/db/index')
const { default: Product } = await import('@/lib/db/models/product.model')
const { Category } = await import('@/lib/db/models/category.model')

async function seedProducts() {
  await connectToDatabase()
  require('dotenv').config()
  const path = require('path')
  const products = [
    {
      name: 'Nike Sportswear Club Fleece',
      slug: 'nike-sportswear-club-fleece',
      categorySlug: 't-shirts',
      images: [
        'https://images.unsplash.com/photo-1602810311458-17994d3e1ca6?auto=format&fit=crop&w=800&q=80',
      ],
      brand: 'Nike',
      description: 'Soft and comfortable fleece perfect for daily wear.',
      price: 39.99,
      listPrice: 49.99,
      countInStock: 12,
    },
    {
      name: 'Levi\'s 501 Original Fit Jeans',
      slug: 'levis-501-original-jeans',
      categorySlug: 'jeans',
      images: [
        'https://images.unsplash.com/photo-1618354691212-10487ab375f2?auto=format&fit=crop&w=800&q=80',
      ],
      brand: 'Levi\'s',
      description: 'The original straight fit with classic style.',
      price: 59.99,
      listPrice: 75.00,
      countInStock: 8,
    },
    {
      name: 'Adidas Ultraboost 22',
      slug: 'adidas-ultraboost-22',
      categorySlug: 'shoes',
      images: [
        'https://images.unsplash.com/photo-1622519408981-79f3f657c748?auto=format&fit=crop&w=800&q=80',
      ],
      brand: 'Adidas',
      description: 'Responsive cushioning for a smooth ride.',
      price: 129.99,
      listPrice: 159.99,
      countInStock: 5,
    },
    {
      name: 'Casio G-Shock GA-2100',
      slug: 'casio-gshock-ga2100',
      categorySlug: 'wrist-watches',
      images: [
        'https://images.unsplash.com/photo-1585386959984-a4155223f2bb?auto=format&fit=crop&w=800&q=80',
      ],
      brand: 'Casio',
      description: 'Shock-resistant and water-resistant up to 200m.',
      price: 99.99,
      listPrice: 120.00,
      countInStock: 10,
    },
  ]

  for (const prod of products) {
    const category = await Category.findOne({ slug: prod.categorySlug })
    if (!category) {
      console.warn(`⚠️ Category '${prod.categorySlug}' not found. Skipping '${prod.name}'`)
      continue
    }

    await Product.updateOne(
      { slug: prod.slug },
      {
        $set: {
          name: prod.name,
          slug: prod.slug,
          categories: [category._id],
          images: prod.images,
          brand: prod.brand,
          description: prod.description,
          price: prod.price,
          listPrice: prod.listPrice,
          countInStock: prod.countInStock,
        }
      },
      { upsert: true }
    )

    console.log(`✅ Seeded: ${prod.name}`)
  }

  console.log('✅ All products seeded.')
  process.exit(0)
}

seedProducts().catch((err) => {
  console.error('❌ Failed to seed products:', err)
  process.exit(1)
})
