import mongoose, { Schema, model, models } from 'mongoose';

const AppointmentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  clientName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  description: { type: String },
  photos: [{ type: String }],
  dates: [{ type: String }], // ISO date strings
  hours: [{ type: String }], // e.g. ['16:00', '18:00']
  status: { type: String, default: 'en attente' },
  googleMapsUrl: { type: String },
}, { timestamps: true });

export const Appointment = models.Appointment || model('Appointment', AppointmentSchema); 