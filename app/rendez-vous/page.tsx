"use client"
import React, { useState, useEffect } from 'react';
import { FaCalendarCheck, FaTimesCircle } from 'react-icons/fa';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useSession } from 'next-auth/react';
import imageCompression from 'browser-image-compression';
import { Metadata } from 'next';
export default function RendezVousPage() {
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
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Load Google Maps
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyBAO3snch_u0rRwaW2R7C2KjTLaFWrKH9k',
  });

  // Get user location automatically
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(newLocation);
          setGoogleMapsUrl(`https://maps.google.com/?q=${newLocation.lat},${newLocation.lng}`);
          setLocationLoading(false);
        },
        (error) => {
          setLocationLoading(false);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError('Permission de localisation refusée. Veuillez autoriser l\'accès à votre position.');
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError('Informations de localisation non disponibles.');
              break;
            case error.TIMEOUT:
              setLocationError('Délai d\'attente de localisation dépassé.');
              break;
            default:
              setLocationError('Erreur lors de la détermination de la position.');
          }
          // Default to Tunis if denied
          setLocation({ lat: 36.8065, lng: 10.1815 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setLocationLoading(false);
      setLocationError('Votre navigateur ne prend pas en charge la géolocalisation.');
      setLocation({ lat: 36.8065, lng: 10.1815 });
    }
  };

  // Get user location on page load
  useEffect(() => {
    if (!location) {
      getCurrentLocation();
    }
  }, []);

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(() => setServices([]));
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setLocation(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (location) {
      setGoogleMapsUrl(`https://maps.google.com/?q=${location.lat},${location.lng}`);
    }
  }, [location]);

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
    
    // إظهار علامة التحميل في الوسط
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
    loadingOverlay.innerHTML = `
      <div class="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p class="text-lg font-semibold text-gray-700">Envoi en cours...</p>
      </div>
    `;
    document.body.appendChild(loadingOverlay);
    try {
      // تحقق من أن كل موعد مكتمل
      const validSlots = slots.filter(s => s.date && s.time);
      const dates = validSlots.map(s => s.date);
      const hours = validSlots.map(s => s.time);
      if (dates.length === 0 || hours.length === 0) {
        setError('Veuillez ajouter au moins un créneau complet.');
        setLoading(false);
        document.body.removeChild(loadingOverlay);
        return;
      }
      if (!googleMapsUrl) {
        setError('Veuillez ajouter le lien Google Maps.');
        setLoading(false);
        document.body.removeChild(loadingOverlay);
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
      
      // إزالة علامة التحميل
      document.body.removeChild(loadingOverlay);
      
      // إظهار toast النجاح
      const successToast = document.createElement('div');
      successToast.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full';
      successToast.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
          <span class="font-semibold">Demande envoyée avec succès!</span>
        </div>
      `;
      document.body.appendChild(successToast);
      
      // أنيميشن ظهور
      setTimeout(() => {
        successToast.classList.remove('translate-x-full');
      }, 100);
      
      // إخفاء بعد 3 ثوان
      setTimeout(() => {
        successToast.classList.add('translate-x-full');
        setTimeout(() => {
          if (document.body.contains(successToast)) {
            document.body.removeChild(successToast);
          }
        }, 300);
      }, 3000);
      
      setSuccess(true);
      setClientName(''); setPhone(''); setAddress(''); setServiceId(''); setSlots([{ date: '', time: '' }]); setDescription(''); setPhotos([]);
      setGoogleMapsUrl('');
    } catch (err: any) {
      // إزالة علامة التحميل
      document.body.removeChild(loadingOverlay);
      setError(err.message || 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <FaCalendarCheck className="text-6xl mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Demandez votre rendez-vous</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Service d'étanchéité à domicile - Prenez rendez-vous en ligne
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Form Content */}
            <div className="overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <div className="flex items-center gap-3 text-blue-600 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold">Informations personnelles</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nom et prénom *</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-white" 
                            value={clientName} 
                            onChange={e => setClientName(e.target.value)} 
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                          <input 
                            type="tel" 
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-white" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)} 
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-white"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            required
                            placeholder="Votre adresse complète"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Service & Time */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <div className="flex items-center gap-3 text-blue-600 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold">Service & créneau</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
                          <select
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-white"
                            value={serviceId}
                            onChange={e => setServiceId(e.target.value)}
                            required
                          >
                            <option value="">Sélectionner un service</option>
                            {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                          </select>
                        </div>
                        {slots.map((slot, idx) => (
                          <div className="grid grid-cols-2 gap-4" key={idx}>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                              <input
                                type="date"
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-white"
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
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-white"
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
                          className="w-full px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200 hover:bg-blue-100 transition"
                          onClick={() => setSlots([...slots, { date: '', time: '' }])}
                        >
                          + Ajouter un autre créneau
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <div className="flex items-center gap-3 text-blue-600 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold">Description du problème</h3>
                      </div>
                      <textarea 
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-white" 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        rows={4} 
                        placeholder="Décrivez brièvement le problème (optionnel)" 
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Location */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <div className="flex items-center gap-3 text-blue-600 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold">Localisation</h3>
                      </div>
                      <div className="space-y-4">
                        {/* Auto Location Button */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={locationLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {locationLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Détermination de la position...</span>
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <span>Déterminer ma position automatiquement</span>
                              </>
                            )}
                          </button>
                          {location && (
                            <div className="text-sm text-green-600 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Position déterminée
                            </div>
                          )}
                        </div>
                        
                        {/* Location Error */}
                        {locationError && (
                          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                            {locationError}
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Carte interactive</label>
                          <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                            {isLoaded && location && (
                              <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={location}
                                zoom={15}
                                onClick={e => {
                                  if (e.latLng) {
                                    const newLocation = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                                    setLocation(newLocation);
                                    setGoogleMapsUrl(`https://maps.google.com/?q=${newLocation.lat},${newLocation.lng}`);
                                  }
                                }}
                                options={{ streetViewControl: false, mapTypeControl: false }}
                              >
                                <Marker
                                  position={location}
                                  draggable
                                  onDragEnd={e => {
                                    if (e.latLng) {
                                      const newLocation = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                                      setLocation(newLocation);
                                      setGoogleMapsUrl(`https://maps.google.com/?q=${newLocation.lat},${newLocation.lng}`);
                                    }
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Lien Google Maps *</label>
                          <input
                            type="url"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none bg-white"
                            value={googleMapsUrl}
                            onChange={e => setGoogleMapsUrl(e.target.value)}
                            placeholder="https://maps.google.com/..."
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Photos */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <div className="flex items-center gap-3 text-blue-600 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold">Photos (optionnel)</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50">
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
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-8">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <FaCalendarCheck className="text-xl" />
                    {loading ? 'Envoi...' : 'Envoyer la demande'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-50 text-red-700 px-6 py-4 flex items-center gap-3 border-t border-red-100">
          <FaTimesCircle className="text-xl" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
} 