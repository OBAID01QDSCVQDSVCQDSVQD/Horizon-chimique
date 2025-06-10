import 'dotenv/config' // 👈 هذا السطر هو المفتاح
import dotenv from 'dotenv'
dotenv.config()




import '@/lib/db/mongoose';
import { Service } from '@/lib/db/models/service.model';

async function addServices() {
  try {
    // التحقق من وجود الخدمات
    const existingServices = await Service.find({
      name: { $in: ['Diagnostic travaux detanchite', 'Reclamation'] }
    });

    if (existingServices.length > 0) {
      console.log('Certains services existent déjà:');
      existingServices.forEach(s => console.log(`- ${s.name}`));
      return;
    }

    // إضافة الخدمات الجديدة
    const services = [
      {
        name: 'Diagnostic travaux detanchite',
        description: 'Service de diagnostic et réparation des problèmes d\'étanchéité',
      },
      {
        name: 'Reclamation',
        description: 'Service de traitement des réclamations et problèmes post-intervention',
      }
    ];

    const createdServices = await Service.insertMany(services);
    console.log('Services ajoutés avec succès:');
    createdServices.forEach(s => console.log(`- ${s.name}`));
  } catch (error) {
    console.error('Erreur lors de l\'ajout des services:', error);
  } finally {
    process.exit();
  }
}

addServices(); 