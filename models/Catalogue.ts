import mongoose from 'mongoose';

const catalogueSchema = new mongoose.Schema({
  // الحقول الفرنسية (الافتراضية)
  title: {
    type: String,
    required: false,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  domaine: {
    type: String,
    required: false,
    trim: true
  },
  proprietes: {
    type: String,
    required: false,
    trim: true
  },
  preparation: {
    type: String,
    required: false,
    trim: true
  },
  conditions: {
    type: String,
    required: false,
    trim: true
  },
  application: {
    type: String,
    required: false,
    trim: true
  },
  consommation: {
    type: String,
    required: false,
    trim: true
  },
  nettoyage: {
    type: String,
    required: false,
    trim: true
  },
  stockage: {
    type: String,
    required: false,
    trim: true
  },
  consignes: {
    type: String,
    required: false,
    trim: true
  },
  shortdesc: {
    type: String,
    required: false,
    trim: true
  },
  
  // الحقول الإنجليزية
  title_en: {
    type: String,
    required: false,
    trim: true
  },
  description_en: {
    type: String,
    required: false,
    trim: true
  },
  domaine_en: {
    type: String,
    required: false,
    trim: true
  },
  proprietes_en: {
    type: String,
    required: false,
    trim: true
  },
  preparation_en: {
    type: String,
    required: false,
    trim: true
  },
  conditions_en: {
    type: String,
    required: false,
    trim: true
  },
  application_en: {
    type: String,
    required: false,
    trim: true
  },
  consommation_en: {
    type: String,
    required: false,
    trim: true
  },
  nettoyage_en: {
    type: String,
    required: false,
    trim: true
  },
  stockage_en: {
    type: String,
    required: false,
    trim: true
  },
  consignes_en: {
    type: String,
    required: false,
    trim: true
  },
  shortdesc_en: {
    type: String,
    required: false,
    trim: true
  },
  
  // الحقول العربية
  title_ar: {
    type: String,
    required: false,
    trim: true
  },
  description_ar: {
    type: String,
    required: false,
    trim: true
  },
  domaine_ar: {
    type: String,
    required: false,
    trim: true
  },
  proprietes_ar: {
    type: String,
    required: false,
    trim: true
  },
  preparation_ar: {
    type: String,
    required: false,
    trim: true
  },
  conditions_ar: {
    type: String,
    required: false,
    trim: true
  },
  application_ar: {
    type: String,
    required: false,
    trim: true
  },
  consommation_ar: {
    type: String,
    required: false,
    trim: true
  },
  nettoyage_ar: {
    type: String,
    required: false,
    trim: true
  },
  stockage_ar: {
    type: String,
    required: false,
    trim: true
  },
  consignes_ar: {
    type: String,
    required: false,
    trim: true
  },
  shortdesc_ar: {
    type: String,
    required: false,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Mettre à jour le champ updatedAt avant chaque sauvegarde
catalogueSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// حذف النموذج الحالي وإعادة تسجيله لضمان تحديث Schema
if (mongoose.models.Catalogue) {
  delete mongoose.models.Catalogue;
}

const Catalogue = mongoose.model('Catalogue', catalogueSchema);

export default Catalogue; 