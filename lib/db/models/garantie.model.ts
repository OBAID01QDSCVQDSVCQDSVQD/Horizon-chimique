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
  maintenances: [MaintenancePeriodSchema], // سيتم الاحتفاظ به للتوافق مع البيانات القديمة
  status: { type: String, enum: ['APPROVED', 'PENDING', 'REJECTED'], default: 'PENDING', required: true },
  
  // الحقول الجديدة لإدارة الصيانة
  garantieStatus: { 
    type: String, 
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'], 
    default: 'ACTIVE' 
  },
  lastMaintenanceDate: { type: String }, // آخر صيانة تمت
  nextMaintenanceDate: { type: String }, // موعد الصيانة القادمة
  maintenanceCount: { type: Number, default: 0 }, // عدد الصيانات المنجزة
  totalMaintenanceCost: { type: Number, default: 0 }, // إجمالي تكلفة الصيانة
}, { timestamps: true })

const Garantie = models.Garantie || model('Garantie', GarantieSchema)
export default Garantie 