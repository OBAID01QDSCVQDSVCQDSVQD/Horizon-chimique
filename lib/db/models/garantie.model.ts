import { Schema, model, models, Types } from 'mongoose'

const MaintenancePeriodSchema = new Schema({
  date: { type: String }, // dd/mm/yyyy
}, { _id: false })

const SurfaceSchema = new Schema({
  type: { type: String },
  value: { type: Number },
}, { _id: false })

const GarantieSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  company: { type: String },
  name: { type: String },
  phone: { type: String },
  address: { type: String },
  surface: [SurfaceSchema],
  montant: { type: Number },
  installDate: { type: String }, // yyyy-mm-dd
  duration: { type: Number },
  notes: { type: String },
  maintenances: [MaintenancePeriodSchema],
  status: { type: String, enum: ['APPROVED', 'PENDING', 'REJECTED'], default: 'PENDING', required: true },
}, { timestamps: true })

const Garantie = models.Garantie || model('Garantie', GarantieSchema)
export default Garantie 