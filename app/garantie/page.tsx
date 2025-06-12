"use client"
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Garantie {
  _id: string
  company: string
  name: string
  phone: string
  address: string
  surface: string
  surfaceValue: number
  montant: number
  installDate: string
  duration: number
  notes?: string
  maintenances?: { date: string }[]
  status: string
  createdAt: string
}

export default function GarantieIndex() {
  const { data: session, status } = useSession()
  const [garanties, setGaranties] = useState<Garantie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    async function fetchGaranties() {
      setLoading(true)
      const res = await fetch('/api/garanties')
      const data = await res.json()
      if (res.ok && Array.isArray(data.garanties)) {
        if (session?.user?.role === 'ADMIN') {
          setGaranties(data.garanties)
        } else {
          setGaranties(data.garanties.filter((g: any) => g.userId === session?.user?.id))
        }
      }
      setLoading(false)
    }
    fetchGaranties()
  }, [session, status])

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-4xl mx-auto p-4 flex-1">
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
        {status === 'loading' || loading ? (
          <div className="text-center text-gray-500">Chargement...</div>
        ) : garanties.length === 0 ? (
          <div className="text-center text-gray-400">Vous n'êtes pas encore l'un de nos clients.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {garanties.map(g => (
              <div key={g._id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-blue-800 text-lg">{g.company}</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/garantie/${g._id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      PDF
                    </a>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${g.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{g.status === 'APPROVED' ? 'Approuvée' : 'En attente'}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Client:</b> {g.name}</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Adresse:</b> {g.address}</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Surface:</b> {g.surface && Array.isArray(g.surface) && g.surface.length > 0
                  ? g.surface.map(s => `${s.type}: ${s.value}`).join(', ')
                  : '-'}</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Date d'installation:</b> {g.installDate.split('-').reverse().join('/')}</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Montant:</b> {g.montant} DT</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Créée le: {g.createdAt?.slice(0,10).split('-').reverse().join('/')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* ضع الفوتر هنا إذا لم يكن في layout العام */}
    </div>
  )
} 