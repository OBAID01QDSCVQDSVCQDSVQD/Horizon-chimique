"use client";
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { toast } from 'react-hot-toast';
import { PriceDisplay } from '@/components/shared/price-display'

interface Order {
  _id: string;
  userId?: { name?: string; email?: string; phone?: string } | null;
  cartItems: {
    productId: string;
    name: string;
    image?: string;
    quantity: number;
    price: number;
    attributes?: { attribute: string; value: string }[];
  }[];
  totalPrice: number;
  shippingInfo: any;
  status: string;
  createdAt: string;
  orderNumber?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'paid', label: 'Payée' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'cancelled', label: 'Annulée' },
];

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    phone: '',
    client: '',
    dateFrom: '',
    dateTo: '',
  });
  
  // إضافة حالة التصفح
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [selectedLimit, setSelectedLimit] = useState(10)

  useEffect(() => {
    fetchOrders();
  }, [filters, selectedLimit]);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.phone) params.append('phone', filters.phone);
      if (filters.client) params.append('client', filters.client);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      params.append('page', page.toString());
      params.append('limit', selectedLimit.toString());

      const url = `/api/admin/orders?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      console.log('Orders data:', data);
      
      if (res.ok) {
        setOrders(data.orders || []);
        setPagination(data.pagination || {
          page: 1,
          limit: selectedLimit,
          total: 0,
          pages: 0
        });
      } else {
        toast.error('Erreur lors du chargement des commandes');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erreur lors du chargement des commandes');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ status: '', phone: '', client: '', dateFrom: '', dateTo: '' });
  };

  const applyFilters = () => {
    fetchOrders(1);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders?orderId=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du statut');
      }
      const data = await res.json();
      setOrders(orders => orders.map(o => o._id === id ? { ...o, status: newStatus } : o));
      toast.success('Statut de la commande mis à jour');
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour du statut de la commande');
    }
  };

  // حساب عدد الطلبات الجديدة اليوم وهذا الأسبوع
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = now.getDay() || 7; // 0 (Sunday) becomes 7
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
  const ordersToday = orders.filter(order => new Date(order.createdAt) >= startOfToday).length;
  const ordersThisWeek = orders.filter(order => new Date(order.createdAt) >= startOfWeek).length;

  console.log('orders createdAt:', orders.map(o => o.createdAt));
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    console.log('Order:', o.createdAt, 'Parsed:', d, '>= startOfToday:', d >= startOfToday, '>= startOfWeek:', d >= startOfWeek);
  });

  const exportToExcel = () => {
    const data = orders.map(order => ({
      'N°': order.orderNumber || order._id.slice(-6).toUpperCase(),
      'Client': order.userId?.name || `${order.shippingInfo?.firstName || ''} ${order.shippingInfo?.lastName || ''}`,
      'Téléphone': order.shippingInfo?.phone || '-',
      'Adresse': `${order.shippingInfo?.address || ''} ${order.shippingInfo?.city || ''} ${order.shippingInfo?.country || ''} ${order.shippingInfo?.postalCode || ''}`.trim(),
      'Total': order.totalPrice,
      'Statut': statusLabels[order.status] || order.status,
      'Date': new Date(order.createdAt).toLocaleDateString('fr-FR'),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Commandes');
    XLSX.writeFile(wb, 'commandes.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(10);
    doc.text('Liste des commandes', 10, 10);
    const headers = [['N°', 'Client', 'Téléphone', 'Adresse', 'Total', 'Statut', 'Date']];
    const rows = orders.map(order => [
      order.orderNumber || order._id.slice(-6).toUpperCase(),
      order.userId?.name || `${order.shippingInfo?.firstName || ''} ${order.shippingInfo?.lastName || ''}`,
      order.shippingInfo?.phone || '-',
      `${order.shippingInfo?.address || ''} ${order.shippingInfo?.city || ''} ${order.shippingInfo?.country || ''} ${order.shippingInfo?.postalCode || ''}`.trim(),
      order.totalPrice,
      statusLabels[order.status] || order.status,
      new Date(order.createdAt).toLocaleDateString('fr-FR'),
    ]);
    // Simple table rendering
    let y = 20;
    headers.concat(rows).forEach(row => {
      let x = 10;
      row.forEach(cell => {
        doc.text(String(cell), x, y);
        x += 35;
      });
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save('commandes.pdf');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-400"></div>
        <span className="ml-3 text-lg">Chargement en cours...</span>
      </div>
    );
  }
  if (orders.length === 0) {
    return <div className="text-center text-gray-500">Aucune commande disponible</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100 dark:bg-gray-950 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion des Commandes</h1>
      </div>
      <div className="flex gap-4 mb-6 overflow-x-auto whitespace-nowrap">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 flex flex-col items-center border-l-4 border-blue-500 min-w-[160px]">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{ordersToday}</div>
          <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">Commandes aujourd'hui</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 flex flex-col items-center border-l-4 border-green-500 min-w-[160px]">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{ordersThisWeek}</div>
          <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">Commandes cette semaine</div>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow hover:bg-green-50 dark:hover:bg-green-800 text-green-600 dark:text-green-400 text-sm font-semibold transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 2h8v4H8z" /></svg>
          Exporter Excel
        </button>
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow hover:bg-red-50 dark:hover:bg-red-800 text-red-600 dark:text-red-400 text-sm font-semibold transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          Exporter PDF
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl shadow hover:bg-blue-50 text-blue-600 font-medium transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17V13.414a1 1 0 00-.293-.707L3 6.707A1 1 0 013 6V4z" /></svg>
          Filtres
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Afficher:</label>
            <select
              value={selectedLimit}
              onChange={(e) => {
                setSelectedLimit(Number(e.target.value));
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {pagination.total > 0 && (
              <>
                Affichage {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 
                sur {pagination.total} commandes
              </>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">N°</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Adresse</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order, idx) => (
                <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-200 whitespace-nowrap">{order.orderNumber || order._id.slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {order.userId?.name
                      ? order.userId.name
                      : (order.shippingInfo?.firstName || '') + ' ' + (order.shippingInfo?.lastName || '-')}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{order.shippingInfo?.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {order.shippingInfo?.address || '-'}{order.shippingInfo?.city ? ', ' + order.shippingInfo.city : ''}{order.shippingInfo?.country ? ', ' + order.shippingInfo.country : ''}{order.shippingInfo?.postalCode ? ' ' + order.shippingInfo.postalCode : ''}
                  </td>
                  <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                    <PriceDisplay price={Number(order.totalPrice)} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[order.status] || 'bg-gray-200 text-gray-800'}`}>{statusLabels[order.status] || order.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <button
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      onClick={() => setSelectedOrder(order)}
                    >Détails</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* أزرار التنقل بين الصفحات */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => fetchOrders(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchOrders(pageNum)}
                    className={`px-3 py-2 rounded-lg ${
                      pageNum === pagination.page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => fetchOrders(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Filters Modal/Panel */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setFiltersOpen(false)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-2 relative animate-fade-in max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setFiltersOpen(false)}
              className="absolute top-3 right-3 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 text-2xl font-bold focus:outline-none"
              aria-label="Fermer"
            >
              &times;
            </button>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filtres de recherche</h2>
                <button
                  onClick={resetFilters}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Réinitialiser
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Statut</label>
                  <select
                    value={filters.status}
                    onChange={e => handleFilterChange('status', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={filters.phone}
                    onChange={e => handleFilterChange('phone', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rechercher par téléphone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nom du client</label>
                  <input
                    type="text"
                    value={filters.client}
                    onChange={e => handleFilterChange('client', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rechercher par nom du client"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Date de début</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={e => handleFilterChange('dateFrom', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Date de fin</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={e => handleFilterChange('dateTo', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setFiltersOpen(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition mt-2"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}
      {/* Modal for order details */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen py-4 backdrop-blur-sm bg-black/40" onClick={() => setSelectedOrder(null)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl mx-2 p-0 relative animate-fade-in max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold shadow focus:outline-none z-10"
              aria-label="Fermer"
            >
              &times;
            </button>
            <div className="p-8 space-y-8">
              {/* معلومات عامة */}
              <div className="rounded-2xl shadow bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-950 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-blue-700 dark:text-blue-200">
                  <div className="text-xs text-blue-500">N° de commande</div>
                  <div className="font-mono font-bold text-lg">{selectedOrder.orderNumber || selectedOrder._id}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-500">Date</div>
                  <div className="font-semibold">{new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-500">Statut</div>
                  <select
                    value={selectedOrder.status}
                    onChange={e => handleStatusChange(selectedOrder._id, e.target.value)}
                    className={`px-2 py-1 rounded text-xs font-bold border w-full ${statusColors[selectedOrder.status] || 'bg-gray-200 text-gray-800'}`}
                  >
                    {statusOptions.filter(opt => opt.value).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-xs text-blue-500">Total</div>
                  <div className="font-bold text-blue-700 dark:text-blue-300 text-lg">
                    <PriceDisplay price={Number(selectedOrder.totalPrice)} />
                  </div>
                </div>
              </div>
              {/* معلومات العميل */}
              <div className="rounded-2xl shadow bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6">
                <div className="mb-2 text-gray-700 dark:text-gray-200 font-semibold text-base">Client</div>
                <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-1 text-sm">
                  <div><span className="font-bold">Nom:</span> {selectedOrder.userId?.name ? selectedOrder.userId.name : (selectedOrder.shippingInfo?.firstName || '') + ' ' + (selectedOrder.shippingInfo?.lastName || '-')}</div>
                  <div><span className="font-bold">Email:</span> {selectedOrder.userId?.email || selectedOrder.shippingInfo?.email || '-'}</div>
                  <div><span className="font-bold">Téléphone:</span> {selectedOrder.shippingInfo?.phone || '-'}</div>
                </div>
              </div>
              {/* معلومات الشحن */}
              <div className="rounded-2xl shadow bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-950 p-6">
                <div className="mb-2 text-green-700 dark:text-green-200 font-semibold text-base">Adresse de livraison</div>
                <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-1 text-sm">
                  <div><span className="font-bold">Adresse:</span> {selectedOrder.shippingInfo?.address || '-'}{selectedOrder.shippingInfo?.city ? ', ' + selectedOrder.shippingInfo.city : ''}{selectedOrder.shippingInfo?.country ? ', ' + selectedOrder.shippingInfo.country : ''}{selectedOrder.shippingInfo?.postalCode ? ' ' + selectedOrder.shippingInfo.postalCode : ''}</div>
                  <div><span className="font-bold">Ville:</span> {selectedOrder.shippingInfo?.city || '-'}</div>
                  <div><span className="font-bold">Code Postal:</span> {selectedOrder.shippingInfo?.postalCode || '-'}</div>
                  <div><span className="font-bold">Pays:</span> {selectedOrder.shippingInfo?.country || '-'}</div>
                </div>
              </div>
              {/* المنتجات */}
              <div className="rounded-2xl shadow bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-950 p-6">
                <div className="mb-2 text-yellow-700 dark:text-yellow-200 font-semibold text-base">Produits</div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedOrder.cartItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-6 py-6 hover:bg-yellow-50 dark:hover:bg-yellow-900 rounded-xl transition">
                      {item.image && <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow" />}
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 dark:text-white mb-2 text-lg">{item.name}</div>
                        {item.attributes && item.attributes.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {item.attributes.map((attr, i) => (
                              <span key={i} className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full px-3 py-1 text-xs font-semibold">{attr.attribute} : {attr.value}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-6 text-xs text-gray-500 dark:text-gray-300 mt-2">
                          <div>Qté: <span className="font-bold text-gray-700 dark:text-gray-200">{item.quantity}</span></div>
                          <div>Prix: <span className="font-bold text-primary dark:text-yellow-400">
                            <PriceDisplay price={Number(item.price)} />
                          </span></div>
                          <div>Total: <span className="font-bold">
                            <PriceDisplay price={Number(item.price * item.quantity)} />
                          </span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 