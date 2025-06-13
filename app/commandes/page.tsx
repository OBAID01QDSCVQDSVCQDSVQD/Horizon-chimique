"use client";

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface ShippingInfo {
  _id: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
}

interface Order {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  cartItems: Array<{
    _id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    variantId: string;
    variantPrice: number;
    variantStock: number;
    variantOptions: {
      [key: string]: string;
    };
  }>;
  totalPrice: number;
  shippingInfo: ShippingInfo;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
}

export default function CommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    phone: '',
    client: '',
    startDate: '',
    endDate: ''
  });
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/orders');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders');
      }

      const data = await response.json();
      if (!data.orders) {
        throw new Error('No orders data received');
      }

      setOrders(data.orders);
      setFilteredOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders?orderId=${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Échec de la mise à jour du statut');

      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' } : order
      ));
      setFilteredOrders(filteredOrders.map(order => 
        order._id === orderId ? { ...order, status: newStatus as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' } : order
      ));
      toast.success('Statut de la commande mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Échec de la mise à jour du statut');
    }
  };

  const applyFilters = () => {
    let result = [...orders];
    
    if (filters.status) {
      result = result.filter(order => order.status === filters.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled');
    }
    if (filters.phone) {
      result = result.filter(order =>
        order.shippingInfo.phone.toLowerCase().includes(filters.phone.toLowerCase())
      );
    }
    if (filters.client) {
      result = result.filter(order =>
        (order.userId.name || '').toLowerCase().includes(filters.client.toLowerCase())
      );
    }
    if (filters.startDate) {
      const from = new Date(filters.startDate);
      result = result.filter(order => new Date(order.createdAt) >= from);
    }
    if (filters.endDate) {
      const to = new Date(filters.endDate);
      result = result.filter(order => new Date(order.createdAt) <= to);
    }
    
    setFilteredOrders(result);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading orders
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchOrders}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Liste des Commandes
        </h1>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="processing">En traitement</option>
              <option value="shipped">Expédié</option>
              <option value="delivered">Livré</option>
              <option value="cancelled">Annulé</option>
            </select>

            <input
              type="text"
              placeholder="Rechercher par téléphone"
              className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
              value={filters.phone}
              onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
            />

            <input
              type="text"
              placeholder="Rechercher par client"
              className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
              value={filters.client}
              onChange={(e) => setFilters({ ...filters, client: e.target.value })}
            />

            <div className="flex gap-2">
              <input
                type="date"
                className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />

              <input
                type="date"
                className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Commande #{order.orderNumber}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>

                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="pending">En attente</option>
                  <option value="processing">En traitement</option>
                  <option value="shipped">Expédié</option>
                  <option value="delivered">Livré</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              {/* Informations de livraison */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Informations de livraison</h3>
                {order.shippingInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Adresse:</span> {order.shippingInfo.address}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Ville:</span> {order.shippingInfo.city}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">État/Région:</span> {order.shippingInfo.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Pays:</span> {order.shippingInfo.country}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Code postal:</span> {order.shippingInfo.postalCode}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Téléphone:</span> {order.shippingInfo.phone}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aucune information de livraison disponible</p>
                )}
              </div>

              {/* Produits */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Produits</h3>
                <ul className="space-y-4">
                  {order.cartItems.map((item) => (
                    <li key={item._id} className="flex gap-4">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Prix: {item.variantPrice || item.price} €
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-300">
                          Quantité: <span className="font-bold">{item.quantity}</span>
                          {item.variantOptions && Object.entries(item.variantOptions).map(([key, value]) => (
                            <span key={`${item._id}-${key}`} className="ml-2">
                              - {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total: {order.totalPrice} €
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 