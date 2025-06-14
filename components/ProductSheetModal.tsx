"use client";

import React, { useState } from 'react';
// import FicheTechniquePDF from './FicheTechniquePDF'; // To be created/linked
// import RichTextEditor from './RichTextEditor'; // To be created/linked

const modalStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '10px',
  boxSizing: 'border-box',
};

const modalContentStyles: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: '2rem 1rem',
  minWidth: 0,
  maxWidth: 500,
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  position: 'relative',
  boxSizing: 'border-box',
};

const closeBtnStyles: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  background: 'transparent',
  border: 'none',
  fontSize: 22,
  cursor: 'pointer',
};

const labelStyles: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: 4,
  display: 'block',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #ccc',
  marginBottom: 16,
  fontSize: 15,
  fontFamily: 'inherit',
  resize: 'vertical',
};

const submitBtnStyles: React.CSSProperties = {
  background: 'linear-gradient(90deg,rgb(0, 181, 252),rgb(0, 7, 137))',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '10px 20px',
  fontWeight: 600,
  fontSize: 16,
  cursor: 'pointer',
  marginTop: 8,
  width: '100%',
};

const openBtnStyles: React.CSSProperties = {
  background: 'linear-gradient(90deg,hsl(191, 62.60%, 60.20%),rgb(218, 174, 16))',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '12px 28px',
  fontWeight: 600,
  fontSize: 18,
  cursor: 'pointer',
  margin: '40px auto',
  display: 'block',
};

export default function ProductSheetModal({ open, onClose, onSubmit }: { open: boolean, onClose: () => void, onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({
    nom: '',
    shortdesc: '',
    description: '',
    domaine: '',
    proprietes: '',
    preparation: '',
    conditions: '',
    application: '',
    consommation: '',
    nettoyage: '',
    stockage: '',
    consignes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  if (!open) return null;

  return (
    <div style={modalStyles}>
      <div style={modalContentStyles}>
        <button style={closeBtnStyles} onClick={onClose} title="Fermer">&times;</button>
        <h2 style={{ marginBottom: 20, textAlign: 'center' }}>Fiche technique - Produit de peinture</h2>
        <form onSubmit={handleSubmit}>
          <label style={labelStyles} htmlFor="nom">Nom du produit *</label>
          <input
            style={inputStyles}
            type="text"
            id="nom"
            name="nom"
            value={form.nom}
            onChange={handleChange}
            required
          />
          <label style={labelStyles} htmlFor="shortdesc">Short description</label>
          <input
            style={inputStyles}
            type="text"
            id="shortdesc"
            name="shortdesc"
            value={form.shortdesc}
            onChange={handleChange}
            maxLength={120}
          />
          <label style={labelStyles} htmlFor="description">Description du produit</label>
          <textarea
            style={inputStyles}
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
          />
          <label style={labelStyles} htmlFor="domaine">Domaine d'application</label>
          <textarea
            style={inputStyles}
            id="domaine"
            name="domaine"
            value={form.domaine}
            onChange={handleChange}
            rows={4}
          />
          <label style={labelStyles} htmlFor="proprietes">Propriétés principales</label>
          <textarea
            style={inputStyles}
            id="proprietes"
            name="proprietes"
            value={form.proprietes}
            onChange={handleChange}
            rows={4}
          />
          <label style={labelStyles} htmlFor="preparation">Préparation du support</label>
          <textarea
            style={inputStyles}
            id="preparation"
            name="preparation"
            value={form.preparation}
            onChange={handleChange}
            rows={4}
          />
          <label style={labelStyles} htmlFor="conditions">Conditions d'application</label>
          <textarea
            style={inputStyles}
            id="conditions"
            name="conditions"
            value={form.conditions}
            onChange={handleChange}
            rows={4}
          />
          <label style={labelStyles} htmlFor="application">Application</label>
          <textarea
            style={inputStyles}
            id="application"
            name="application"
            value={form.application}
            onChange={handleChange}
            rows={4}
          />
          <label style={labelStyles} htmlFor="consommation">Consommation</label>
          <textarea
            style={inputStyles}
            id="consommation"
            name="consommation"
            value={form.consommation}
            onChange={handleChange}
            rows={4}
          />
          <label style={labelStyles} htmlFor="nettoyage">Nettoyage</label>
          <textarea
            style={inputStyles}
            id="nettoyage"
            name="nettoyage"
            value={form.nettoyage}
            onChange={handleChange}
            rows={4}
          />
          <label style={labelStyles} htmlFor="stockage">Stockage et conditionnement</label>
          <textarea
            style={inputStyles}
            id="stockage"
            name="stockage"
            value={form.stockage}
            onChange={handleChange}
            rows={4}
          />
          <label style={labelStyles} htmlFor="consignes">Consignes de sécurité</label>
          <textarea
            style={inputStyles}
            id="consignes"
            name="consignes"
            value={form.consignes}
            onChange={handleChange}
            rows={4}
          />
          <button type="submit" style={submitBtnStyles}>Envoyer</button>
        </form>
      </div>
    </div>
  );
} 