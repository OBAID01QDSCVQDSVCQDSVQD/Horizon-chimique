import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/db/mongoose.js';

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String },
}, { timestamps: true });

const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

async function addServices() {
  try {
    // الاتصال بقاعدة البيانات
    await connectToDatabase();
    console.log('Connected to MongoDB');

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
    await mongoose.disconnect();
    process.exit();
  }
}

addServices(); 