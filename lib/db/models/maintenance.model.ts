import { Schema, model, models, Types } from 'mongoose'

const MaintenanceStatusSchema = new Schema({
  garantieId: { type: Types.ObjectId, ref: 'Garantie', required: true },
  userId: { type: Types.ObjectId, ref: 'User', required: true }, // المستخدم الذي أنشأ الصيانة
  maintenanceDate: { type: String, required: true }, // التاريخ المخطط (yyyy-mm-dd)
  status: { 
    type: String, 
    enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'OVERDUE'], 
    default: 'PENDING' 
  },
  completedDate: { type: String }, // تاريخ الإنجاز الفعلي (yyyy-mm-dd)
  notes: { type: String }, // ملاحظات الصيانة
  completedBy: { type: Types.ObjectId, ref: 'User' }, // من قام بالصيانة
  photos: [{ type: String }], // صور قبل/بعد
  maintenanceType: { 
    type: String, 
    enum: ['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'ROUTINE'], 
    default: 'PREVENTIVE' 
  },
  cost: { type: Number, default: 0 }, // تكلفة الصيانة
  description: { type: String }, // وصف العمل المنجز
  isScheduled: { type: Boolean, default: true }, // هل هي صيانة مخططة أم طارئة
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
    default: 'MEDIUM' 
  },
}, { timestamps: true })

// إضافة indexes للبحث السريع
MaintenanceStatusSchema.index({ garantieId: 1, maintenanceDate: 1 })
MaintenanceStatusSchema.index({ status: 1 })
MaintenanceStatusSchema.index({ completedBy: 1 })
MaintenanceStatusSchema.index({ userId: 1 })

const MaintenanceStatus = models.MaintenanceStatus || model('MaintenanceStatus', MaintenanceStatusSchema)
export default MaintenanceStatus 