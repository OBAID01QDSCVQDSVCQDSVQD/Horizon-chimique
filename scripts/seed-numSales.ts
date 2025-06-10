import { connectToDatabase } from '../lib/db/mongoose';
import { Order } from '../lib/db/models/order.model';
import Product from '../lib/db/models/product.model';

async function updateNumSales() {
  await connectToDatabase();
  console.log('Connected to DB');

  // جلب كل الطلبات
  const orders = await Order.find({});
  const salesMap = new Map<string, number>();

  // جمع الكميات المباعة لكل منتج
  for (const order of orders) {
    for (const item of order.cartItems) {
      const productId = item.productId?.toString() || item.product?.toString();
      if (!productId) continue;
      salesMap.set(productId, (salesMap.get(productId) || 0) + (item.quantity || 0));
    }
  }

  // تحديث كل منتج
  let updated = 0;
  for (const [productId, numSales] of salesMap.entries()) {
    await Product.findByIdAndUpdate(productId, { numSales });
    updated++;
  }
  console.log(`تم تحديث عدد المبيعات (${updated}) منتج بنجاح.`);
  process.exit(0);
}

updateNumSales().catch(e => { console.error(e); process.exit(1); });
