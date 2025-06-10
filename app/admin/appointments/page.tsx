"use client";

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Appointment {
  _id: string;
  userId?: { name?: string; email?: string; phone?: string } | null;
  clientName: string;
  phone: string;
  address: string;
  serviceId: string;
  service?: { name: string };
  description?: string;
  photos: string[];
  dates: string[];
  hours: string[];
  status: string;
  googleMapsUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AllAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    phone: '',
    client: '',
    dateFrom: '',
    dateTo: '',
  });
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null);
  const [previewAppointment, setPreviewAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/admin/appointments');
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      setAppointments(data.appointments);
      setFilteredAppointments(data.appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/appointments?appointmentId=${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update appointment status');

      setAppointments(appointments.map(appointment => 
        appointment._id === appointmentId ? { ...appointment, status: newStatus } : appointment
      ));
      setFilteredAppointments(filteredAppointments.map(appointment => 
        appointment._id === appointmentId ? { ...appointment, status: newStatus } : appointment
      ));
      toast.success('Appointment status updated successfully');
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    }
  };

  const applyFilters = () => {
    let result = [...appointments];
    
    if (filters.status) {
      result = result.filter(appointment => appointment.status === filters.status);
    }
    if (filters.phone) {
      result = result.filter(appointment =>
        appointment.phone.toLowerCase().includes(filters.phone.toLowerCase())
      );
    }
    if (filters.client) {
      result = result.filter(appointment =>
        appointment.clientName.toLowerCase().includes(filters.client.toLowerCase())
      );
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      result = result.filter(appointment => new Date(appointment.createdAt) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      result = result.filter(appointment => new Date(appointment.createdAt) <= to);
    }
    
    setFilteredAppointments(result);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg">Chargement en cours...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-primary dark:text-yellow-400">
        Gestion des Rendez-vous
      </h1>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <select
            className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Tous les statuts</option>
            <option value="en attente">En attente</option>
            <option value="confirmé">Confirmé</option>
            <option value="annulé">Annulé</option>
            <option value="terminé">Terminé</option>
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
            Appliquer le filtre
          </button>
        </div>
      </div>

      {/* Liste des rendez-vous */}
      <div className="space-y-6">
        {filteredAppointments.length === 0 && !loading && (
          <div className="text-center text-gray-500 dark:text-gray-300 py-8">
            Aucun rendez-vous disponible
          </div>
        )}
        {filteredAppointments.map((appointment) => (
          <div
            key={appointment._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
              <div>
                <span className="text-gray-500 text-sm dark:text-gray-300">Client :</span>
                <span className="ml-2 font-semibold dark:text-gray-200">{appointment.clientName}</span>
              </div>
              <div>
                <span className="text-gray-500 text-sm dark:text-gray-300">Date :</span>
                <span className="ml-2 font-semibold dark:text-gray-200">
                  {formatDate(appointment.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-sm dark:text-gray-300">Statut :</span>
                <select
                  value={appointment.status}
                  onChange={e => handleStatusChange(appointment._id, e.target.value)}
                  className={`ml-2 px-2 py-1 rounded text-xs font-bold border w-full
                    ${appointment.status === 'en attente' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      : appointment.status === 'terminé' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : appointment.status === 'annulé' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : appointment.status === 'confirmé' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : ''}
                  `}
                >
                  <option value="en attente">En attente</option>
                  <option value="confirmé">Confirmé</option>
                  <option value="annulé">Annulé</option>
                  <option value="terminé">Terminé</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500 text-sm dark:text-gray-300">Téléphone :</div>
                <div className="font-semibold dark:text-gray-200">{appointment.phone}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm dark:text-gray-300">Adresse :</div>
                <div className="font-semibold dark:text-gray-200">{appointment.address}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm dark:text-gray-300">Service :</div>
                <div className="font-semibold dark:text-gray-200">
                  {typeof appointment.serviceId === 'object' && appointment.serviceId !== null && 'name' in appointment.serviceId
                    ? (appointment.serviceId as { name: string }).name
                    : appointment.serviceId}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-sm dark:text-gray-300">Description :</div>
                <div className="font-semibold dark:text-gray-200">{appointment.description || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm dark:text-gray-300">Dates :</div>
                <div className="font-semibold dark:text-gray-200">{appointment.dates?.join(', ')}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm dark:text-gray-300">Heures :</div>
                <div className="font-semibold dark:text-gray-200">{appointment.hours?.join(', ')}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm dark:text-gray-300">Google Maps :</div>
                <div className="font-semibold dark:text-blue-500">
                  {appointment.googleMapsUrl ? (
                    <a href={appointment.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="underline">Voir sur la carte</a>
                  ) : '-'}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-sm dark:text-gray-300">Photos :</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {appointment.photos && appointment.photos.length > 0 ? (
                    appointment.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border cursor-pointer"
                        onClick={() => { setPreviewAppointment(appointment); setPreviewPhotoIndex(idx); }}
                      />
                    ))
                  ) : (
                    <span className="text-gray-400">Aucune photo</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal مع التنقل */}
      {previewAppointment && previewPhotoIndex !== null && previewAppointment.photos && previewAppointment.photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => { setPreviewPhotoIndex(null); setPreviewAppointment(null); }}
        >
          <button
            className="absolute left-8 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition border border-gray-200 group"
            onClick={e => { e.stopPropagation(); setPreviewPhotoIndex(i => (i! > 0 ? i! - 1 : i)); }}
            disabled={previewPhotoIndex === 0}
            aria-label="Précédent"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="white"/>
              <path d="M14.5 17L10 12L14.5 7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <img
            src={previewAppointment.photos[previewPhotoIndex]}
            alt="Aperçu"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border-4 border-white"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute right-8 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition border border-gray-200 group"
            onClick={e => { e.stopPropagation(); setPreviewPhotoIndex(i => (i! < previewAppointment.photos.length - 1 ? i! + 1 : i)); }}
            disabled={previewPhotoIndex === previewAppointment.photos.length - 1}
            aria-label="Suivant"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="white"/>
              <path d="M9.5 7L14 12L9.5 17" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="absolute top-8 right-8 text-white text-3xl font-bold"
            onClick={() => { setPreviewPhotoIndex(null); setPreviewAppointment(null); }}
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
} 