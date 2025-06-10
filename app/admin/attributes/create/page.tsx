'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createAttribute } from '@/lib/db/actions/attribute.actions'

export default function CreateAttributePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [values, setValues] = useState([{ label: '' }])

  const handleAddValue = () => {
    setValues([...values, { label: '' }])
  }

  const handleChangeValue = (index: number, field: keyof typeof values[number], value: string) => {
    const newValues = [...values]
    newValues[index][field] = value
    setValues(newValues)
  }

  const handleSubmit = async () => {
    await createAttribute({
      name,
      values: values.map((val) => ({ label: val.label })),
    })
    router.push('/admin/attributes')
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Attribute</h1>
      <Card>
        <CardHeader>General Info</CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Attribute Name (e.g. Color, Size)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {values.map((val, i) => (
            <div key={i} className="grid grid-cols-1 gap-4">
              <Input
                placeholder="Value"
                value={val.label}
                onChange={(e) => handleChangeValue(i, 'label', e.target.value)}
              />
            </div>
          ))}

          <Button type="button" onClick={handleAddValue}>
            + Add Value
          </Button>

          <Button type="submit" className="mt-4" onClick={handleSubmit}>
            Save Attribute
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

