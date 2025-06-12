'use client'
import { useEffect, useState } from 'react'

export default function GarantiesStatsCard() {
  const [stats, setStats] = useState({ total: 0, approved: 0, notApproved: 0, loading: true })
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/garanties')
        const data = await res.json()
        const garanties = data.garanties || []
        setStats({
          total: garanties.length,
          approved: garanties.filter((g: any) => g.status === 'APPROVED').length,
          notApproved: garanties.filter((g: any) => g.status === 'NOT_APPROVED').length,
          loading: false
        })
      } catch {
        setStats(s => ({ ...s, loading: false }))
      }
    }
    fetchStats()
  }, [])
  if (stats.loading) return <div>تحميل...</div>
  return (
    <div>
      <div>إجمالي الضمانات: <b>{stats.total}</b></div>
      <div>الموافق عليها: <b className="text-green-600">{stats.approved}</b></div>
      <div>غير الموافق عليها: <b className="text-yellow-600">{stats.notApproved}</b></div>
    </div>
  )
} 