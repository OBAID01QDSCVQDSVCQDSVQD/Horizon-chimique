const mongoose = require('mongoose');
require('dotenv').config();

// تعريف Schema المحدث
const catalogueSchema = new mongoose.Schema({
  title: String,
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
  shortdesc: String,
  
  // الحقول الإنجليزية
  title_en: String,
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
  shortdesc_en: String,
  
  // الحقول العربية
  title_ar: String,
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
  shortdesc_ar: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Catalogue = mongoose.model('Catalogue', catalogueSchema);

async function fixCatalogues() {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sdk-batiment');
    console.log('✓ Connected to MongoDB');
    
    // العثور على جميع البيانات
    const catalogues = await Catalogue.find({});
    console.log(`Found ${catalogues.length} catalogues`);
    
    for (const catalogue of catalogues) {
      const updateData = {};
      let needsUpdate = false;
      
      // إضافة الحقول المفقودة
      const fieldsToCheck = [
        'title_en', 'description_en', 'domaine_en', 'proprietes_en', 
        'preparation_en', 'conditions_en', 'application_en', 'consommation_en',
        'nettoyage_en', 'stockage_en', 'consignes_en', 'shortdesc_en',
        'title_ar', 'description_ar', 'domaine_ar', 'proprietes_ar',
        'preparation_ar', 'conditions_ar', 'application_ar', 'consommation_ar',
        'nettoyage_ar', 'stockage_ar', 'consignes_ar', 'shortdesc_ar',
        'domaine', 'preparation', 'conditions', 'application', 
        'consommation', 'nettoyage', 'stockage', 'consignes'
      ];
      
      for (const field of fieldsToCheck) {
        if (catalogue[field] === undefined || catalogue[field] === null) {
          updateData[field] = '';
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await Catalogue.findByIdAndUpdate(catalogue._id, updateData);
        console.log(`✓ Updated: ${catalogue.title}`);
      }
    }
    
    console.log('✅ All catalogues updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixCatalogues(); 