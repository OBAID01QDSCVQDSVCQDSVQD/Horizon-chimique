'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, DollarSign, User, Edit, CheckCircle, XCircle, AlertCircle, Search, Wrench } from 'lucide-react'
import { toast } from 'react-hot-toast'
import MaintenanceStats from '@/components/MaintenanceStats'

interface MaintenanceRecord {
  _id: string
  garantieId: {
    _id: string
    company: string
    name: string
    phone: string
  }
  maintenanceType: string
  maintenanceDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  notes?: string
  cost?: number
  duration?: number
  completedBy?: {
    _id: string
    name: string
    email: string
  }
  completedDate?: string
}

const statusConfig = {
  PENDING: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle
  },
  IN_PROGRESS: {
    label: 'En cours',
    color: 'bg-blue-100 text-blue-800',
    icon: Clock
  },
  COMPLETED: {
    label: 'Terminé',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  CANCELLED: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  }
}

const maintenanceTypeLabels = {
  PREVENTIVE: 'Maintenance préventive',
  CORRECTIVE: 'Maintenance corrective',
  EMERGENCY: "Maintenance d'urgence",
  ROUTINE: 'Maintenance routinière'
}

export default function MaintenanceManagementPage() {
  const { data: session } = useSession()
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    garantieId: '', // سيستخدم كرقم الهاتف
    year: '' // فارغ افتراضياً لعرض جميع السنوات
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    status: '',
    notes: '',
    cost: 0,
    duration: 0
  })
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchMaintenances()
    }
  }, [session, filters])

  const fetchMaintenances = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.type) params.append('type', filters.type)
      if (filters.garantieId) params.append('garantieId', filters.garantieId)
      if (filters.year) params.append('year', filters.year)

      const response = await fetch(`/api/maintenance?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMaintenances(data.maintenances || [])
      }
    } catch (error) {
      console.error('Error fetching maintenances:', error)
      toast.error('خطأ في تحميل سجلات الصيانة')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (maintenance: MaintenanceRecord) => {
    setEditingId(maintenance._id)
    setEditForm({
      status: maintenance.status,
      notes: maintenance.notes || '',
      cost: maintenance.cost || 0,
      duration: maintenance.duration || 0
    })
  }

  const handleSave = async (maintenanceId: string) => {
    try {
      setSavingId(maintenanceId)
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        toast.success('Statut de maintenance mis à jour avec succès')
        setEditingId(null)
        fetchMaintenances()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la mise à jour du statut de maintenance')
      }
    } catch (error) {
      console.error('Error updating maintenance:', error)
      toast.error('Erreur lors de la mise à jour du statut de maintenance')
    } finally {
      setSavingId(null)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({
      status: '',
      notes: '',
      cost: 0,
      duration: 0
    })
  }

  const handleDelete = async (maintenanceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement ?')) return

    try {
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Enregistrement supprimé avec succès')
        fetchMaintenances()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la suppression de l\'enregistrement')
      }
    } catch (error) {
      console.error('Error deleting maintenance:', error)
      toast.error('Erreur lors de la suppression de l\'enregistrement')
    }
  }

  if (!session?.user?.id || !['ADMIN', 'APPLICATEUR'].includes(session?.user?.role ?? '')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Non autorisé</h1>
          <p className="text-gray-600">Vous n'avez pas l'autorisation d'accéder à cette page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion de la Maintenance</h1>
          <p className="text-gray-600 mt-2">Gérer tous les enregistrements de maintenance dans le système</p>
        </div>
      </div>

      {/* إحصائيات الصيانة */}
      <div className="mb-8">
        <MaintenanceStats />
      </div>

      {/* فلاتر البحث */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtres de recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="COMPLETED">Terminé</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type de maintenance</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Tous les types</option>
                <option value="PREVENTIVE">Maintenance préventive</option>
                <option value="CORRECTIVE">Maintenance corrective</option>
                <option value="EMERGENCY">Maintenance d'urgence</option>
                <option value="ROUTINE">Maintenance routinière</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Année</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Toutes les années</option>
                {Array.from({ length: 16 }, (_, i) => {
                  const year = 2025 + i
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Numéro de téléphone</label>
              <input
                type="text"
                value={filters.garantieId}
                onChange={(e) => setFilters({ ...filters, garantieId: e.target.value })}
                placeholder="Entrez le numéro de téléphone..."
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">Rechercher les maintenances par numéro de téléphone du client</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة سجلات الصيانة */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      ) : maintenances.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Aucun enregistrement de maintenance trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {maintenances.map((maintenance) => {
            const statusInfo = statusConfig[maintenance.status]
            const StatusIcon = statusInfo.icon

            return (
              <Card key={maintenance._id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <StatusIcon className="w-5 h-5" />
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(maintenance)}
                      >
                        <Edit className="w-4 h-4 ml-2" />
                        Modifier
                      </Button>
                      {session?.user?.role === 'ADMIN' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(maintenance._id)}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Date de maintenance : {new Date(maintenance.maintenanceDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Type de maintenance : {maintenanceTypeLabels[maintenance.maintenanceType as keyof typeof maintenanceTypeLabels]}
                        </span>
                      </div>
                      {maintenance.duration && (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Durée : {maintenance.duration} heures
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {maintenance.cost && (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Coût : {maintenance.cost} DT
                          </span>
                        </div>
                      )}
                      {maintenance.completedBy && (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Effectué par : {maintenance.completedBy.name || 'Non spécifié'}
                          </span>
                        </div>
                      )}
                      {maintenance.completedDate && (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <CheckCircle className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Date de fin : {new Date(maintenance.completedDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Informations sur la garantie */}
                  {maintenance.garantieId && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Informations sur la garantie</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div><span className="font-medium">Société :</span> {maintenance.garantieId.company || 'Non spécifiée'}</div>
                        <div><span className="font-medium">Client :</span> {maintenance.garantieId.name || 'Non spécifié'}</div>
                        <div><span className="font-medium">Téléphone :</span> {maintenance.garantieId.phone || 'Non spécifié'}</div>
                      </div>
                    </div>
                  )}
                  {maintenance.notes && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Remarques</h4>
                      <p className="text-sm text-gray-700">{maintenance.notes}</p>
                    </div>
                  )}

                  {editingId === maintenance._id && (
                    <div className="mt-6 border-t pt-6 space-y-4">
                      <h4 className="font-medium text-gray-900">Modifier l’enregistrement</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Statut</label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="PENDING">En attente</option>
                            <option value="IN_PROGRESS">En cours</option>
                            <option value="COMPLETED">Terminé</option>
                            <option value="CANCELLED">Annulé</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Coût (DT)</label>
                          <input
                            type="number"
                            value={editForm.cost}
                            onChange={(e) => setEditForm({ ...editForm, cost: Number(e.target.value) })}
                            className="w-full p-2 border rounded-md"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Remarques</label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="w-full p-2 border rounded-md"
                          rows={3}
                        />
                      </div>
                      <div className="flex space-x-2 space-x-reverse">
                        <Button 
                          onClick={() => handleSave(maintenance._id)} 
                          disabled={savingId === maintenance._id}
                          className="flex items-center gap-2"
                        >
                          {savingId === maintenance._id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Enregistrement...
                            </>
                          ) : (
                            'Enregistrer les modifications'
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancel}
                          disabled={savingId === maintenance._id}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 