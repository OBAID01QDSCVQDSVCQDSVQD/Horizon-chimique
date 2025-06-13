"use client"
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { FaSearch } from 'react-icons/fa'

interface Garantie {
  _id: string
  company: string
  name: string
  phone: string
  address: string
  surface: any
  surfaceValue: number
  montant: number
  installDate: string
  duration: number
  notes?: string
  maintenances?: { date: string }[]
  status: string
  createdAt: string
  userId?: string
}

export default function GarantieIndex() {
  const { data: session, status } = useSession()
  const [garanties, setGaranties] = useState<Garantie[]>([])
  const [loading, setLoading] = useState(true)
  const [searchPhone, setSearchPhone] = useState('')

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    fetchGaranties();
  }, [session, status])

  async function fetchGaranties(phone?: string) {
    setLoading(true)
    try {
      const query = phone ? { phone } : {};
      const url = `/api/garanties?${new URLSearchParams(query as Record<string, string>)}`
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok && Array.isArray(data.garanties)) {
        setGaranties(data.garanties);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des garanties:', error);
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGaranties(searchPhone);
  };

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

        {/* Formulaire de recherche */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 mb-6">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <label htmlFor="phoneSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rechercher par numéro de téléphone
                </label>
                <div className="relative">
                  <input
                    id="phoneSearch"
                    type="text"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    placeholder="Entrez le numéro de téléphone..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                >
                  <FaSearch />
                  Rechercher
                </button>
                {searchPhone && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchPhone('');
                      fetchGaranties();
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {status === 'loading' || loading ? (
          <div className="text-center text-gray-500">Chargement...</div>
        ) : garanties.length === 0 ? (
          <div className="text-center text-gray-400">Aucune garantie trouvée.</div>
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
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Client :</b> {g.name}</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Adresse :</b> {g.address}</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                  <b>Surface :</b>{" "}
                  {Array.isArray(g.surface) && g.surface.length > 0
                    ? g.surface
                        .map((s: any) => {
                          if (s.type && s.value) return `${s.type}: ${s.value}`;
                          if (s.type) return s.type;
                          if (s.value) return `${s.value}`;
                          return '';
                        })
                        .filter(Boolean)
                        .join(', ')
                    : '-'}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Date d'installation :</b> {g.installDate?.split('-').reverse().join('/')}</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Montant :</b> {g.montant} DT</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Créée le : {g.createdAt?.slice(0,10).split('-').reverse().join('/')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 