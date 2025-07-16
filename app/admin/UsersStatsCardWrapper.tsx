'use client'
import { useEffect, useState } from 'react'
import { FaUsers, FaUserShield, FaUser, FaBuilding } from 'react-icons/fa'

interface UserStats {
  total: number
  admins: number
  applicateurs: number
  users: number
}

export default function UsersStatsCardWrapper() {
  const [stats, setStats] = useState<UserStats>({ total: 0, admins: 0, applicateurs: 0, users: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        const users = data.users || []
        
        const stats = {
          total: users.length,
          admins: users.filter((u: any) => u.role === 'ADMIN').length,
          applicateurs: users.filter((u: any) => u.role === 'APPLICATEUR').length,
          users: users.filter((u: any) => u.role === 'USER').length
        }
        
        setStats(stats)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Chargement...</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Total</span>
        <span className="text-lg font-bold text-blue-600">{stats.total}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Admins</span>
        <span className="text-sm font-semibold text-red-600">{stats.admins}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Applicateurs</span>
        <span className="text-sm font-semibold text-blue-600">{stats.applicateurs}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Utilisateurs</span>
        <span className="text-sm font-semibold text-green-600">{stats.users}</span>
      </div>
    </div>
  )
} 