"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FaEye, FaEdit, FaTrash, FaSearch, FaFilePdf } from 'react-icons/fa'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface Garantie {
  _id: string;
  company: string;
  name: string;
  phone: string;
  address: string;
  surface: { type: string; value: number }[];
  montant: number;
  installDate: string;
  duration: number;
  notes?: string;
  status: string;
  createdAt: string;
  maintenances?: { date: string }[];
}

const statusLabels: Record<string, string> = {
  APPROVED: "Approuvée",
  NOT_APPROVED: "En attente",
};

export default function AdminGarantiesPage() {
  const { data: session, status } = useSession()
  const [garanties, setGaranties] = useState<Garantie[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Garantie | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState<Partial<Garantie> | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchPhone, setSearchPhone] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchCompany, setSearchCompany] = useState('')
  const [searchStatus, setSearchStatus] = useState('')
  const [searchDate, setSearchDate] = useState('')

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    fetchGarantiesWithFilters();
  }, [session, status])

  const fetchGarantiesWithFilters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchPhone) params.append('phone', searchPhone);
      if (searchName) params.append('name', searchName);
      if (searchCompany) params.append('company', searchCompany);
      if (searchStatus) params.append('status', searchStatus);
      if (searchDate) params.append('installDate', searchDate);

      const url = `/api/garanties?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      setGaranties(data.garanties || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des garanties");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (garantie: Garantie) => {
    setSelected(garantie);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette garantie ?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/garanties/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setGaranties(gs => gs.filter(g => g._id !== id));
      toast.success("Garantie supprimée");
    } catch (e) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/garanties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour du statut");
      setGaranties(gs => gs.map(g => g._id === id ? { ...g, status: newStatus } : g));
      toast.success("Statut mis à jour");
    } catch (e) {
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleEdit = (garantie: Garantie) => {
    setEditData(garantie);
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editData?._id) return;
    try {
      const res = await fetch(`/api/garanties/${editData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error("Erreur lors de la modification");
      setGaranties(gs => gs.map(g => g._id === editData._id ? { ...g, ...editData } : g));
      toast.success("Garantie modifiée");
      setShowEditModal(false);
    } catch (e) {
      toast.error("Erreur lors de la modification");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-400"></div>
        <span className="ml-3">Chargement en cours...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
<div className="w-full p-4 pl-5 flex-1">
          <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700">Mes garanties</h1>
          {['APPLICATEUR', 'ADMIN'].includes(session?.user?.role ?? '') && (
            <Link
              href="/garantie/create"
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded-xl text-base shadow transition"
            >
              + Ajouter une nouvelle garantie
            </Link>
          )}
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl shadow hover:bg-blue-50 text-blue-600 font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 14.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-2.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filtres
          </button>
        </div>

        {/* نافذة الفلاتر */}
        {showFilters && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative animate-fade-in">
              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold"
                aria-label="Fermer"
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-6 text-blue-700">Filtres avancés</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  fetchGarantiesWithFilters();
                  setShowFilters(false);
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  value={searchPhone}
                  onChange={e => setSearchPhone(e.target.value)}
                  placeholder="Téléphone"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  value={searchName}
                  onChange={e => setSearchName(e.target.value)}
                  placeholder="Client"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  value={searchCompany}
                  onChange={e => setSearchCompany(e.target.value)}
                  placeholder="Société"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <select
                  value={searchStatus}
                  onChange={e => setSearchStatus(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Tous les statuts</option>
                  <option value="APPROVED">Approuvée</option>
                  <option value="NOT_APPROVED">En attente</option>
                </select>
                <input
                  type="date"
                  value={searchDate}
                  onChange={e => setSearchDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-700 text-white rounded-lg py-2 font-bold hover:bg-blue-800 transition"
                  >
                    Appliquer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchPhone('');
                      setSearchName('');
                      setSearchCompany('');
                      setSearchStatus('');
                      setSearchDate('');
                      fetchGarantiesWithFilters();
                      setShowFilters(false);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 rounded-lg py-2 font-bold hover:bg-gray-300 transition"
                  >
                    Réinitialiser
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-500">Chargement...</div>
        ) : garanties.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {searchPhone 
              ? "Aucune garantie trouvée pour ce numéro de téléphone"
              : "Aucune garantie trouvée"}
          </div>
        ) : (
          <div className="overflow-x-auto mt-6">
            <table className="min-w-full bg-white border rounded-xl shadow">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left font-semibold">Société</th>
                  <th className="py-3 px-4 text-left font-semibold">Client</th>
                  <th className="py-3 px-4 text-left font-semibold">Téléphone</th>
                  <th className="py-3 px-4 text-left font-semibold">Statut</th>
                  <th className="py-3 px-4 text-left font-semibold">Date</th>
                  <th className="py-3 px-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {garanties.map((g) => (
                  <tr key={g._id} className="border-b hover:bg-blue-50 transition">
                    <td className="py-2 px-4">{g.company}</td>
                    <td className="py-2 px-4">{g.name}</td>
                    <td className="py-2 px-4">{g.phone}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${g.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {g.status === "APPROVED" ? "Approuvée" : "En attente"}
                      </span>
                    </td>
                    <td className="py-2 px-4">{g.installDate?.split('-').reverse().join('/')}</td>
                    <td className="py-2 px-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleView(g)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-full transition"
                          title="Voir"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(g)}
                          className="text-yellow-600 hover:text-yellow-800 p-2 rounded-full transition"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(g._id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-full transition"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <a
                          href={`/api/garantie/${g._id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 hover:text-red-800 p-2 rounded-full transition"
                          title="Télécharger PDF"
                        >
                          <FaFilePdf className="w-5 h-5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Modal de visualisation */}
        {showModal && selected && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen py-4 backdrop-blur-sm bg-black/40" onClick={() => setShowModal(false)}>
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-2 p-0 relative animate-fade-in max-h-[90vh] overflow-y-auto border border-gray-200"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 bg-red-100 text-red-600 hover:bg-red-200 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold shadow focus:outline-none z-10"
                aria-label="Fermer"
              >
                &times;
              </button>
              <div className="p-8 space-y-6">
                <div className="rounded-2xl shadow bg-gradient-to-r from-blue-50 to-blue-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="text-blue-700">
                    <div className="text-xs text-blue-500">Société</div>
                    <div className="font-bold text-lg">{selected.company}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-500">Client</div>
                    <div className="font-semibold">{selected.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-500">Téléphone</div>
                    <div className="font-semibold">{selected.phone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-500">Statut</div>
                    <select
                      className="px-2 py-1 rounded text-xs font-bold border w-full bg-yellow-50"
                      value={selected.status}
                      onChange={e => handleStatusChange(selected._id, e.target.value)}
                      disabled={statusLoading}
                    >
                      <option value="APPROVED">Approuvée</option>
                      <option value="NOT_APPROVED">En attente</option>
                    </select>
                  </div>
                </div>
                <div className="rounded-2xl shadow bg-gradient-to-r from-gray-50 to-gray-100 p-6">
                  <div className="mb-2 text-gray-700 font-semibold text-base">Détails</div>
                  <div className="flex flex-col gap-3 text-sm">
                    <div><span className="font-bold">Adresse:</span> {selected.address}</div>
                    <div><span className="font-bold">Surface:</span> {
                      Array.isArray(selected.surface)
                        ? selected.surface.map(s => `${s.type}: ${s.value}`).join(', ')
                        : typeof selected.surface === 'object' && selected.surface !== null
                          ? JSON.stringify(selected.surface)
                          : selected.surface || '-'
                    }</div>
                    <div><span className="font-bold">Montant:</span> {selected.montant} DT</div>
                    <div><span className="font-bold">Date d'installation:</span> {selected.installDate}</div>
                    <div><span className="font-bold">Durée:</span> {selected.duration} mois</div>
                    <div><span className="font-bold">Notes:</span> {selected.notes || '-'}</div>
                    <div><span className="font-bold">Créée le:</span> {selected.createdAt?.slice(0, 10).split("-").reverse().join("/")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal de modification */}
        {showEditModal && editData && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen py-4 backdrop-blur-sm bg-black/40" onClick={() => setShowEditModal(false)}>
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-2 p-0 relative animate-fade-in max-h-[90vh] overflow-y-auto border border-gray-200"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-5 right-5 bg-red-100 text-red-600 hover:bg-red-200 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold shadow focus:outline-none z-10"
                aria-label="Fermer"
              >
                &times;
              </button>
              <div className="p-8 space-y-6">
                <div className="rounded-2xl shadow bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 mb-4">
                  <div className="text-lg font-bold text-yellow-700 mb-2">Modifier la garantie</div>
                  <div className="space-y-3">
                    <input className="w-full border rounded px-2 py-1" placeholder="Société" value={editData.company || ''} onChange={e => setEditData({ ...editData, company: e.target.value })} />
                    <input className="w-full border rounded px-2 py-1" placeholder="Client" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                    <input className="w-full border rounded px-2 py-1" placeholder="Téléphone" value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                    <input className="w-full border rounded px-2 py-1" placeholder="Adresse" value={editData.address || ''} onChange={e => setEditData({ ...editData, address: e.target.value })} />
                    {/* Surface array */}
                    <div className="space-y-2">
                      <div className="font-semibold text-gray-700">Surfaces</div>
                      {Array.isArray(editData.surface) ? editData.surface.map((s, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            className="border rounded px-2 py-1 bg-gray-100 text-gray-500 w-32"
                            value={s.type || ''}
                            disabled
                          />
                          <input
                            className="border rounded px-2 py-1 w-24"
                            type="number"
                            value={s.value ?? ''}
                            onChange={e => {
                              const newSurface = Array.isArray(editData.surface) ? [...editData.surface] : [];
                              newSurface[i] = { ...newSurface[i], value: Number(e.target.value) };
                              setEditData({ ...editData, surface: newSurface });
                            }}
                          />
                        </div>
                      )) : null}
                    </div>
                    <input className="w-full border rounded px-2 py-1" placeholder="Montant" type="number" value={editData.montant || ''} onChange={e => setEditData({ ...editData, montant: Number(e.target.value) })} />
                    <input className="w-full border rounded px-2 py-1" placeholder="Date d'installation" type="date" value={editData.installDate || ''} onChange={e => setEditData({ ...editData, installDate: e.target.value })} />
                    <input className="w-full border rounded px-2 py-1" placeholder="Durée (mois)" type="number" value={editData.duration || ''} onChange={e => setEditData({ ...editData, duration: Number(e.target.value) })} />
                    <textarea className="w-full border rounded px-2 py-1" placeholder="Notes" value={editData.notes || ''} onChange={e => setEditData({ ...editData, notes: e.target.value })} />
                    {/* Maintenances array */}
                    <div className="space-y-2">
                      <div className="font-semibold text-gray-700">Maintenances</div>
                      {Array.isArray(editData.maintenances) ? editData.maintenances.map((m, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            className="border rounded px-2 py-1 w-40"
                            type="date"
                            value={m.date || ''}
                            onChange={e => {
                              const newMaint = Array.isArray(editData.maintenances) ? [...editData.maintenances] : [];
                              newMaint[i] = { ...newMaint[i], date: e.target.value };
                              setEditData({ ...editData, maintenances: newMaint });
                            }}
                          />
                        </div>
                      )) : null}
                    </div>
                    {/* Status (dropdown, disabled) */}
                    <div>
                      <label className="font-semibold text-gray-700 mr-2">Statut:</label>
                      <select
                        className="border rounded px-2 py-1"
                        value={editData.status || ''}
                        onChange={e => setEditData({ ...editData, status: e.target.value })}
                      >
                        <option value="APPROVED">Approuvée</option>
                        <option value="NOT_APPROVED">En attente</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Annuler</button>
                    <button onClick={handleEditSave} className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700">Enregistrer</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 