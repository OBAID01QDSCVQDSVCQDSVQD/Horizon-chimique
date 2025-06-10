import { getServerSession } from "next-auth";
import { authConfig } from "@/auth";
import { Order } from '@/lib/db/models/order.model';
import Product from '@/lib/db/models/product.model';
import { connectToDatabase } from '@/lib/db';

async function getOrdersByUserId(userId: string) {
  await connectToDatabase();
  const orders = await Order.find({ userId }).lean();
  for (const order of orders as any[]) {
    for (const item of order.cartItems as any[]) {
      const prodId = item.productId || item._id;
      item.product = prodId ? await Product.findById(prodId).lean() : null;
    }
  }
  return orders;
}

export default async function OrdersPage() {
  const session = await getServerSession(authConfig);
  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return <div className="p-8 text-red-600 font-bold">You must be logged in to view your orders.</div>;
  }

  const orders = await getOrdersByUserId(userId);

  if (!orders.length) {
    return <div className="p-8">No orders found.</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-primary dark:text-yellow-400">My Orders</h1>
      <div className="space-y-8">
        {orders.map((order: any) => (
          <div key={order._id.toString()} className="border rounded-xl shadow-lg p-6 bg-white/90 dark:bg-gray-900 hover:shadow-2xl transition">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
              <div>
                <span className="text-gray-500 text-xs dark:text-gray-300">Order ID:</span>
                <span className="ml-2 font-mono text-sm dark:text-gray-200">{order._id.toString()}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs dark:text-gray-300">Date:</span>
                <span className="ml-2 font-semibold dark:text-gray-200">{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs dark:text-gray-300">Status:</span>
                <span className={`ml-2 font-bold ${order.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' : order.status === 'delivered' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>{order.status}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs dark:text-gray-300">Total:</span>
                <span className="ml-2 font-bold text-lg text-primary dark:text-yellow-400">${order.totalPrice}</span>
              </div>
            </div>
            {/* بيانات الشحن */}
            {order.shippingInfo && (
              <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="font-bold mb-1 text-gray-700 dark:text-gray-200">Shipping Info</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <div><span className="font-semibold">Name:</span> {order.shippingInfo.firstName} {order.shippingInfo.lastName}</div>
                  <div><span className="font-semibold">Phone:</span> {order.shippingInfo.phone}</div>
                  <div><span className="font-semibold">Email:</span> {order.shippingInfo.email}</div>
                  <div><span className="font-semibold">Address:</span> {order.shippingInfo.address}, {order.shippingInfo.city}, {order.shippingInfo.country} {order.shippingInfo.postalCode}</div>
                </div>
              </div>
            )}
            {/* المنتجات */}
            <div>
              <h2 className="font-bold mb-2 text-gray-800 dark:text-gray-100">Products:</h2>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {order.cartItems.map((item: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-4 py-3">
                    {/* صورة المنتج */}
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-700" />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded border text-gray-400 text-xs">No Image</div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {item.name ? item.name : <span className="text-red-500 dark:text-red-400">Product not found</span>}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-300">
                        Qty: <span className="font-bold text-gray-700 dark:text-gray-200">{item.quantity}</span>
                        {item.attributes && item.attributes.length > 0 && (
                          item.attributes.map((attr: any, idx: number) => (
                            <span key={idx}> - {attr.attribute}: {attr.value}</span>
                          ))
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-300">Price: <span className="font-bold text-primary dark:text-yellow-400">${item.price}</span></div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 