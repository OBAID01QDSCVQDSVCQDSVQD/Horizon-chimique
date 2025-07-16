"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FaEye, FaEdit, FaSearch, FaUserShield, FaUser, FaBuilding, FaEnvelope, FaPhone } from 'react-icons/fa'
import { useSession } from 'next-auth/react'

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  whatsapp?: string;
  phone?: string;
  address?: string;
  bio?: string;
  company?: string;
  matriculeFiscale?: string;
  socialMedia?: string;
  website?: string;
  companyLogo?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  APPLICATEUR: "Applicateur",
  USER: "Utilisateur",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  APPLICATEUR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  USER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState<Partial<User> | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchRole, setSearchRole] = useState('')
  const [searchCompany, setSearchCompany] = useState('')
  
  // إضافة حالة التصفح
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [selectedLimit, setSelectedLimit] = useState(10)

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    fetchUsersWithFilters(1);
  }, [session, status, selectedLimit])

  const fetchUsersWithFilters = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchEmail) params.append('email', searchEmail);
      if (searchName) params.append('name', searchName);
      if (searchRole) params.append('role', searchRole);
      if (searchCompany) params.append('company', searchCompany);
      params.append('page', page.toString());
      params.append('limit', selectedLimit.toString());

      const url = `/api/users?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        setUsers(data.users || []);
        setPagination(data.pagination || {
          page: 1,
          limit: selectedLimit,
          total: 0,
          pages: 0
        });
      } else {
        toast.error(data.error || "Erreur lors du chargement des utilisateurs");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (user: User) => {
    setSelected(user);
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditData(user);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editData?._id) return;
    
    setStatusLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editData._id,
          updates: editData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const result = await response.json();
      setUsers(users.map(u => u._id === result.user._id ? result.user : u));
      setShowEditModal(false);
      toast.success(result.message || 'Utilisateur mis à jour avec succès');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setStatusLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
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
          <div>
            <h1 className="text-2xl font-bold text-blue-700">Gestion des utilisateurs</h1>
            <p className="text-sm text-gray-600 mt-1">Affichage des utilisateurs avec pagination</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl shadow hover:bg-blue-50 text-blue-600 font-medium transition"
          >
            <FaSearch className="w-4 h-4" />
            Filtres
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Afficher:</label>
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
            
            <div className="text-sm text-gray-600">
              {pagination.total > 0 && (
                <>
                  Affichage {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 
                  sur {pagination.total} utilisateurs
                </>
              )}
            </div>
          </div>
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
                  fetchUsersWithFilters(1);
                  setShowFilters(false);
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  value={searchName}
                  onChange={e => setSearchName(e.target.value)}
                  placeholder="Nom"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <select
                  value={searchRole}
                  onChange={e => setSearchRole(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Tous les rôles</option>
                  <option value="ADMIN">Administrateur</option>
                  <option value="APPLICATEUR">Applicateur</option>
                  <option value="USER">Utilisateur</option>
                </select>
                <input
                  type="text"
                  value={searchCompany}
                  onChange={e => setSearchCompany(e.target.value)}
                  placeholder="Société"
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
                      setSearchEmail('');
                      setSearchName('');
                      setSearchRole('');
                      setSearchCompany('');
                      fetchUsersWithFilters(1);
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
        ) : users.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Aucun utilisateur trouvé
          </div>
        ) : (
          <div className="overflow-x-auto mt-6">
            <table className="min-w-full bg-white border rounded-xl shadow">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left font-semibold">Utilisateur</th>
                  <th className="py-3 px-4 text-left font-semibold">Email</th>
                  <th className="py-3 px-4 text-left font-semibold">Rôle</th>
                  <th className="py-3 px-4 text-left font-semibold">Société</th>
                  <th className="py-3 px-4 text-left font-semibold">Téléphone</th>
                  <th className="py-3 px-4 text-left font-semibold">Date d'inscription</th>
                  <th className="py-3 px-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-blue-50 transition">
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-3">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <FaUser className="text-gray-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">{user.email}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        {user.companyLogo && (
                          <img 
                            src={user.companyLogo} 
                            alt={user.company}
                            className="w-6 h-6 rounded object-cover"
                          />
                        )}
                        <span>{user.company || '-'}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4">{user.phone || user.whatsapp || '-'}</td>
                    <td className="py-2 px-4">{formatDate(user.createdAt)}</td>
                    <td className="py-2 px-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleView(user)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-full transition"
                          title="Voir"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-yellow-600 hover:text-yellow-800 p-2 rounded-full transition"
                          title="Modifier"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* أزرار التنقل بين الصفحات */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => fetchUsersWithFilters(pagination.page - 1)}
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
                  onClick={() => fetchUsersWithFilters(pageNum)}
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
            
            {pagination.pages > 5 && (
              <span className="px-3 py-2 text-gray-500">...</span>
            )}
            
            <button
              onClick={() => fetchUsersWithFilters(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
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
                <div className="rounded-2xl shadow bg-gradient-to-r from-blue-50 to-blue-100 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {selected.profileImage ? (
                      <img 
                        src={selected.profileImage} 
                        alt={selected.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                        <FaUser className="text-gray-600 text-2xl" />
                      </div>
                    )}
                    <div>
                      <div className="text-xl font-bold text-blue-700">{selected.name}</div>
                      <div className="text-blue-600">{selected.email}</div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${roleColors[selected.role] || 'bg-gray-100 text-gray-700'}`}>
                        {roleLabels[selected.role] || selected.role}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-2xl shadow bg-gradient-to-r from-gray-50 to-gray-100 p-6">
                  <div className="mb-2 text-gray-700 font-semibold text-base">Informations de contact</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="text-gray-500" />
                      <span><b>Email:</b> {selected.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-gray-500" />
                      <span><b>Téléphone:</b> {selected.phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-gray-500" />
                      <span><b>WhatsApp:</b> {selected.whatsapp || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaBuilding className="text-gray-500" />
                      <span><b>Société:</b> {selected.company || '-'}</span>
                    </div>
                  </div>
                </div>

                {selected.address && (
                  <div className="rounded-2xl shadow bg-gradient-to-r from-gray-50 to-gray-100 p-6">
                    <div className="mb-2 text-gray-700 font-semibold text-base">Adresse</div>
                    <div className="text-sm">{selected.address}</div>
                  </div>
                )}

                {selected.bio && (
                  <div className="rounded-2xl shadow bg-gradient-to-r from-gray-50 to-gray-100 p-6">
                    <div className="mb-2 text-gray-700 font-semibold text-base">Bio</div>
                    <div className="text-sm">{selected.bio}</div>
                  </div>
                )}

                <div className="rounded-2xl shadow bg-gradient-to-r from-gray-50 to-gray-100 p-6">
                  <div className="mb-2 text-gray-700 font-semibold text-base">Informations supplémentaires</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><b>Matricule fiscale:</b> {selected.matriculeFiscale || '-'}</div>
                    <div><b>Réseaux sociaux:</b> {selected.socialMedia || '-'}</div>
                    <div><b>Site web:</b> {selected.website || '-'}</div>
                    <div><b>Email vérifié:</b> {selected.emailVerified ? 'Oui' : 'Non'}</div>
                    <div><b>Inscrit le:</b> {formatDate(selected.createdAt)}</div>
                    <div><b>Mis à jour le:</b> {formatDate(selected.updatedAt)}</div>
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
                  <div className="text-lg font-bold text-yellow-700 mb-4">Modifier l'utilisateur</div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                      <input 
                        className="w-full border rounded px-3 py-2" 
                        value={editData.name || ''} 
                        onChange={e => setEditData({ ...editData, name: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        className="w-full border rounded px-3 py-2" 
                        value={editData.email || ''} 
                        onChange={e => setEditData({ ...editData, email: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                      <select
                        value={editData.role || ''}
                        onChange={e => setEditData({ ...editData, role: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="USER">Utilisateur</option>
                        <option value="APPLICATEUR">Applicateur</option>
                        <option value="ADMIN">Administrateur</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input 
                        className="w-full border rounded px-3 py-2" 
                        value={editData.phone || ''} 
                        onChange={e => setEditData({ ...editData, phone: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                      <input 
                        className="w-full border rounded px-3 py-2" 
                        value={editData.whatsapp || ''} 
                        onChange={e => setEditData({ ...editData, whatsapp: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Société</label>
                      <input 
                        className="w-full border rounded px-3 py-2" 
                        value={editData.company || ''} 
                        onChange={e => setEditData({ ...editData, company: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                      <textarea 
                        className="w-full border rounded px-3 py-2" 
                        value={editData.address || ''} 
                        onChange={e => setEditData({ ...editData, address: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea 
                        className="w-full border rounded px-3 py-2" 
                        value={editData.bio || ''} 
                        onChange={e => setEditData({ ...editData, bio: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button 
                      onClick={() => setShowEditModal(false)} 
                      className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={handleUpdate} 
                      disabled={statusLoading}
                      className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {statusLoading ? 'Mise à jour...' : 'Enregistrer'}
                    </button>
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