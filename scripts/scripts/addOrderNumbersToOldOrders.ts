import mongoose from 'mongoose';
import { Order } from '../../lib/db/models/order.model';
import { connectToDatabase } from '../../lib/db';

async function addOrderNumbers() {
  await connectToDatabase();
  const orders = await Order.find({ orderNumber: { $exists: false } }).sort({ createdAt: 1 });
  // Find the last orderNumber in the DB (if any)
  const lastOrderWithNumber = await Order.findOne({ orderNumber: { $exists: true } }).sort({ orderNumber: -1 });
  let nextNumber = 1;
  if (lastOrderWithNumber && lastOrderWithNumber.orderNumber) {
    const match = lastOrderWithNumber.orderNumber.match(/^(\d{4})-(\d{5,})$/);
    if (match) {
      nextNumber = parseInt(match[2], 10) + 1;
    }
  }
  for (const order of orders) {
    const year = order.createdAt.getFullYear();
    const orderNumber = `${year}-${String(nextNumber).padStart(5, '0')}`;
    order.orderNumber = orderNumber;
    await order.save();
    console.log(`Order ${order._id} updated to ${orderNumber}`);
    nextNumber++;
  }
  console.log('All old orders updated!');
  process.exit(0);
}

addOrderNumbers().catch(err => {
  console.error(err);
  process.exit(1);
}); 