'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, DollarSign, User, Edit, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

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

interface MaintenanceStatusManagerProps {
  garantieId: string
  canEdit?: boolean
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
  EMERGENCY: 'Maintenance d\'urgence',
  ROUTINE: 'Maintenance routinière'
}

export default function MaintenanceStatusManager({ garantieId, canEdit = false }: MaintenanceStatusManagerProps) {
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    status: '',
    notes: '',
    cost: 0,
    duration: 0
  })

  useEffect(() => {
    fetchMaintenances()
  }, [garantieId])

  const fetchMaintenances = async () => {
    try {
      const response = await fetch(`/api/maintenance?garantieId=${garantieId}`)
      if (response.ok) {
        const data = await response.json()
        setMaintenances(data.maintenances || [])
      }
    } catch (error) {
      console.error('Error fetching maintenances:', error)
      toast.error('Erreur lors du chargement des enregistrements de maintenance')
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enregistrements de maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Chargement...</div>
        </CardContent>
      </Card>
    )
  }

  if (maintenances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enregistrements de maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Aucun enregistrement de maintenance pour cette garantie
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enregistrements de maintenance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {maintenances.map((maintenance) => {
          const statusInfo = statusConfig[maintenance.status]
          const StatusIcon = statusInfo.icon

          return (
            <div key={maintenance._id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <StatusIcon className="w-4 h-4" />
                  <Badge className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                </div>
                {canEdit && editingId !== maintenance._id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(maintenance)}
                  >
                    <Edit className="w-4 h-4 ml-2" />
                    Modifier
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Date de maintenance: {new Date(maintenance.maintenanceDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Type de maintenance: {maintenanceTypeLabels[maintenance.maintenanceType as keyof typeof maintenanceTypeLabels]}
                    </span>
                  </div>

                  {maintenance.duration && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Clock className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm text-gray-600">
                      Durée: {maintenance.duration} heures
                    </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {maintenance.cost && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm text-gray-600">
                      Coût: {maintenance.cost} DT
                    </span>
                    </div>
                  )}

                  {maintenance.completedBy && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <User className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm text-gray-600">
                      Effectué par: {maintenance.completedBy.name}
                    </span>
                    </div>
                  )}

                  {maintenance.completedDate && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm text-gray-600">
                      Date de fin: {new Date(maintenance.completedDate).toLocaleDateString('fr-FR')}
                    </span>
                    </div>
                  )}
                </div>
              </div>

              {maintenance.notes && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-700">{maintenance.notes}</p>
                </div>
              )}

              {editingId === maintenance._id && (
                <div className="border-t pt-4 space-y-4">
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
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2 space-x-reverse">
                    <Button onClick={() => handleSave(maintenance._id)}>
                      Enregistrer
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
} 