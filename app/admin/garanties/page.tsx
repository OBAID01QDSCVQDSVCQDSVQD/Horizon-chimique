"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa'

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
  const [garanties, setGaranties] = useState<Garantie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Garantie | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<Partial<Garantie> | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetchGaranties();
  }, []);

  const fetchGaranties = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/garanties");
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

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Gestion des garanties</h1>
      {loading ? (
        <div className="text-center text-gray-500">Chargement...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-xl">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 text-left">Société</th>
                <th className="py-2 px-3 text-left">Client</th>
                <th className="py-2 px-3 text-left">Téléphone</th>
                <th className="py-2 px-3 text-left">Adresse</th>
                <th className="py-2 px-3 text-left">Statut</th>
                <th className="py-2 px-3 text-left">Créée le</th>
                <th className="py-2 px-3 text-left">Surface</th>
                <th className="py-2 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {garanties.map((g) => (
                <tr key={g._id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{g.company}</td>
                  <td className="py-2 px-3">{g.name}</td>
                  <td className="py-2 px-3">{g.phone}</td>
                  <td className="py-2 px-3">{g.address}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${g.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {statusLabels[g.status] || g.status}
                    </span>
                  </td>
                  <td className="py-2 px-3">{g.createdAt?.slice(0, 10).split("-").reverse().join("/")}</td>
                  <td className="py-2 px-3">{
                    Array.isArray(g.surface)
                      ? g.surface.map(s => `${s.type}: ${s.value}`).join(', ')
                      : typeof g.surface === 'object' && g.surface !== null
                        ? JSON.stringify(g.surface)
                        : g.surface || '-'
                  }</td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => handleView(g)} className="hover:text-blue-700">
                        <FaEye className="text-blue-500 text-lg" />
                      </button>
                      <button onClick={() => handleEdit(g)} className="hover:text-blue-700">
                        <FaEdit className="text-blue-500 text-lg" />
                      </button>
                      <button onClick={() => handleDelete(g._id)} className="hover:text-red-700" disabled={deletingId === g._id}>
                        <FaTrash className="text-red-500 text-lg" />
                      </button>
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
  );
} 