import { Schema, model, models } from 'mongoose';

const CatalogueSchema = new Schema({
  // Champs français (par défaut)
  title: String, // تم تغيير من nom إلى title للتوحيد
  shortdesc: String,
  description: String,
  domaine: String,
  proprietes: String,
  preparation: String,
  conditions: String,
  application: String,
  consommation: String,
  nettoyage: String,
  stockage: String,
  consignes: String,
  
  // Champs anglais
  title_en: String,
  shortdesc_en: String,
  description_en: String,
  domaine_en: String,
  proprietes_en: String,
  preparation_en: String,
  conditions_en: String,
  application_en: String,
  consommation_en: String,
  nettoyage_en: String,
  stockage_en: String,
  consignes_en: String,
  
  // الحقول العربية
  title_ar: String,
  shortdesc_ar: String,
  description_ar: String,
  domaine_ar: String,
  proprietes_ar: String,
  preparation_ar: String,
  conditions_ar: String,
  application_ar: String,
  consommation_ar: String,
  nettoyage_ar: String,
  stockage_ar: String,
  consignes_ar: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default models.Catalogue || model('Catalogue', CatalogueSchema); 