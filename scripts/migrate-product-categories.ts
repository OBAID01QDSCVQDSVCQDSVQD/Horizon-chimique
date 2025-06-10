const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/YOUR_DB_NAME'; // عدل اسم قاعدة البيانات

const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  image: String,
  description: String,
});
const productSchema = new mongoose.Schema({
  name: String,
  category: mongoose.Schema.Types.Mixed, // قد يكون string أو ObjectId
  // ... باقي الحقول حسب مشروعك
});

const Category = mongoose.model('Category', categorySchema, 'categories');
const Product = mongoose.model('Product', productSchema, 'products');

async function migrateCategories() {
  await mongoose.connect(MONGODB_URI);

  const products = await Product.find({});
  for (const product of products) {
    if (typeof product.category === 'string') {
      const cat = await Category.findOne({ name: product.category });
      if (cat) {
        product.category = cat._id;
        await product.save();
        console.log(`Migrated product ${product.name} to category ${cat.name}`);
      } else {
        console.log(`Category not found for product ${product.name}: ${product.category}`);
      }
    }
  }

  await mongoose.disconnect();
  console.log('Migration finished!');
}

migrateCategories();