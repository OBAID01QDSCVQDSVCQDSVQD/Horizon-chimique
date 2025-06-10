import React, { useState, useEffect } from 'react';
import { IService } from '@/types';

export default function AppointmentForm() {
  const [services, setServices] = useState<IService[]>([]);
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [hours, setHours] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(() => setServices([]));
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDates(prev => prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHours(prev => prev.includes(value) ? prev.filter(h => h !== value) : [...prev, value]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      // For now, just send photo names (simulate upload)
      const photoUrls = photos.map(f => f.name);
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          phone,
          address,
          serviceId,
          description,
          photos: photoUrls,
          dates,
          hours,
        })
      });
      if (!res.ok) throw new Error('Erreur lors de la soumission.');
      setSuccess(true);
      setClientName(''); setPhone(''); setAddress(''); setServiceId(''); setDescription(''); setPhotos([]); setDates([]); setHours([]);
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white dark:bg-gray-900 p-6 rounded-xl shadow space-y-4">
      <h2 className="text-2xl font-bold mb-2 text-center text-blue-700">Prendre un rendez-vous pour un service d'étanchéité</h2>
      {success && <div className="bg-green-100 text-green-700 p-2 rounded">Votre demande a été envoyée. Nous vous contacterons pour confirmer le rendez-vous.</div>}
      {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
      <div>
        <label className="block font-semibold mb-1">Nom et prénom *</label>
        <input type="text" className="input input-bordered w-full" value={clientName} onChange={e => setClientName(e.target.value)} required />
      </div>
      <div>
        <label className="block font-semibold mb-1">Téléphone *</label>
        <input type="tel" className="input input-bordered w-full" value={phone} onChange={e => setPhone(e.target.value)} required />
      </div>
      <div>
        <label className="block font-semibold mb-1">Adresse *</label>
        <input type="text" className="input input-bordered w-full" value={address} onChange={e => setAddress(e.target.value)} required />
      </div>
      <div>
        <label className="block font-semibold mb-1">Service souhaité *</label>
        <select className="input input-bordered w-full" value={serviceId} onChange={e => setServiceId(e.target.value)} required>
          <option value="">Sélectionner un service</option>
          {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block font-semibold mb-1">Description du problème</label>
        <textarea className="input input-bordered w-full" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
      </div>
      <div>
        <label className="block font-semibold mb-1">Télécharger des photos</label>
        <input type="file" multiple accept="image/*" onChange={handlePhotoChange} />
        {photos.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{photos.map((f, i) => <span key={i} className="text-xs bg-gray-200 px-2 py-1 rounded">{f.name}</span>)}</div>}
      </div>
      <div>
        <label className="block font-semibold mb-1">Date(s) souhaitée(s)</label>
        <input type="date" onChange={handleDateChange} className="input input-bordered" />
        <div className="flex flex-wrap gap-2 mt-2">
          {dates.map((d, i) => <span key={i} className="text-xs bg-blue-100 px-2 py-1 rounded">{d}</span>)}
        </div>
      </div>
      <div>
        <label className="block font-semibold mb-1">Heure(s) souhaitée(s)</label>
        <input type="time" onChange={handleHourChange} className="input input-bordered" />
        <div className="flex flex-wrap gap-2 mt-2">
          {hours.map((h, i) => <span key={i} className="text-xs bg-blue-100 px-2 py-1 rounded">{h}</span>)}
        </div>
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? 'Envoi...' : 'Envoyer la demande'}</button>
    </form>
  );
} 