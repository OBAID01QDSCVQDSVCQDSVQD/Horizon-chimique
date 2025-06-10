// attribute.model.ts
import mongoose, { Schema, model, models } from 'mongoose'

const AttributeSchema = new Schema({
  name: { type: String, required: true, unique: true },
  values: [
    {
      label: { type: String, required: true }, // مثال: "أحمر"
      image: { type: String }, // صورة خاصة بالقيمة (اختياري)
      extraPrice: { type: Number }, // سعر إضافي (اختياري)
    },
  ],
}, { timestamps: true })

const Attribute = models.Attribute || model('Attribute', AttributeSchema)
export default Attribute
