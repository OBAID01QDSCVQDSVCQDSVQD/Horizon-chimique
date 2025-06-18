import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/YOUR_DB_NAME'; // عدل اسم قاعدة البيانات

const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  image: String,
  description: String,
});
const productSchema = new mongoose.Schema({
  name: String,
  categories: [mongoose.Schema.Types.Mixed], // مصفوفة قد تحتوي على string أو ObjectId
  // ... باقي الحقول حسب مشروعك
});

const Category = mongoose.model('Category', categorySchema, 'categories');
const Product = mongoose.model('Product', productSchema, 'products');

async function migrateCategories() {
  await mongoose.connect(MONGODB_URI);

  const products = await Product.find({});
  for (const product of products) {
    if (product.categories && Array.isArray(product.categories)) {
      let needsUpdate = false;
      const newCategories = [];
      
      for (const category of product.categories) {
        if (typeof category === 'string') {
          const cat = await Category.findOne({ name: category });
          if (cat) {
            newCategories.push(cat._id);
            console.log(`Migrated product ${product.name} category "${category}" to ObjectId`);
            needsUpdate = true;
          } else {
            console.log(`Category not found for product ${product.name}: ${category}`);
            newCategories.push(category); // Keep original if not found
          }
        } else {
          newCategories.push(category); // Keep ObjectId as is
        }
      }
      
      if (needsUpdate) {
        product.categories = newCategories;
        await product.save();
      }
    }
  }

  await mongoose.disconnect();
  console.log('Migration finished!');
}

migrateCategories();