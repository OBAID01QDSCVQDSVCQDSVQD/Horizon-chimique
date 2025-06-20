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

async function checkEnglishContent() {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sdk-batiment');
    console.log('✓ Connected to MongoDB');
    
    // العثور على أول catalogue لفحصه
    const catalogue = await Catalogue.findOne({});
    if (!catalogue) {
      console.log('❌ No catalogues found');
      return;
    }
    
    console.log('=== CHECKING FIRST CATALOGUE ===');
    console.log('ID:', catalogue._id);
    console.log('Title FR:', catalogue.title);
    console.log('Title EN:', catalogue.title_en);
    console.log('Title AR:', catalogue.title_ar);
    
    console.log('\n=== ENGLISH FIELDS STATUS ===');
    const englishFields = [
      'title_en', 'shortdesc_en', 'description_en', 'domaine_en', 'proprietes_en', 
      'preparation_en', 'conditions_en', 'application_en', 'consommation_en', 
      'nettoyage_en', 'stockage_en', 'consignes_en'
    ];
    
    let missingCount = 0;
    let existingCount = 0;
    
    for (const field of englishFields) {
      const value = catalogue[field];
      if (value && value.trim()) {
        console.log(`✓ ${field}: EXISTS (${value.substring(0, 50)}...)`);
        existingCount++;
      } else {
        console.log(`❌ ${field}: MISSING or EMPTY`);
        missingCount++;
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Existing fields: ${existingCount}`);
    console.log(`Missing fields: ${missingCount}`);
    
    if (missingCount > 0) {
      console.log('\n⚠️  Some English fields are missing. You need to add translations!');
      console.log('Go to /admin/catalogues and edit this catalogue to add English translations.');
    } else {
      console.log('\n✅ All English fields are present!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkEnglishContent(); 