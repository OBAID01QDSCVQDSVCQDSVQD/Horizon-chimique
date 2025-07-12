"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [showEdit, setShowEdit] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [form, setForm] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: (session?.user as any)?.phone || "",
    bio: (session?.user as any)?.bio || "",
    profileImage: (session?.user as any)?.profileImage || "",
    role: (session?.user as any)?.role || "",
    company: (session?.user as any)?.company || "",
    address: (session?.user as any)?.address || "",
    createdAt: (session?.user as any)?.createdAt || "",
    updatedAt: (session?.user as any)?.updatedAt || "",
    companyLogo: (session?.user as any)?.companyLogo || "",
    matriculeFiscale: (session?.user as any)?.matriculeFiscale || "",
    website: (session?.user as any)?.website || "",
    socialMedia: (session?.user as any)?.socialMedia || "",
  });
  const [imagePreview, setImagePreview] = useState(form.profileImage);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (!session?.user?.id) return;
      setLoadingUser(true);
      try {
        console.log('Fetching user data for ID:', session.user.id);
        const res = await fetch(`/api/user/${session.user.id}`);
        console.log('API Response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('User data received:', data);
          setUserData(data);
        } else {
          console.error('Failed to fetch user data:', res.status);
          const errorText = await res.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoadingUser(false);
      }
    }
    fetchUser();
  }, [session?.user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File) => {
    try {
      // Vérification de la taille du fichier (moins de 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('La taille du fichier est trop grande. Elle doit être inférieure à 10MB');
      }

      // Vérification du type de fichier
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }

      // Vérification de la présence des variables d\'environnement
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error('Les paramètres Cloudinary ne sont pas présents dans les variables d\'environnement');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error('Cloudinary error:', errorData);
        throw new Error(`Échec du téléchargement de l'image: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Image téléchargée avec succès:', data.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image vers Cloudinary:', error);
      throw error;
    }
  };

  // Modification de handleProfileImageChange pour télécharger l'image de profil vers Cloudinary
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
      const url = await uploadToCloudinary(file);
        setImagePreview(url);
      setForm(f => ({ ...f, profileImage: url }));
      } catch (error) {
        console.error('Error uploading profile image:', error);
        alert("Erreur lors du téléchargement de l'image de profil");
      } finally {
        setLoading(false);
      }
    }
  };

  // Modification de handleCompanyLogoChange pour télécharger le logo de l'entreprise vers Cloudinary
  const handleCompanyLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        console.log('Début du téléchargement du logo de l\'entreprise...', file.name, file.size, file.type);
        const url = await uploadToCloudinary(file);
        console.log('Logo de l\'entreprise téléchargé avec succès:', url);
        setForm(f => ({ ...f, companyLogo: url }));
        alert("Logo de l'entreprise téléchargé avec succès!");
      } catch (error: any) {
        console.error('Erreur lors du téléchargement du logo de l\'entreprise:', error);
        const errorMessage = error.message || "Erreur inconnue lors du téléchargement du logo";
        alert(`Erreur lors du téléchargement du logo de l'entreprise: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          bio: form.bio,
          company: form.company,
          address: form.address,
          matriculeFiscale: form.matriculeFiscale,
          website: form.website,
          socialMedia: form.socialMedia,
          profileImage: form.profileImage,
          companyLogo: form.companyLogo,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du profil');
      }

      const data = await response.json();
      console.log('Updated user data:', data);
      setUserData(data);
      setShowEdit(false);
      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error('Erreur:', error);
      alert("Une erreur s'est produite lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = () => {
    if (userData) {
      setForm({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        bio: userData.bio || "",
        profileImage: userData.profileImage || "",
        role: userData.role || "",
        company: userData.company || "",
        address: userData.address || "",
        createdAt: userData.createdAt || "",
        updatedAt: userData.updatedAt || "",
        companyLogo: userData.companyLogo || "",
        matriculeFiscale: userData.matriculeFiscale || "",
        website: userData.website || "",
        socialMedia: userData.socialMedia || "",
      });
      setImagePreview(userData.profileImage || "");
    }
    setShowEdit(true);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-10 relative">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-700">Mon profil</h1>
        <button onClick={handleOpenEdit} className="text-blue-600 hover:text-blue-800 p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition" title="Modifier le profil">
          <FaEdit size={20} />
        </button>
      </div>
      {loadingUser ? (
        <div className="text-center text-gray-400">Chargement...</div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4 mb-8">
            {/* Image de profil */}
            <div className="relative w-32 h-32 mb-2">
              <img
                src={userData?.profileImage || "/default-avatar.png"}
                alt="Avatar"
                className="w-full h-full object-cover rounded-full border-4 border-blue-200 shadow"
              />
            </div>
            <div className="text-xl font-bold text-gray-800">{userData?.name}</div>
            <div className="text-gray-500">{userData?.email}</div>
            
            {/* Informations de l'entreprise */}
            {userData?.company && (
              <div className="flex flex-col items-center gap-2 mt-4 p-4 bg-gray-50 rounded-xl w-full">
                <div className="flex items-center gap-3">
                  {userData?.companyLogo ? (
                <img
                  src={userData.companyLogo}
                  alt="Logo société"
                      className="w-16 h-16 rounded-lg bg-white border shadow p-1"
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-2xl">{userData.company.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-700 text-lg">{userData.company}</span>
                    {userData?.matriculeFiscale && (
                      <span className="text-sm text-gray-500">MF: {userData.matriculeFiscale}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Informations utilisateur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Téléphone:</span>
                <span>{userData?.phone || <span className="text-gray-400">Non renseigné</span>}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">WhatsApp:</span>
                <span>{userData?.whatsapp || <span className="text-gray-400">Non renseigné</span>}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Rôle:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{userData?.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Adresse:</span>
                <span>{userData?.address || <span className="text-gray-400">Non renseignée</span>}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Site Web:</span>
                <a href={userData?.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {userData?.website || <span className="text-gray-400">Non renseigné</span>}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Réseaux Sociaux:</span>
                <span>{userData?.socialMedia || <span className="text-gray-400">Non renseignés</span>}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Bio:</span>
                <span className="text-gray-600">{userData?.bio || <span className="text-gray-400">Non renseignée</span>}</span>
              </div>
            </div>
          </div>

          {/* Dates de création et de modification */}
          <div className="mt-4 text-sm text-gray-500 flex justify-between">
            <span>Créé le: {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('fr-FR') : '-'}</span>
            <span>Modifié le: {userData?.updatedAt ? new Date(userData.updatedAt).toLocaleDateString('fr-FR') : '-'}</span>
          </div>
        </>
      )}

      {/* Fenêtre de modification */}
      {showEdit && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen py-4 backdrop-blur-sm bg-black/40" onClick={() => setShowEdit(false)}>
          <div
            className="bg-white rounded-3xl shadow-2xl shadow-inner w-full max-w-md mx-2 p-0 relative animate-fade-in max-h-[90vh] overflow-y-auto border border-gray-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="rounded-t-3xl bg-gradient-to-r from-blue-100 via-blue-50 to-yellow-50 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2"><FaEdit /> Modifier le profil</h2>
              <button
                onClick={() => setShowEdit(false)}
                className="bg-red-100 text-red-600 hover:bg-red-200 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold shadow focus:outline-none z-10"
                aria-label="Fermer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Image de profil */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-24 h-24">
                  <img
                    src={imagePreview || "/default-avatar.png"}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-full border-2 border-blue-200"
                  />
                  <label htmlFor="profileImageInput" className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer shadow hover:bg-blue-700 transition">
                    <FaEdit size={16} />
                      <input id="profileImageInput" type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                    </label>
                </div>
                <span className="text-sm text-gray-500">Photo de profil</span>
              </div>

              {/* Logo de l'entreprise */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-24 h-24 bg-white rounded-lg border-2 border-blue-200 flex items-center justify-center">
                  {form.companyLogo ? (
                    <img
                      src={form.companyLogo}
                      alt="Logo société"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-gray-400 text-2xl">{form.company?.charAt(0) || '?'}</span>
                    )}
                  <label htmlFor="companyLogoInput" className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer shadow hover:bg-blue-700 transition">
                    <FaEdit size={16} />
                      <input id="companyLogoInput" type="file" accept="image/*" onChange={handleCompanyLogoChange} className="hidden" />
                    </label>
                </div>
                <span className="text-sm text-gray-500">Logo de la société</span>
              </div>

              {/* Champs du formulaire */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Nom</label>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input name="email" value={form.email} disabled className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500" type="email" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Téléphone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" type="tel" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bio</label>
                  <textarea name="bio" value={form.bio} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Rôle</label>
                  <input name="role" value={form.role} disabled className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Société</label>
                  <input name="company" value={form.company} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Adresse</label>
                  <input name="address" value={form.address} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Matricule Fiscale</label>
                  <input name="matriculeFiscale" value={form.matriculeFiscale} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Site Web</label>
                  <input name="website" value={form.website} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Réseaux Sociaux</label>
                  <input name="socialMedia" value={form.socialMedia} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              {/* Bouton de sauvegarde */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <FaSave />
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </form>
          </div>
        </div>
      )}
    </div>
  );
} 