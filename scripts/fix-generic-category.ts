import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/db/models/product.model';
import { Category } from '@/lib/db/models/category.model';

async function fixGenericProductsCategory() {
  await connectToDatabase();

  const shoesCategory = await Category.findOne({ slug: 'shoes' });
  if (!shoesCategory) {
    console.error('❌ Category "shoes" not found!');
    return;
  }

  // نجيب جميع المنتجات ثم نفلتر فقط إلي عندهم categories تحتوي على "Shoes"
  const allProducts = await Product.find({});
  const targetProducts = allProducts.filter(p => 
    p.categories && Array.isArray(p.categories) && 
    p.categories.some(cat => cat.toString() === 'Shoes')
  );

  let updated = 0;
  for (const product of targetProducts) {
    // إزالة "Shoes" من المصفوفة وإضافة معرف فئة الأحذية الصحيح
    product.categories = product.categories.filter(cat => 
      cat.toString() !== 'Shoes'
    );
    product.categories.push(shoesCategory._id);
    
    await product.save();
    updated++;
    console.log(`✅ Updated "${product.name}" → Shoes`);
  }

  console.log(`\n🎉 Done. Updated ${updated} product(s).`);
  process.exit(0);
}

fixGenericProductsCategory().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
