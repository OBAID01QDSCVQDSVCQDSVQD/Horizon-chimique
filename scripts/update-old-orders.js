const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Define schemas
const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cartItems: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number,
    name: String,
    image: String,
    slug: String,
    category: String,
    brand: String,
    attributes: [{
      attribute: String,
      value: String
    }],
    variantId: { type: mongoose.Schema.Types.ObjectId },
    variantPrice: Number,
    variantStock: Number,
    variantOptions: [Object],
  }],
  totalPrice: Number,
  shippingInfo: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, default: 'pending' },
  orderNumber: { type: String, required: true, unique: true },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: String,
  slug: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand: String,
  images: [String],
  variants: [{
    options: [{
      attributeId: { type: mongoose.Schema.Types.ObjectId },
      value: String
    }],
    price: Number,
    stock: Number
  }],
  countInStock: Number,
  price: Number,
});

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function updateOrders() {
  try {
    const orders = await Order.find({}).lean();
    console.log(`Found ${orders.length} orders to process`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      console.log(`\nProcessing order: ${order._id}`);
      let hasChanges = false;

      if (!order.cartItems || !Array.isArray(order.cartItems)) {
        console.log(`Order ${order._id} has no valid cartItems - skipping`);
        skippedCount++;
        continue;
      }

      for (const item of order.cartItems) {
        // Skip if item has no product or productId
        if (!item.product && !item.productId) {
          console.log(`Item in order ${order._id} has no product or productId - skipping item`);
          continue;
        }

        // Get the product ID from either field
        const productId = item.productId || item.product;
        
        try {
          const product = await Product.findById(productId).lean();
          
          if (!product) {
            console.log(`Product ${productId} not found for order ${order._id} - skipping item`);
            continue;
          }

          // Update item with product details if missing
          const updates = {};
          
          if (!item.name) updates.name = product.name;
          if (!item.slug) updates.slug = product.slug;
          if (!item.image && product.images && product.images.length > 0) {
            updates.image = product.images[0];
          }
          if (!item.category && product.category) {
            updates.category = product.category.toString();
          }
          if (!item.brand && product.brand) {
            updates.brand = product.brand;
          }

          // If we have any updates, apply them
          if (Object.keys(updates).length > 0) {
            Object.assign(item, updates);
            hasChanges = true;
            console.log(`Updated item details for product ${productId}`);
          }

          // Ensure productId is set correctly
          if (!item.productId && item.product) {
            item.productId = item.product;
            hasChanges = true;
            console.log(`Set productId for item in order ${order._id}`);
          }

        } catch (error) {
          console.error(`Error processing item in order ${order._id}:`, error);
          errorCount++;
        }
      }

      if (hasChanges) {
        try {
          await Order.findByIdAndUpdate(order._id, { cartItems: order.cartItems });
          console.log(`Order ${order._id} updated successfully`);
          successCount++;
        } catch (error) {
          console.error(`Error updating order ${order._id}:`, error);
          errorCount++;
        }
      } else {
        console.log(`Order ${order._id} not updated - no changes made`);
        skippedCount++;
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`Total orders processed: ${orders.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log(`Orders skipped: ${skippedCount}`);
    console.log('====================\n');

  } catch (error) {
    console.error('Fatal error in updateOrders:', error);
    throw error;
  } finally {
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }
}

// Run the update
connectToDatabase()
  .then(() => updateOrders())
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
