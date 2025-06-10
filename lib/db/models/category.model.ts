import mongoose, { Schema, model, models } from 'mongoose';

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true }, // للروابط
  description: { type: String },
  image: { type: String }, // صورة للتصنيف (اختياري)
}, { timestamps: true });

export const Category = models.Category || model('Category', CategorySchema);

