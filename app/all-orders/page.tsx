"use client";

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Order {
  _id: string;
  userId?: { name?: string; email?: string; phone?: string } | null;
  cartItems: {
    _id: string;
    productId?: string;
    name: string;
    image?: string;
    quantity: number;
    price: number;
    slug: string;
    category: string;
    brand: string;
    attributes: {
      _id: string;
      attribute: string;
      value: string;
    }[];
    variantId?: string;
    variantPrice?: number;
    variantStock?: number;
    variantOptions?: {
      _id: string;
      attributeId: string;
      value: string;
    }[];
  }[];
  totalPrice: number;
  shippingInfo: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  status: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
}

export default function AllOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    phone: '',
    client: '',
    dateFrom: '',
    dateTo: '',
  });
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data.orders);
      setFilteredOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders?orderId=${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update order status');

      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      setFilteredOrders(filteredOrders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const applyFilters = () => {
    let result = [...orders];
    
    if (filters.status) {
      result = result.filter(order => order.status === filters.status);
    }
    if (filters.phone) {
      result = result.filter(order =>
        order.shippingInfo.phone.toLowerCase().includes(filters.phone.toLowerCase())
      );
    }
    if (filters.client) {
      result = result.filter(order =>
        (order.userId?.name || '').toLowerCase().includes(filters.client.toLowerCase())
      );
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      result = result.filter(order => new Date(order.createdAt) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      result = result.filter(order => new Date(order.createdAt) <= to);
    }
    
    setFilteredOrders(result);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-primary dark:text-yellow-400">
        جميع الطلبات
      </h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <select
            className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="processing">قيد المعالجة</option>
            <option value="shipped">تم الشحن</option>
            <option value="delivered">تم التوصيل</option>
            <option value="cancelled">ملغي</option>
          </select>

          <input
            type="text"
                          placeholder="Rechercher par numéro de téléphone"
            className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
            value={filters.phone}
            onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
          />

          <input
            type="text"
                          placeholder="Rechercher par nom du client"
            className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
            value={filters.client}
            onChange={(e) => setFilters({ ...filters, client: e.target.value })}
          />

          <input
            type="date"
            className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />

          <input
            type="date"
            className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />

          <button
            onClick={applyFilters}
            className="bg-primary text-white rounded-lg p-2 hover:bg-primary/90 transition"
          >
            تطبيق الفلتر
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.map((order) => (
          <div
            key={order._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
              <div>
                <span className="text-gray-500 text-sm dark:text-gray-300">رقم الطلب:</span>
                <span className="ml-2 font-mono text-sm dark:text-gray-200">{order.orderNumber}</span>
              </div>
              <div>
                <span className="text-gray-500 text-sm dark:text-gray-300">التاريخ:</span>
                <span className="ml-2 font-semibold dark:text-gray-200">
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-sm dark:text-gray-300">الحالة:</span>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  className={`ml-2 font-bold rounded-lg p-1 ${
                    order.status === 'pending'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : order.status === 'delivered'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="processing">قيد المعالجة</option>
                  <option value="shipped">تم الشحن</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>
              <div>
                <span className="text-gray-500 text-sm dark:text-gray-300">المجموع:</span>
                <span className="ml-2 font-bold text-lg text-primary dark:text-yellow-400">
                  ${order.totalPrice}
                </span>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="font-bold mb-2 text-gray-700 dark:text-gray-200">معلومات الشحن</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <span className="font-semibold">الاسم:</span>{' '}
                  {order.shippingInfo.firstName} {order.shippingInfo.lastName}
                </div>
                <div>
                  <span className="font-semibold">الهاتف:</span> {order.shippingInfo.phone}
                </div>
                <div>
                  <span className="font-semibold">البريد الإلكتروني:</span> {order.shippingInfo.email}
                </div>
                <div>
                  <span className="font-semibold">العنوان:</span>{' '}
                  {order.shippingInfo.address}, {order.shippingInfo.city},{' '}
                  {order.shippingInfo.country} {order.shippingInfo.postalCode}
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <h2 className="font-bold mb-2 text-gray-800 dark:text-gray-100">المنتجات:</h2>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {order.cartItems.map((item) => (
                  <li key={item._id} className="flex items-center gap-4 py-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded border text-gray-400 text-xs">
                        Aucune image
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-300">
                        الكمية: <span className="font-bold">{item.quantity}</span>
                        {item.attributes?.map((attr) => (
                          <span key={attr._id}>
                            {' '}
                            - {attr.attribute}: {attr.value}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-300">
                        السعر:{' '}
                        <span className="font-bold text-primary dark:text-yellow-400">
                          ${item.variantPrice || item.price}
                        </span>
                      </div>
                      {item.variantStock !== undefined && (
                        <div className="text-xs text-gray-500 dark:text-gray-300">
                          المخزون: <span className="font-bold">{item.variantStock}</span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Aucune commande ne correspond aux critères de recherche
          </div>
        )}
      </div>
    </div>
  );
}