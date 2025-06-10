import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;

const ServiceSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String },
}, { timestamps: true });

export const Service = models.Service || model('Service', ServiceSchema);

if (!mongoose.models.Service) {
  mongoose.model('Service', ServiceSchema);
} 