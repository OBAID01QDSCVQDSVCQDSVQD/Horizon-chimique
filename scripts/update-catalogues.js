const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';

async function updateCatalogues() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('catalogues');
    
    // العثور على جميع البيانات الموجودة
    const catalogues = await collection.find({}).toArray();
    console.log(`Found ${catalogues.length} catalogues to update`);
    
    for (const catalogue of catalogues) {
      const updateData = {};
      
      // إضافة الحقول الإنجليزية الفارغة إذا لم تكن موجودة
      if (!catalogue.title_en) updateData.title_en = '';
      if (!catalogue.shortdesc_en) updateData.shortdesc_en = '';
      if (!catalogue.description_en) updateData.description_en = '';
      if (!catalogue.domaine_en) updateData.domaine_en = '';
      if (!catalogue.proprietes_en) updateData.proprietes_en = '';
      if (!catalogue.preparation_en) updateData.preparation_en = '';
      if (!catalogue.conditions_en) updateData.conditions_en = '';
      if (!catalogue.application_en) updateData.application_en = '';
      if (!catalogue.consommation_en) updateData.consommation_en = '';
      if (!catalogue.nettoyage_en) updateData.nettoyage_en = '';
      if (!catalogue.stockage_en) updateData.stockage_en = '';
      if (!catalogue.consignes_en) updateData.consignes_en = '';
      
      // إضافة الحقول العربية الفارغة إذا لم تكن موجودة
      if (!catalogue.title_ar) updateData.title_ar = '';
      if (!catalogue.shortdesc_ar) updateData.shortdesc_ar = '';
      if (!catalogue.description_ar) updateData.description_ar = '';
      if (!catalogue.domaine_ar) updateData.domaine_ar = '';
      if (!catalogue.proprietes_ar) updateData.proprietes_ar = '';
      if (!catalogue.preparation_ar) updateData.preparation_ar = '';
      if (!catalogue.conditions_ar) updateData.conditions_ar = '';
      if (!catalogue.application_ar) updateData.application_ar = '';
      if (!catalogue.consommation_ar) updateData.consommation_ar = '';
      if (!catalogue.nettoyage_ar) updateData.nettoyage_ar = '';
      if (!catalogue.stockage_ar) updateData.stockage_ar = '';
      if (!catalogue.consignes_ar) updateData.consignes_ar = '';
      
      // إضافة الحقول الفرنسية الفارغة إذا لم تكن موجودة
      if (!catalogue.domaine) updateData.domaine = '';
      if (!catalogue.preparation) updateData.preparation = '';
      if (!catalogue.conditions) updateData.conditions = '';
      if (!catalogue.application) updateData.application = '';
      if (!catalogue.consommation) updateData.consommation = '';
      if (!catalogue.nettoyage) updateData.nettoyage = '';
      if (!catalogue.stockage) updateData.stockage = '';
      if (!catalogue.consignes) updateData.consignes = '';
      
      // تحديث البيانات إذا كان هناك تحديثات مطلوبة
      if (Object.keys(updateData).length > 0) {
        await collection.updateOne(
          { _id: catalogue._id },
          { $set: updateData }
        );
        console.log(`Updated catalogue: ${catalogue.title} (${catalogue._id})`);
      }
    }
    
    console.log('✅ All catalogues updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating catalogues:', error);
  } finally {
    await client.close();
  }
}

updateCatalogues(); 