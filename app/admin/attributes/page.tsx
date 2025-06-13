"use client"

// app/admin/attributes/page.tsx

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'

interface AttributeValue {
  label: string
  _id: string
  // image?: string
  // price?: number
}

interface Attribute {
  _id: string
  name: string
  values: AttributeValue[]
}

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // جلب السمات من API أو mock
    async function fetchAttributes() {
      setLoading(true)
      try {
        const res = await fetch('/api/attributes/list')
        const data = await res.json()
        setAttributes(data.data || [])
      } catch (e) {
        setAttributes([])
      } finally {
        setLoading(false)
      }
    }
    fetchAttributes()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد أنك تريد حذف هذا السمة؟')) return;
    try {
      const res = await fetch(`/api/attributes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAttributes(prev => prev.filter(attr => attr._id !== id))
      } else {
        alert('فشل الحذف!')
      }
    } catch {
      alert('حدث خطأ أثناء الحذف!')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Attributs</h1>
        <Link
          href="/admin/attributes/create"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
        >
          <FiPlus className="w-4 h-4" /> Ajouter un Attribut
        </Link>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-400"></div>
            <span className="ml-3">Chargement en cours...</span>
          </div>
        ) : attributes.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">Aucun attribut disponible</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre de valeurs</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {attributes.map((attr) => (
                  <tr key={attr._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{attr.name}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {attr.values.length}
                      {attr.values.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {attr.values.map(v => v.label).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <Link
                        href={`/admin/attributes/${attr._id}/edit`}
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm px-2 py-1 rounded transition"
                        title="Modifier"
                      >
                        <FiEdit2 className="w-4 h-4" /> Modifier
                      </Link>
                      <button
                        onClick={() => handleDelete(attr._id)}
                        className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-sm px-2 py-1 rounded transition"
                        title="Supprimer"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
