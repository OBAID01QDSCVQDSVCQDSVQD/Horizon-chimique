import { Schema, model, models } from 'mongoose';

const CatalogueSchema = new Schema({
  nom: String,
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
  createdAt: { type: Date, default: Date.now }
});

export default models.Catalogue || model('Catalogue', CatalogueSchema); 