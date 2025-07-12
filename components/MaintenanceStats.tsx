'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Wrench, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface MaintenanceStats {
  overview: {
    total: number
    pending: number
    inProgress: number
    completed: number
    cancelled: number
  }
  byType: Array<{
    _id: string
    count: number
    totalCost: number
  }>
  monthly: Array<{
    _id: {
      year: number
      month: number
    }
    count: number
    completed: number
    totalCost: number
  }>
  garantiesNeedingMaintenance: number
  totalCost: number
}

const maintenanceTypeLabels = {
  PREVENTIVE: 'Maintenance préventive',
  CORRECTIVE: 'Maintenance corrective',
  EMERGENCY: 'Maintenance d\'urgence',
  ROUTINE: 'Maintenance routinière'
}

const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export default function MaintenanceStats() {
  const [stats, setStats] = useState<MaintenanceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/maintenance/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching maintenance stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Impossible de charger les statistiques</p>
        </CardContent>
      </Card>
    )
  }

  const completionRate = stats.overview.total > 0 
    ? ((stats.overview.completed / stats.overview.total) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* البطاقات الإحصائية الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total maintenance</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overview.total}</p>
              </div>
              <Wrench className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.overview.pending}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminé</p>
                <p className="text-2xl font-bold text-green-600">{stats.overview.completed}</p>
                <p className="text-xs text-gray-500">{completionRate}% taux de réussite</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* الصيانة حسب النوع */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Maintenance par type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byType.map((type) => (
                <div key={type._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {maintenanceTypeLabels[type._id as keyof typeof maintenanceTypeLabels] || type._id}
                    </p>
                    <p className="text-sm text-gray-600">{type.count} enregistrement(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{type.totalCost} DT</p>
                    <p className="text-xs text-gray-500">Coût total</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* الصيانات التي ستقام في السنة الحالية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Maintenances prévues cette année ({new Date().getFullYear()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {stats.garantiesNeedingMaintenance}
              </div>
              <p className="text-gray-600">maintenance(s) prévue(s) cette année</p>
              <p className="text-sm text-gray-500 mt-2">
                Maintenances en attente ou en cours prévues pour l'année {new Date().getFullYear()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* إحصائيات شهرية */}
      {stats.monthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Statistiques mensuelles (6 derniers mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-4">Mois</th>
                    <th className="text-right py-2 px-4">Total maintenance</th>
                    <th className="text-right py-2 px-4">Terminé</th>
                    <th className="text-right py-2 px-4">Coût total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.monthly.map((month) => (
                    <tr key={`${month._id.year}-${month._id.month}`} className="border-b">
                      <td className="py-2 px-4 text-right">
                        {monthNames[month._id.month - 1]} {month._id.year}
                      </td>
                      <td className="py-2 px-4 text-right">{month.count}</td>
                      <td className="py-2 px-4 text-right">
                        <span className="text-green-600">{month.completed}</span>
                      </td>
                      <td className="py-2 px-4 text-right">{month.totalCost} DT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* حالة الصيانة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Statut de maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{stats.overview.pending}</p>
              <p className="text-sm text-gray-600">En attente</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{stats.overview.inProgress}</p>
              <p className="text-sm text-gray-600">En cours</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats.overview.completed}</p>
              <p className="text-sm text-gray-600">Terminé</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{stats.overview.cancelled}</p>
              <p className="text-sm text-gray-600">Annulé</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 