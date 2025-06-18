// attribute.model.ts
import mongoose, { Schema, model, models, Document } from 'mongoose'

export interface IAttribute extends Document {
  name: string;
  values: {
    label: string;
    image?: string;
    extraPrice?: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AttributeSchema = new Schema<IAttribute>({
  name: { type: String, required: true, unique: true },
  values: [
    {
      label: { type: String, required: true }, // مثال: "أحمر"
      image: { type: String }, // صورة خاصة بالقيمة (اختياري)
      extraPrice: { type: Number }, // سعر إضافي (اختياري)
    },
  ],
}, { timestamps: true })

const Attribute = models.Attribute || model<IAttribute>('Attribute', AttributeSchema)
export default Attribute
