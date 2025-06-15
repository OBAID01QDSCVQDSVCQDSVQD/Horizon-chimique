'use client'
import React, { useState } from 'react';

export default function MyOrders2() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearched(false);
    setOrders([]);
    try {
      const res = await fetch(`/api/orders/by-phone?phone=${encodeURIComponent(phone)}`);
      if (!res.ok) throw new Error('Aucune commande trouvée pour ce numéro de téléphone.');
      const data = await res.json();
      setOrders(data.orders);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération des commandes.');
      setOrders([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-2xl md:text-3xl font-bold text-yellow-500 mb-8">Trouvez Vos Commandes</h1>
      <form onSubmit={handleSearch} className="w-full max-w-xs sm:max-w-sm md:max-w-md flex flex-col gap-4 bg-white/80 dark:bg-gray-900 p-6 rounded-xl shadow-lg">
        <label htmlFor="phone" className="text-gray-700 dark:text-gray-200 font-semibold text-sm">Numéro de Téléphone</label>
        <input
          id="phone"
          type="tel"
          placeholder="Entrez votre numéro de téléphone"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-black text-base transition w-full"
        />
        <button
          type="submit"
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded-lg transition text-base shadow-md mt-2"
          disabled={loading}
        >
          {loading ? 'Recherche en cours...' : 'Rechercher les Commandes'}
        </button>
      </form>
      {error && <div className="text-red-500 font-bold mt-4">{error}</div>}
      {searched && !orders.length && !error && (
        <div className="text-gray-500 dark:text-gray-300 mt-4">Aucune commande trouvée pour ce numéro de téléphone.</div>
      )}
      {orders.length > 0 && (
        <div className="w-full max-w-2xl mt-8 space-y-8">
          {orders.map((order: any) => (
            <div key={order._id} className="border rounded-xl shadow-lg p-6 bg-white/90 dark:bg-gray-900 hover:shadow-2xl transition">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <div>
                  <span className="text-gray-500 text-xs dark:text-gray-300">ID de Commande:</span>
                  <span className="ml-2 font-mono text-sm dark:text-gray-200">{order._id}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs dark:text-gray-300">Date:</span>
                  <span className="ml-2 font-semibold dark:text-gray-200">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs dark:text-gray-300">Statut:</span>
                  <span className={`ml-2 font-bold ${order.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' : order.status === 'delivered' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {order.status === 'pending' ? 'En attente' : order.status === 'delivered' ? 'Livré' : order.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs dark:text-gray-300">Total:</span>
                  <span className="ml-2 font-bold text-lg text-primary dark:text-yellow-400">${order.totalPrice}</span>
                </div>
              </div>
              {order.shippingInfo && (
                <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="font-bold mb-1 text-gray-700 dark:text-gray-200">Informations de Livraison</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <div><span className="font-semibold">Nom:</span> {order.shippingInfo.firstName} {order.shippingInfo.lastName}</div>
                    <div><span className="font-semibold">Téléphone:</span> {order.shippingInfo.phone}</div>
                    <div><span className="font-semibold">Email:</span> {order.shippingInfo.email}</div>
                    <div><span className="font-semibold">Adresse:</span> {order.shippingInfo.address}, {order.shippingInfo.city}, {order.shippingInfo.country} {order.shippingInfo.postalCode}</div>
                  </div>
                </div>
              )}
              <div>
                <h2 className="font-bold mb-2 text-gray-800 dark:text-gray-100">Produits:</h2>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {order.cartItems.map((item: any, idx: number) => (
                    <li key={idx} className="flex items-center gap-4 py-3">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-700" />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded border text-gray-400 text-xs">Pas d'Image</div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {item.name ? item.name : <span className="text-red-500 dark:text-red-400">Produit non trouvé</span>}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-300">
                          Qté: <span className="font-bold text-gray-700 dark:text-gray-200">{item.quantity}</span>
                          {item.attributes && item.attributes.length > 0 && (
                            item.attributes.map((attr: any, idx: number) => (
                              <span key={idx}> - {attr.attribute}: {attr.value}</span>
                            ))
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-300">Prix: <span className="font-bold text-primary dark:text-yellow-400">${item.price}</span></div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 