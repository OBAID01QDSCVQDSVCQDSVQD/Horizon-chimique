"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function AdminCreateGarantiePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [maintenances, setMaintenances] = useState([''])
  const [form, setForm] = useState({
    phone: '',
    name: '',
    installDate: '',
    duration: '',
    notes: 'Le bénéficiaire obtiendra une réduction exceptionnelle de 20 % sur la première opération de maintenance des produits installés.',
    company: '',
    address: '',
    surface: [],
    montant: '',
  })
  const surfaceOptions = [
    'toit en m2',
    'toit en ml',
    'acrotère enml',
    'Mur en m2',
    'Surface en m2',
  ];
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([]);
  const [surfaceValues, setSurfaceValues] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  useEffect(() => {
    console.log('Session debug:', {
      userId: session?.user?.id,
      email: session?.user?.email,
      name: session?.user?.name,
      company: session?.user?.company,
      role: session?.user?.role
    })
    
    if (session?.user?.id) {
      fetchUserCompany()
    } else if (session?.user?.email) {
      fetchUserByEmail()
    } else {
      setIsLoadingCompany(false)
      setForm(f => ({ ...f, company: 'HORIZON CHIMIQUE' }))
    }
  }, [session?.user?.id, session?.user?.email])

  const fetchUserCompany = async () => {
    try {
      setIsLoadingCompany(true)
      console.log('Fetching user company for ID:', session?.user?.id)
      
      const response = await fetch(`/api/user/${session?.user?.id}`)
      console.log('API Response status:', response.status)
      
      if (response.ok) {
        const userData = await response.json()
        console.log('User data from API:', userData)
        const company = userData.company || 'HORIZON CHIMIQUE'
        console.log('Setting company to:', company)
        setForm(f => ({ ...f, company }))
      } else {
        console.error('Failed to fetch user data:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setForm(f => ({ ...f, company: 'HORIZON CHIMIQUE' }))
      }
    } catch (error) {
      console.error('Error fetching user company:', error)
      setForm(f => ({ ...f, company: 'HORIZON CHIMIQUE' }))
    } finally {
      setIsLoadingCompany(false)
    }
  }

  const fetchUserByEmail = async () => {
    try {
      setIsLoadingCompany(true)
      console.log('Fetching user by email:', session?.user?.email)
      
      const response = await fetch(`/api/user/search?email=${session?.user?.email}`)
      console.log('Email search API Response status:', response.status)
      
      if (response.ok) {
        const userData = await response.json()
        console.log('User data from email search:', userData)
        const company = userData.company || 'HORIZON CHIMIQUE'
        console.log('Setting company to:', company)
        setForm(f => ({ ...f, company }))
      } else {
        console.error('Failed to fetch user by email:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setForm(f => ({ ...f, company: 'HORIZON CHIMIQUE' }))
      }
    } catch (error) {
      console.error('Error fetching user by email:', error)
      setForm(f => ({ ...f, company: 'HORIZON CHIMIQUE' }))
    } finally {
      setIsLoadingCompany(false)
    }
  }

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleMaintenanceChange = (idx: number, value: string) => {
    const updated = maintenances.map((m, i) => i === idx ? value : m)
    setMaintenances(updated)
  }

  const addMaintenance = () => {
    setMaintenances([...maintenances, ''])
  }

  const removeMaintenance = (idx: number) => {
    setMaintenances(maintenances.filter((_, i) => i !== idx))
  }

  const handleSurfaceChange = (e: any) => {
    const options = Array.from(e.target.selectedOptions).map((o: any) => o.value);
    setSelectedSurfaces(options);
    setSurfaceValues(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => options.includes(k))));
  };

  const handleSurfaceValueChange = (type: string, value: string) => {
    setSurfaceValues(prev => ({ ...prev, [type]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/garanties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          surface: selectedSurfaces.map(type => ({ type, value: Number(surfaceValues[type] || 0) })),
          montant: Number(form.montant),
          duration: Number(form.duration),
          maintenances: maintenances.filter(Boolean).map(date => ({ date })),
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Garantie créée avec succès!')
        router.push('/admin/garanties')
      } else {
        toast.error('Erreur: ' + (data.error || 'Impossible d\'enregistrer la garantie'))
      }
    } catch (err: any) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="w-full p-4 pl-5 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700">Créer une nouvelle garantie</h1>
          <button
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-xl text-base shadow transition"
          >
            Retour
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Informations du client */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-700 mb-4">Informations du client</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom et prénom *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Informations de la garantie */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-700 mb-4">Informations de la garantie</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la société *</label>
                  <input
                    type="text"
                    name="company"
                    value={isLoadingCompany ? 'Chargement...' : form.company}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    required
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {isLoadingCompany ? 'Récupération du nom de la société...' : 'Nom de la société non modifiable'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date d'installation *</label>
                  <input
                    type="date"
                    name="installDate"
                    value={form.installDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Durée (années) *</label>
                  <input
                    type="number"
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant (DT) *</label>
                  <input
                    type="number"
                    name="montant"
                    value={form.montant}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Surface */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">Surface</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Types de surface</label>
                <select
                  multiple
                  value={selectedSurfaces}
                  onChange={handleSurfaceChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {surfaceOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              {selectedSurfaces.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedSurfaces.map(type => (
                    <div key={type} className="flex gap-2 items-center">
                      <span className="text-sm font-medium text-gray-700 w-32">{type}:</span>
                      <input
                        type="number"
                        value={surfaceValues[type] || ''}
                        onChange={(e) => handleSurfaceValueChange(type, e.target.value)}
                        placeholder="Valeur"
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Maintenances */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">Maintenances prévues</h3>
              {maintenances.map((maintenance, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-2">
                  <input
                    type="date"
                    value={maintenance}
                    onChange={(e) => handleMaintenanceChange(idx, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeMaintenance(idx)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addMaintenance}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                + Ajouter une maintenance
              </button>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit */}
            <div className="mt-8 flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-xl text-base shadow transition disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer la garantie'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl text-base shadow transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 