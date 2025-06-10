import 'dotenv/config' // 👈 هذا السطر هو المفتاح
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { connectToDatabase } from '@/lib/db';
import { Category } from '@/lib/db/models/category.model';

async function seedCategories() {
  await connectToDatabase();
  const categories = [
    { name: 'Jeans', slug: 'jeans', image: './public/images/jeans.jpg' },
    { name: 'Shoes', slug: 'shoes', image: './public/images/shoes.jpg' },
    { name: 'T-Shirts', slug: 't-shirts', image: './public/images/tshirts.jpg' },
    { name: 'Wrist+Watches', slug: 'wrist-watches', image: './public/images/watches.jpg' },
  ];

  for (const cat of categories) {
    const result = await Category.updateOne(
      { slug: cat.slug },
      { $setOnInsert: cat },
      { upsert: true }
    );
    if (result.upsertedCount > 0) {
      console.log(`✅ Inserted: ${cat.name}`);
    } else {
      console.log(`ℹ️ Already exists: ${cat.name}`);
    }
  }

  console.log('✅ Categories seeding complete!');
  process.exit(0);
}

seedCategories().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
