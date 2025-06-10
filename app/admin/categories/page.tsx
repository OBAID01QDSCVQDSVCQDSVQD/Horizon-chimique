"use client";
import React, { useEffect, useState, useRef } from "react";
import { FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';

interface Category {
  _id: string;
  name: string;
  description?: string;
  productsCount?: number;
  image?: string;
}

// ترجمات فرنسية
const FR = {
  title: 'Gestion des catégories',
  add: 'Ajouter une catégorie',
  edit: 'Modifier',
  delete: 'Supprimer',
  name: 'Nom de la catégorie',
  nameRequired: 'Le nom de la catégorie est requis',
  description: 'Description',
  productsCount: 'Nombre de produits',
  actions: 'Actions',
  noCategories: 'Aucune catégorie trouvée',
  loading: 'Chargement...',
  error: 'Échec du chargement des catégories',
  save: 'Enregistrer',
  update: 'Mettre à jour',
  cancel: 'Annuler',
  confirmDelete: 'Confirmation de la suppression',
  confirmDeleteMsg: 'Êtes-vous sûr de vouloir supprimer la catégorie',
  confirmDeleteWarn: 'Cette action est irréversible.',
  yesDelete: 'Oui, supprimer',
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '', image: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [viewCategory, setViewCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories/list");
      if (!res.ok) {
        let errorMsg = 'Unknown error';
        try {
          const err = await res.json();
          errorMsg = err.error || err.message || errorMsg;
        } catch {
          // إذا لم يكن هناك JSON
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل في جلب التصنيفات";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const uploadImageToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ecommerce-app');
    const res = await fetch('https://api.cloudinary.com/v1_1/dwio60ll1/image/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImageToCloudinary(file);
    setForm((prev) => ({ ...prev, image: url }));
  };

  const openAddModal = () => {
    setEditCategory(null);
    setForm({ name: '', description: '', image: '' });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditCategory(cat);
    setForm({ name: cat.name, description: cat.description || '', image: cat.image || '' });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('اسم التصنيف مطلوب');
      return;
    }
    setFormError(null);
    try {
      let res;
      if (editCategory) {
        res = await fetch(`/api/categories/${editCategory._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch('/api/categories/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      if (!res.ok) throw new Error('فشل في حفظ التصنيف');
      closeModal();
      fetchCategories();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'فشل في حفظ التصنيف');
    }
  };

  const openDeleteModal = (cat: Category) => {
    setDeleteCategory(cat);
    setDeleteError(null);
  };

  const closeDeleteModal = () => setDeleteCategory(null);

  const handleDelete = async () => {
    if (!deleteCategory) return;
    setDeleteError(null);
    try {
      const res = await fetch(`/api/categories/${deleteCategory._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل في حذف التصنيف');
      closeDeleteModal();
      fetchCategories();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'فشل في حذف التصنيف');
    }
  };

  const openViewModal = (cat: Category) => setViewCategory(cat);
  const closeViewModal = () => setViewCategory(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 text-primary dark:text-yellow-400">{FR.title}</h1>
      <div className="flex justify-end mb-4">
        <button onClick={openAddModal} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full font-semibold hover:bg-primary/90 transition shadow">
          <span className="text-xl">+</span>
          {FR.add}
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3">Chargement en cours...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Aucune catégorie disponible</div>
      ) : error ? (
        <div className="text-center text-red-600 font-bold py-8">{error}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-32">Image</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{FR.name}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{FR.description}</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{FR.productsCount}</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{FR.actions}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-blue-50 dark:hover:bg-blue-900 transition">
                  <td className="px-4 py-3 text-center align-middle">
                    {cat.image ? (
                      <div className="relative group flex flex-col items-center justify-center">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-14 h-14 object-cover rounded-full shadow border border-gray-200 dark:border-gray-700 mx-auto"
                        />
                        <div className="absolute z-20 left-1/2 -translate-x-1/2 top-16 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-pre-line max-w-xs break-all transition-all duration-200 shadow-lg">
                          {cat.image}
                          <button
                            className="ml-2 text-blue-300 hover:text-blue-500 text-xs underline"
                            onClick={() => {navigator.clipboard.writeText(cat.image || '')}}
                            type="button"
                            tabIndex={-1}
                          >Copier</button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-14 h-14 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400 text-xs mx-auto">No Image</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 align-middle">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 align-middle">{cat.description || '-'}</td>
                  <td className="px-4 py-3 text-center text-blue-700 dark:text-blue-400 font-bold align-middle">{cat.productsCount ?? '-'}</td>
                  <td className="px-4 py-3 flex gap-2 justify-center align-middle">
                    <button title="Voir" className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 p-2 rounded-full transition" onClick={() => openViewModal(cat)}>
                      <FiEye size={18} />
                    </button>
                    <button title="Modifier" className="text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900 p-2 rounded-full transition" onClick={() => openEditModal(cat)}>
                      <FiEdit2 size={18} />
                    </button>
                    <button title="Supprimer" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900 p-2 rounded-full transition" onClick={() => openDeleteModal(cat)}>
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">{FR.noCategories}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-2 p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto flex flex-col items-center">
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none" aria-label="Fermer">&times;</button>
            <h2 className="text-2xl font-bold mb-4 text-yellow-500 text-center tracking-tight">{editCategory ? FR.edit : FR.add}</h2>
            <form onSubmit={handleFormSubmit} className="w-full flex flex-col items-center gap-4">
              {/* Image Preview */}
              <div className="flex flex-col items-center w-full">
                <div className="relative group mb-2">
                  {form.image && (
                    <img
                      src={form.image || editCategory?.image || '/placeholder.jpg'}
                      alt="cat-img"
                      className="w-28 h-28 object-cover rounded-xl shadow border-2 border-gray-200 dark:border-gray-700 mx-auto transition-all duration-200 hover:scale-105"
                    />
                  )}
                </div>
              </div>
              {/* Upload Button */}
              <label className="w-full flex flex-col items-center cursor-pointer">
                <span className="block font-semibold mb-1 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
                  Image
                </span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <span className="text-xs text-gray-400 mt-1">Choisir une image (optionnel)</span>
              </label>
              {/* Name Field */}
              <div className="w-full">
                <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200">{FR.name} <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={form.name} onChange={handleFormChange} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" required />
              </div>
              {/* Description Field */}
              <div className="w-full">
                <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-200">{FR.description}</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" rows={3} />
              </div>
              {formError && <div className="text-red-600 text-sm text-center w-full">{formError === 'اسم التصنيف مطلوب' ? FR.nameRequired : formError}</div>}
              <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-lg transition mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {editCategory ? FR.update : FR.save}
              </button>
            </form>
          </div>
        </div>
      )}
      {deleteCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 w-full max-w-md relative animate-fade-in">
            <button onClick={closeDeleteModal} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold">&times;</button>
            <h2 className="text-xl font-bold mb-6 text-center text-red-600">{FR.confirmDelete}</h2>
            <p className="text-center mb-6">{FR.confirmDeleteMsg} <span className="font-bold">{deleteCategory.name}</span> ? <br /> <span className="text-red-500">{FR.confirmDeleteWarn}</span></p>
            {deleteError && <div className="text-red-600 text-sm text-center mb-4">{deleteError}</div>}
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={handleDelete} className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition">{FR.yesDelete}</button>
              <button onClick={closeDeleteModal} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition">{FR.cancel}</button>
            </div>
          </div>
        </div>
      )}
      {viewCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-2 p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto flex flex-col items-center">
            <button onClick={closeViewModal} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none" aria-label="Fermer">&times;</button>
            <h2 className="text-2xl font-bold mb-4 text-blue-500 text-center tracking-tight">Détails de la catégorie</h2>
            <img src={viewCategory.image || '/placeholder.jpg'} alt={viewCategory.name} className="w-28 h-28 object-cover rounded-xl shadow border-2 border-gray-200 dark:border-gray-700 mx-auto mb-4" />
            <div className="w-full flex flex-col gap-2">
              <div><span className="font-semibold text-gray-700 dark:text-gray-200">Nom:</span> {viewCategory.name}</div>
              <div><span className="font-semibold text-gray-700 dark:text-gray-200">Description:</span> {viewCategory.description || '-'}</div>
              <div><span className="font-semibold text-gray-700 dark:text-gray-200">Nombre de produits:</span> {viewCategory.productsCount ?? '-'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 