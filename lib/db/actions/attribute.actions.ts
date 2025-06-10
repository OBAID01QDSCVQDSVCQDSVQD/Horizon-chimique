'use server'

import { connectToDatabase } from '@/lib/db'
import Attribute from '@/lib/db/models/attribute.model'

// ✅ هذا هو الكود الصحيح
export async function createAttribute(data: {
  name: string
  values: {
    label: string      // ✅ لازم يكون "label"
    image?: string
    extraPrice?: number     // ✅ لازم يكون "extraPrice"
  }[]
}) {
  try {
    await connectToDatabase()
    const newAttr = new Attribute(data)
    await newAttr.save()
    return { success: true, message: 'Attribute created successfully', attribute: JSON.parse(JSON.stringify(newAttr)) }
  } catch (error) {
    return { success: false, message: 'Error creating attribute', error: error instanceof Error ? error.message : String(error) }
  }
}

export async function getAllAttributes() {
  try {
  await connectToDatabase()
  const attributes = await Attribute.find().lean()
    return JSON.parse(JSON.stringify(attributes))
  } catch (error) {
    return { success: false, message: 'Error fetching attributes', error: error instanceof Error ? error.message : String(error) }
  }
}

export async function getAttributeById(id: string) {
  try {
    await connectToDatabase()
    const attribute = await Attribute.findById(id).lean()
    if (!attribute) return { success: false, message: 'Attribute not found' }
    return { success: true, attribute: JSON.parse(JSON.stringify(attribute)) }
  } catch (error) {
    return { success: false, message: 'Error fetching attribute', error: error instanceof Error ? error.message : String(error) }
  }
}

export async function updateAttribute(id: string, data: {
  name?: string
  values?: {
    label: string
    image?: string
    extraPrice?: number
  }[]
}) {
  try {
    await connectToDatabase()
    const updated = await Attribute.findByIdAndUpdate(id, data, { new: true })
    if (!updated) return { success: false, message: 'Attribute not found' }
    return { success: true, message: 'Attribute updated successfully', attribute: JSON.parse(JSON.stringify(updated)) }
  } catch (error) {
    return { success: false, message: 'Error updating attribute', error: error instanceof Error ? error.message : String(error) }
  }
}
