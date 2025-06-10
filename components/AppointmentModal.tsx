"use client"
import React, { useState, useEffect } from 'react';
import { FaCalendarCheck, FaTimesCircle } from 'react-icons/fa';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useSession } from 'next-auth/react';
import imageCompression from 'browser-image-compression';

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AppointmentModal({ open, onClose }: AppointmentModalProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [services, setServices] = useState<{ _id: string; name: string }[]>([]);
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [slots, setSlots] = useState([{ date: '', time: '' }]);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  // Load Google Maps
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyBAO3snch_u0rRwaW2R7C2KjTLaFWrKH9k',
  });

  // Get user location on modal open
  useEffect(() => {
    if (open && !location) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            // Default to Tunis if denied
            setLocation({ lat: 36.8065, lng: 10.1815 });
          }
        );
      } else {
        setLocation({ lat: 36.8065, lng: 10.1815 });
      }
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      fetch('/api/services')
        .then(res => res.json())
        .then(data => setServices(data))
        .catch(() => setServices([]));
    }
  }, [open]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
        onClose();
        setLocation(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  useEffect(() => {
    if (location) {
      setGoogleMapsUrl(`https://maps.google.com/?q=${location.lat},${location.lng}`);
    }
  }, [location]);

  if (!open) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos => photos.filter((_, i) => i !== index));
  };

  const uploadImageToCloudinary = async (file: File) => {
    // ضغط الصورة قبل الرفع
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };
    let compressedFile = file;
    try {
      compressedFile = await imageCompression(file, options);
    } catch (err) {
      // إذا فشل الضغط استخدم الملف الأصلي
      console.warn('فشل ضغط الصورة، سيتم رفع الأصلية', err);
    }
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', 'ecommerce-app');
    const res = await fetch('https://api.cloudinary.com/v1_1/dwio60ll1/image/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      // تحقق من أن كل موعد مكتمل
      const validSlots = slots.filter(s => s.date && s.time);
      const dates = validSlots.map(s => s.date);
      const hours = validSlots.map(s => s.time);
      if (dates.length === 0 || hours.length === 0) {
        setError('Veuillez ajouter au moins un créneau complet.');
        setLoading(false);
        return;
      }
      if (!googleMapsUrl) {
        setError('Veuillez ajouter le lien Google Maps.');
        setLoading(false);
        return;
      }
      // رفع الصور إلى Cloudinary
      const photoUrls = [];
      for (const file of photos) {
        const url = await uploadImageToCloudinary(file);
        photoUrls.push(url);
      }
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          phone,
          address,
          serviceId,
          dates,
          hours,
          description,
          photos: photoUrls,
          location,
          googleMapsUrl,
          userId,
        })
      });
      if (!res.ok) throw new Error('Erreur lors de la soumission.');
      setSuccess(true);
      setClientName(''); setPhone(''); setAddress(''); setServiceId(''); setSlots([{ date: '', time: '' }]); setDescription(''); setPhotos([]);
      setGoogleMapsUrl('');
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="relative h-48 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
          <div className="relative h-full flex flex-col items-center justify-center text-white px-6">
            <FaCalendarCheck className="text-5xl mb-4" />
            <h2 className="text-3xl font-bold text-center mb-2">Demandez votre rendez-vous</h2>
            <p className="text-blue-100 text-center">Service d'étanchéité à domicile</p>
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              onClick={onClose}
              aria-label="Fermer"
            >
              <FaTimesCircle className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-h-[calc(90vh-12rem)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Informations personnelles</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom et prénom *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-gray-50" 
                    value={clientName} 
                    onChange={e => setClientName(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-gray-50" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    required 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-gray-50"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    required
                    placeholder="Votre adresse complète"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Localisation sur la carte (optionnel)</label>
                  <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                    {isLoaded && location && (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={location}
                        zoom={15}
                        onClick={e => {
                          if (e.latLng) setLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                        }}
                        options={{ streetViewControl: false, mapTypeControl: false }}
                      >
                        <Marker
                          position={location}
                          draggable
                          onDragEnd={e => {
                            if (e.latLng) setLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                          }}
                        />
                      </GoogleMap>
                    )}
                    {!isLoaded && <div className="flex items-center justify-center h-full text-gray-400">Chargement de la carte...</div>}
                  </div>
                  {location && (
                    <div className="text-xs text-gray-500 mt-1">Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}</div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lien Google Maps *</label>
                  <input
                    type="url"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-gray-50"
                    value={googleMapsUrl}
                    onChange={e => setGoogleMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Service & Time */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Service & créneau</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-gray-50"
                  value={serviceId}
                  onChange={e => setServiceId(e.target.value)}
                  required
                >
                  <option value="">Sélectionner un service</option>
                  {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              {slots.map((slot, idx) => (
                <div className="grid md:grid-cols-2 gap-6 mb-2" key={idx}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-gray-50"
                      value={slot.date}
                      onChange={e => {
                        const newSlots = [...slots];
                        newSlots[idx].date = e.target.value;
                        setSlots(newSlots);
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure *</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-gray-50"
                      value={slot.time}
                      onChange={e => {
                        const newSlots = [...slots];
                        newSlots[idx].time = e.target.value;
                        setSlots(newSlots);
                      }}
                      required
                    >
                      <option value="">Sélectionner l'heure</option>
                      {Array.from({ length: 20 }, (_, i) => {
                        const hour = (8 + Math.floor(i / 2)).toString().padStart(2, '0');
                        const minute = i % 2 === 0 ? '00' : '30';
                        const value = `${hour}:${minute}`;
                        return (
                          <option key={value} value={value}>{value}</option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="mt-2 mb-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200 hover:bg-blue-100 transition"
                onClick={() => setSlots([...slots, { date: '', time: '' }])}
              >
                + Ajouter un autre créneau
              </button>
            </div>

            {/* Description */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Description du problème</h3>
              </div>
              <textarea 
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-gray-50" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows={3} 
                placeholder="Décrivez brièvement le problème (optionnel)" 
              />
            </div>

            {/* Photos */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Photos (optionnel)</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez</p>
                      <p className="text-xs text-gray-500">PNG, JPG ou GIF (MAX. 800x400px)</p>
                    </div>
                    <input type="file" className="hidden" multiple accept="image/*" onChange={handlePhotoChange} />
                  </label>
                </div>
                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {photos.map((f, i) => {
                      const url = URL.createObjectURL(f);
                      return (
                        <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-blue-200 bg-white shadow-sm flex items-center justify-center">
                          <img src={url} alt={f.name} className="object-cover w-full h-full" />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red-600 shadow hover:bg-red-100 transition opacity-0 group-hover:opacity-100"
                            onClick={() => handleRemovePhoto(i)}
                            title="Supprimer la photo"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <FaCalendarCheck className="text-xl" />
              {loading ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </form>
        </div>

        {/* Messages */}
        {success && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-green-100 border-2 border-green-400 rounded-2xl px-8 py-6 flex flex-col items-center shadow-2xl animate-fade-in-up">
              <svg className="w-12 h-12 mb-2 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a10 10 0 11-20 0 10 10 0 0120 0z" /></svg>
              <span className="text-lg font-bold text-green-700">Votre demande a été envoyée avec succès !</span>
            </div>
          </div>
        )}
        {error && (
          <div className="fixed bottom-0 left-0 right-0 bg-red-50 text-red-700 px-6 py-4 flex items-center gap-3 border-t border-red-100">
            <FaTimesCircle className="text-xl" />
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>
      <style jsx>{`
        .animate-fade-in {
          animation: fadeInModal 0.4s;
        }
        @keyframes fadeInModal {
          from { opacity: 0; transform: translateY(40px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
} 