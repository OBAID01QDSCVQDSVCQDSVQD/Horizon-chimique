"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FiArrowLeft, FiPlus, FiTrash2, FiSave } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getAttributeById, updateAttribute } from '@/lib/db/actions/attribute.actions'

export default function EditAttributePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [name, setName] = useState('')
  const [values, setValues] = useState([{ label: '' }])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchAttribute = async () => {
      if (!id) return
      const res = await getAttributeById(id)
      if (res && res.success && res.attribute) {
        const attr = Array.isArray(res.attribute) ? res.attribute[0] : res.attribute
        setName(attr.name)
        setValues(
          (attr.values || []).map((val: any) => ({
            label: val.label || '',
          }))
        )
      }
      setLoading(false)
    }
    fetchAttribute()
  }, [id])

  const handleAddValue = () => {
    setValues([...values, { label: '' }])
  }

  const handleRemoveValue = (index: number) => {
    if (values.length === 1) return
    setValues(values.filter((_, i) => i !== index))
  }

  const handleChangeValue = (index: number, field: keyof typeof values[number], value: string) => {
    const newValues = [...values]
    newValues[index][field] = value
    setValues(newValues)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await updateAttribute(id, {
        name,
        values: values.map((val) => ({ label: val.label })),
      })
      toast.success('Attribut modifié avec succès !')
      router.push('/admin/attributes')
    } catch (e) {
      toast.error('Erreur lors de la modification')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4 text-center text-gray-500">Chargement...</div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" onClick={() => router.push('/admin/attributes')} className="p-2">
          <FiArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          Modifier l'attribut
        </h1>
      </div>
      <Card className="shadow-lg border-0 dark:bg-gray-900">
        <CardHeader className="font-semibold text-lg text-gray-800 dark:text-gray-100">Informations de l'attribut</CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nom de l'attribut</label>
            <Input
              placeholder="Nom de l'attribut (ex: Couleur, Taille)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Valeurs</label>
            <div className="space-y-2">
              {values.map((val, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="Valeur"
                    value={val.label}
                    onChange={(e) => handleChangeValue(i, 'label', e.target.value)}
                    className="bg-white dark:bg-gray-800"
                  />
                  {values.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveValue(i)}>
                      <FiTrash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddValue} className="mt-2 flex items-center gap-2">
                <FiPlus className="w-4 h-4" /> Ajouter une valeur
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={() => router.push('/admin/attributes')}>Annuler</Button>
            <Button type="submit" className="flex items-center gap-2" onClick={handleSubmit} disabled={saving}>
              <FiSave className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 