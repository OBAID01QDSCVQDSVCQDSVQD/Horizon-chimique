"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function GarantiePage() {
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
    }
  }, [session?.user?.id, session?.user?.email])

  const fetchUserCompany = async () => {
    try {
      setIsLoadingCompany(true)
      const response = await fetch(`/api/user/${session?.user?.id}`)
      if (response.ok) {
        const userData = await response.json()
        console.log('User data from API:', userData)
        const company = userData.company || 'HORIZON CHIMIQUE'
        setForm(f => ({ ...f, company }))
      } else {
        console.error('Failed to fetch user data:', response.status)
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
      const response = await fetch(`/api/user/search?email=${session?.user?.email}`)
      if (response.ok) {
        const userData = await response.json()
        console.log('User data from email search:', userData)
        const company = userData.company || 'HORIZON CHIMIQUE'
        setForm(f => ({ ...f, company }))
      } else {
        console.error('Failed to fetch user by email:', response.status)
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
    console.log(form.notes)
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
        router.push('/admin/garanties')
      } else {
        alert('Erreur: ' + (data.error || 'Impossible d\'enregistrer la garantie'))
      }
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow mt-8">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">Ajouter une nouvelle garantie</h1>
      <p className="mb-6 text-gray-700 dark:text-gray-300">Remplissez les détails ci-dessous pour enregistrer une nouvelle garantie :</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informations du client */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Informations du client</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Nom du client</label>
              <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Numéro de téléphone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
          </div>
        </div>

        {/* Informations sur les travaux */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Informations sur les travaux</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Nom de la société</label>
              <input
                name="company"
                value={isLoadingCompany ? 'Chargement...' : form.company}
                className="w-full border rounded px-3 py-2 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                required
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                {isLoadingCompany ? 'Récupération du nom de la société...' : 'Nom de la société non modifiable'}
              </p>
            </div>
            <div>
              <label className="block mb-1 font-medium">Adresse des travaux</label>
              <input name="address" value={form.address} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Surface concernée</label>
              <select
                multiple
                value={selectedSurfaces}
                onChange={handleSurfaceChange}
                className="border rounded px-3 py-2 w-full min-h-[44px]"
                required
              >
                {surfaceOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedSurfaces.map(type => (
                  <div key={type} className="flex items-center gap-1">
                    <span className="text-xs text-gray-700 dark:text-gray-200">{type}:</span>
                    <input
                      type="number"
                      value={surfaceValues[type] || ''}
                      onChange={e => handleSurfaceValueChange(type, e.target.value)}
                      className="border rounded px-2 py-1 w-20"
                      placeholder="Valeur"
                      min="0"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">Montant total des travaux</label>
              <div className="flex items-center gap-2">
                <input type="number" name="montant" value={form.montant} onChange={handleChange} className="border rounded px-3 py-2 w-40" min="0" required />
                <span className="text-gray-600 dark:text-gray-300 text-sm">en DT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Détails de la garantie */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Détails de la garantie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Date de l'installation</label>
              <input type="date" name="installDate" value={form.installDate} onChange={handleChange} className="border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Durée de la garantie (en années)</label>
              <input type="number" name="duration" value={form.duration} onChange={handleChange} className="w-full border rounded px-3 py-2" min="1" required />
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Maintenance</h2>
          <label className="block mb-1 font-medium">Périodes de maintenance ou dates de service (si applicable)</label>
          {maintenances.map((date, idx) => (
            <div key={idx} className="flex gap-2 items-center mb-2">
              <input type="date" value={date} onChange={e => handleMaintenanceChange(idx, e.target.value)} className="border rounded px-2 py-1" />
              {maintenances.length > 1 && (
                <button type="button" onClick={() => removeMaintenance(idx)} className="text-red-500 hover:underline text-xs">Supprimer</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addMaintenance} className="text-blue-600 hover:underline text-sm mt-1">+ Ajouter une date</button>
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
            <b>Dates saisies :</b>
            <ul className="list-disc pl-5">
              {maintenances.filter(Boolean).map((d, i) => (
                <li key={i}>{d.split('-').reverse().join('/')}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block mb-1 font-medium">Notes ou instructions spécifiques</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={3} />
        </div>
        <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded mt-2">Enregistrer la garantie</button>
      </form>
      <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 border-t pt-4">
        <b>Note :</b> Vous pouvez ajouter plusieurs dates de maintenance pour chaque garantie, selon la durée ou le nombre d'interventions prévues.
      </div>
    </div>
  )
} 