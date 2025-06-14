import mongoose from 'mongoose';

const catalogueSchema = new mongoose.Schema({
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

const Catalogue = mongoose.models.Catalogue || mongoose.model('Catalogue', catalogueSchema);

export default Catalogue; 