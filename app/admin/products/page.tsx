'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiEdit2, FiTrash2, FiPlus, FiX, FiEye, FiFilter, FiImage, FiUpload } from 'react-icons/fi'
import React from 'react'
import TiptapEditor from '@/components/TiptapEditor'
import { toast } from 'react-hot-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'


interface Product {
  _id: string
  name: string
  description: string
  price: number
  category: {
    _id: string
    name: string
  }
  stock: number
  images: string[]
  createdAt: string
  ficheTechnique?: {
    _id: string
    title: string
  }
  variants?: Array<{
    options: Array<{
      attributeId?: string
      attribute?: string
      value?: string
    }>
    stock?: number
    price?: number
    numSales?: number
  }>
  attributes?: Array<{
    attribute?: {
      _id: string
      name?: string
    }
    value: string
  }>
  numSales?: number
  countInStock?: number
  isPublished?: boolean
  brand?: string
  listPrice?: number
  avgRating?: number
  numReviews?: number
  ratingDistribution?: { rating: number; count: number }[]
  reviews?: any[]
  updatedAt?: Date
}

interface Filters {
  category: string
  minPrice: string
  maxPrice: string
  minStock: string
  maxStock: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    category: '',
    minPrice: '',
    maxPrice: '',
    minStock: '',
    maxStock: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([])
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState({ 
    name: '', 
    price: '', 
    category: '', 
    stock: '', 
    description: '',
    variants: [] as any[],
    ficheTechnique: ''
  })
  const [editLoading, setEditLoading] = useState(false)
  const [lowStockModalOpen, setLowStockModalOpen] = useState(false)
  const [catalogues, setCatalogues] = useState<{ _id: string; title: string }[]>([])

  // Helper to get attribute name (moved here for clearer scope)
  const getAttributeName = (id: string, product: any) => {
    const attribute = product.attributes?.find((attr: any) =>
      (attr.attribute && typeof attr.attribute === 'object' && attr.attribute._id === id) ||
      attr.attribute === id
    );
    return attribute ? (attribute.attribute && typeof attribute.attribute === 'object' && 'name' in attribute.attribute ? attribute.attribute.name : attribute.attribute) : id;
  };

  // New states for image management
  const [baseImages, setBaseImages] = useState<string[]>([]); // Current product images
  const [newImages, setNewImages] = useState<File[]>([]); // Newly uploaded image files
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]); // URLs of images to delete

  const formatPriceDisplay = (price: number) => {
    const [int, decimal] = price.toFixed(3).split('.');
    return (
      <span className="whitespace-nowrap">
        <span className="text-base font-medium">{int}</span>
        {decimal && <span className="text-xs align-super">{decimal}</span>}
        <span className="text-base font-medium ml-1">DT</span>
      </span>
    );
  };

  useEffect(() => {
    fetchCategories()
    fetchCatalogues()
    fetchProducts()
  }, [page, filters])

  const fetchCategories = async () => {
    let retries = 3;
    while (retries > 0) {
      try {
        console.log('Fetching categories...')
        const res = await fetch('/api/categories', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('Categories response status:', res.status)
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          console.error('Categories API error:', errorData)
          throw new Error(errorData.error || `Failed to fetch categories (${res.status})`)
        }

        const data = await res.json()
        console.log('Categories fetched:', data)
        
        if (!Array.isArray(data)) {
          console.error('Invalid categories data:', data)
          throw new Error('Invalid categories data received')
        }

        setCategories(data)
        return
      } catch (error) {
        console.error(`Error fetching categories (attempt ${4 - retries}/3):`, error)
        retries--
        if (retries === 0) {
          toast.error('Failed to load categories. Please refresh the page.')
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retrying
        }
      }
    }
  }

  const fetchCatalogues = async () => {
    try {
      const res = await fetch('/api/catalogues')
      if (!res.ok) {
        throw new Error('Failed to fetch catalogues')
      }
      const data = await res.json()
      setCatalogues(data)
    } catch (error) {
      console.error('Error fetching catalogues:', error)
      toast.error('Failed to load catalogues')
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.minStock && { minStock: filters.minStock }),
        ...(filters.maxStock && { maxStock: filters.maxStock }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      })
      
      const res = await fetch(`/api/products?${queryParams}`)
      const data = await res.json()
      setProducts(data.data)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Échec du chargement des produits')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const resetFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      minStock: '',
      maxStock: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Produit supprimé avec succès')
        fetchProducts()
      } else {
        toast.error('Échec de la suppression du produit')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Échec de la suppression du produit')
    }
  }

  const openEditModal = (product: Product) => {
    console.log('openEditModal - Product received:', JSON.parse(JSON.stringify(product)));
    setProductToEdit(product)
    setEditForm({
      name: product.name,
      price: String(product.price ?? ''),
      category: categories.find(c => c.name === product.category?.name)?._id || '',
      stock: String(product.stock ?? ''),
      description: product.description && product.description.trim().startsWith('<')
        ? product.description
        : `<p>${product.description || ''}</p>`,
      variants: product.variants || [],
      ficheTechnique: product.ficheTechnique?._id || ''
    })
    setBaseImages(product.images || [])
    setNewImages([])
    setImagesToDelete([])
    setEditModalOpen(true)
  }

  const handleEditChange = (field: string, value: string | number, variantIndex?: number) => {
    console.log('handleEditChange called:', { field, value, variantIndex })
    
    if (variantIndex !== undefined && field === 'variantStock') {
      setEditForm(prev => {
        const newVariants = [...prev.variants]
        newVariants[variantIndex] = {
          ...newVariants[variantIndex],
          stock: Number(value) || 0
        }
        console.log('Updated variants:', newVariants)
        return {
          ...prev,
          variants: newVariants
        }
      })
    } else {
      setEditForm(prev => {
        const newForm = { ...prev, [field]: value }
        console.log('Updated form:', newForm)
        return newForm
      })
    }
  }

  const handleEditSave = async () => {
    console.log('handleEditSave called')
    if (!productToEdit) {
      console.log('No product to edit')
      return
    }

    setEditLoading(true)
    try {
      console.log('Current form data:', editForm)
      console.log('Original product:', productToEdit)

      // 1. Upload new images
      const uploadedNewImageUrls: string[] = [];
      if (newImages.length > 0) {
        for (const file of newImages) {
          const url = await uploadImageToCloudinary(file);
          uploadedNewImageUrls.push(url);
        }
      }

      // 2. Filter out images to delete from existing baseImages
      const finalExistingImages = baseImages.filter(img => !imagesToDelete.includes(img));

      // 3. Combine final existing images with newly uploaded images
      const finalImages = [...finalExistingImages, ...uploadedNewImageUrls];
      
      // Prepare data with only changed fields
      const updatedData: any = {
        name: editForm.name,
        price: parseFloat(editForm.price),
        category: editForm.category,
        stock: parseInt(editForm.stock), // Assuming main stock
        description: editForm.description,
        variants: editForm.variants,
        images: finalImages, // Add the updated images array
        ficheTechnique: editForm.ficheTechnique || null // Add fiche technique
      }

      console.log('Images sent to backend:', updatedData.images);

      const res = await fetch(`/api/products/${productToEdit._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      })

      if (res.ok) {
        toast.success('Produit mis à jour avec succès!')
        setEditModalOpen(false)
        fetchProducts() // Refresh the product list
      } else {
        const errorData = await res.json()
        toast.error(errorData.message || 'Échec de la mise à jour du produit')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Échec de la mise à jour du produit')
    } finally {
      setEditLoading(false)
    }
  }

  // --- قسم المنتجات المميزة (منطق الستوك الذكي) ---
  function getLowStockVariants(product: Product) {
    if (product.variants && product.variants.length > 0) {
      // أرجع كل الفاريونتات التي ستوكها أقل من 5
      return product.variants
        .filter(v => typeof v.stock === 'number' && v.stock < 5)
        .map(v => ({
          variant: v,
          attributes: v.options?.map(opt => opt.value).filter(Boolean).join(' / ') || '',
          stock: v.stock ?? 0
        }))
    } else if (typeof product.stock === 'number' && product.stock < 5) {
      // منتج بدون فاريونت وستوكه أقل من 5
      return [{ variant: null, attributes: '', stock: product.stock }]
    }
    return []
  }
  const lowStockList = (Array.isArray(products) ? products : []).flatMap(p => getLowStockVariants(p).map(v => ({ product: p, ...v })));

  // --- قسم المنتجات المميزة ---
  const bestSellers = [...(Array.isArray(products) ? products : [])].sort((a, b) => {
    const aVariantSales = a.variants?.reduce((sum, v) => sum + (v.numSales || 0), 0) || 0;
    const bVariantSales = b.variants?.reduce((sum, v) => sum + (v.numSales || 0), 0) || 0;
    return bVariantSales - aVariantSales || (b.numSales || 0) - (a.numSales || 0);
  }).slice(0, 5);
  const zeroSales = (Array.isArray(products) ? products : []).filter(p => {
    const variantSales = p.variants?.reduce((sum, v) => sum + (v.numSales || 0), 0) || 0;
    return variantSales === 0 && (p.numSales || 0) === 0;
  });

  // Helper to upload images to Cloudinary (copied from create/page.tsx)
  const uploadImageToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ecommerce-app'); // Make sure this preset is correct
    const res = await fetch('https://api.cloudinary.com/v1_1/dwio60ll1/image/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  // Handler for adding new base images
  const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  // Handler for deleting existing base images
  const handleBaseImageDelete = (imageUrl: string) => {
    setImagesToDelete(prev => [...prev, imageUrl]);
    setBaseImages(prev => prev.filter(img => img !== imageUrl));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-400"></div>
        <span className="ml-3 text-lg">Chargement en cours...</span>
      </div>
    );
  }
  if (products.length === 0) {
    return <div className="text-center text-gray-500">Aucun produit disponible</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100 dark:bg-gray-950 min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-primary dark:text-yellow-400">Gestion des produits</h1>
      {/* قسم المنتجات */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* المنتجات التي قربت تخلص */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 flex flex-col items-center border-l-4 border-yellow-400">
          <div className="text-3xl mb-2">🕵️‍♂️</div>
          <div className="font-bold text-lg mb-1">Produits presque épuisés</div>
          <div className="text-sm text-gray-500 mb-2">Stock &lt; 5</div>
          <ul className="text-sm text-gray-700 dark:text-gray-200 max-h-32 overflow-y-auto w-full">
            {lowStockList.length === 0 ? <li>Aucun produit</li> : lowStockList.slice(0, 5).map((item, i) => (
              <li key={item.product._id + '-' + i}>
                {item.product.name}
                {item.attributes && <span className="ml-1 text-xs text-gray-500">[{item.attributes}]</span>}
                <span className="text-xs text-red-500 ml-2">({item.stock})</span>
              </li>
            ))}
          </ul>
          {lowStockList.length > 5 && (
            <button onClick={() => setLowStockModalOpen(true)} className="mt-2 text-blue-600 hover:underline text-sm font-semibold">Voir tout</button>
          )}
        </div>
        {/* الأكثر مبيعًا */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 flex flex-col items-center border-l-4 border-orange-500">
          <div className="text-3xl mb-2">🔥</div>
          <div className="font-bold text-lg mb-1">Meilleures ventes</div>
          <div className="text-sm text-gray-500 mb-2">Top 5</div>
          <ul className="text-sm text-gray-700 dark:text-gray-200 max-h-32 overflow-y-auto w-full">
            {bestSellers.length === 0 ? (
              <li>Aucun produit</li>
            ) : (
              bestSellers.map(p => (
                <li key={p._id}>
                  {p.name}
                  {p.variants && p.variants.filter(v => !!v.numSales && v.numSales > 0).length > 0 ? (
                    p.variants
                      .filter(v => !!v.numSales && v.numSales > 0)
                      .map((v, i) => (
                        <div key={i} className="ml-1 text-xs text-orange-500">
                          ({v.options.map(opt => opt.value).join(' / ')}: {v.numSales})
                        </div>
                      ))
                  ) : (
                    <div className="ml-1 text-xs text-orange-500">
                      ({p.numSales ?? 0})
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
        {/* الأقل تفاعلاً */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 flex flex-col items-center border-l-4 border-blue-500">
          <div className="text-3xl mb-2">📉</div>
          <div className="font-bold text-lg mb-1">Produits sans ventes</div>
          <div className="text-sm text-gray-500 mb-2">Zero sales</div>
          <ul className="text-sm text-gray-700 dark:text-gray-200 max-h-32 overflow-y-auto w-full">
            {zeroSales.length === 0 ? <li>Aucun produit</li> : zeroSales.map(p => <li key={p._id}>{p.name}</li>)}
          </ul>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion des Produits</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-4 px-2 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow hover:bg-blue-50 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 text-sm font-semibold transition cursor-pointer"
          >
            <FiFilter className="w-4 h-4" />
            Filtres
          </button>
          <button
            onClick={() => router.push('/admin/products/create')}
            className="bg-blue-600 text-white px-5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm"
          >
            <FiPlus className="w-4 h-4" /> Ajouter un Produit
          </button>
        </div>
      </div>

      {/* Filters Modal/Panel */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-2 p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setFiltersOpen(false)}
              className="absolute top-3 right-3 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 text-2xl font-bold focus:outline-none"
              aria-label="Fermer"
            >
              &times;
            </button>
            {/* Filters Panel Content */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filtres</h2>
                <button
                  onClick={resetFilters}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                >
                  <FiX /> Réinitialiser
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Toutes les Catégories</option>
                    {(Array.isArray(categories) ? categories : []).map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Prix Min (DT)
                  </label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Prix Max (DT)
                  </label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Stock Min
                  </label>
                  <input
                    type="number"
                    value={filters.minStock}
                    onChange={(e) => handleFilterChange('minStock', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Stock Max
                  </label>
                  <input
                    type="number"
                    value={filters.maxStock}
                    onChange={(e) => handleFilterChange('maxStock', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Trier par
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="createdAt">Date de création</option>
                    <option value="price">Prix</option>
                    <option value="name">Nom</option>
                    <option value="stock">Stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Ordre
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="desc">Décroissant</option>
                    <option value="asc">Croissant</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-lg">Chargement en cours...</span>
          </div>
        ) : (
          <>
            {/* Table for medium and up */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {(Array.isArray(products) ? products : []).map((product) => (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-2 md:px-4 py-3 align-top">
                        <div className="flex items-center">
                          {product.images[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover mr-3 flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {product.name.split(' ').slice(0, 3).join(' ')}
                              {product.name.split(' ').length > 3 ? '...' : ''}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {product.description.substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 md:px-4 py-3 align-top">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {product.category?.name}
                        </div>
                      </td>
                      <td className="px-2 md:px-4 py-3 align-top">
                        <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {formatPriceDisplay(product.price)}
                        </div>
                      </td>
                      <td className="px-2 md:px-4 py-3 align-top">
                        <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {product.stock}
                        </div>
                      </td>
                      <td className="px-2 md:px-4 py-3 align-top">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(product)
                              setModalOpen(true)
                              console.log('Modal should open', product)
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                            title="Afficher les détails"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(product)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                            title="Modifier"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                            title="Supprimer"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Cards for mobile */}
            <div className="sm:hidden space-y-4">
              {(Array.isArray(products) ? products : []).map((product, idx) => (
                <React.Fragment key={product._id}>
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      {product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {product.name.split(' ').slice(0, 3).join(' ')}
                          {product.name.split(' ').length > 3 ? '...' : ''}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {product.description.substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Catégorie</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{product.category?.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Prix</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{formatPriceDisplay(product.price)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Stock</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{product.stock}</div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => {
                            setSelectedProduct(product)
                            setModalOpen(true)
                            console.log('Modal should open', product)
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                          title="Afficher les détails"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                          title="Modifier"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                          title="Supprimer"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {idx !== products.length - 1 && (
                    <div className="w-full h-3 flex items-center justify-center">
                      <div className="w-11/12 h-1 bg-gray-200 dark:bg-gray-800 rounded shadow-sm"></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="px-4 py-2">
            Page {page} sur {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedProduct && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-2 p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 text-2xl font-bold focus:outline-none"
              aria-label="Fermer"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{selectedProduct.name}</h2>
            
            {/* Product Images */}
            {selectedProduct.images && selectedProduct.images.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedProduct.images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img
                        src={image}
                        alt={`${selectedProduct.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Informations générales</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Catégorie:</span>
                    <p className="text-gray-900 dark:text-gray-100">{selectedProduct.category?.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Prix:</span>
                    <p className="text-gray-900 dark:text-gray-100">{formatPriceDisplay(selectedProduct.price)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock:</span>
                    <p className="text-gray-900 dark:text-gray-100">{selectedProduct.stock}</p>
                  </div>
                  {selectedProduct.ficheTechnique && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Fiche Technique:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedProduct.ficheTechnique.title}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Variants */}
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Variantes</h3>
                  <div className="space-y-3">
                    {selectedProduct.variants.map((variant, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-2">
                        <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {variant.options && Array.isArray(variant.options)
                            ? variant.options.map((opt: any) => {
                                console.log('Variant Option - opt:', JSON.parse(JSON.stringify(opt)));
                                console.log('productToEdit.attributes:', JSON.parse(JSON.stringify(productToEdit?.attributes)));
                                // opt.attributeId يجب أن يكون كائنًا مأهولًا { _id, name }
                                // opt.value هو ID مثل '683c072cdc9ff7fcbac25386'

                                const attributeName = opt.attributeId?.name; // مثلاً 'Color', 'Seau'
                                let displayValue = opt.value; // القيمة الافتراضية هي الـ ID

                                // البحث عن القيمة الوصفية في productToEdit.attributes باستخدام opt.value كـ _id
                                const matchingAttributeValueEntry = productToEdit?.attributes?.find(
                                  (attrItem: any) =>
                                    attrItem.value === opt.value && // Match the attribute value entry by its value (the descriptive string)
                                    attrItem.attribute &&
                                    attrItem.attribute._id === opt.attributeId?._id // Match attribute type
                                );

                                if (matchingAttributeValueEntry) {
                                  // إذا تم العثور على إدخال مطابق، استخدم قيمته الوصفية 'value'
                                  displayValue = matchingAttributeValueEntry.value;
                                }

                                return attributeName ? `${attributeName}: ${displayValue}` : displayValue;
                              }).filter(Boolean).join(' / ')
                            : ''}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600 dark:text-gray-400">Stock:</label>
                          <input
                            type="number"
                            className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={variant.stock ?? 0}
                            onChange={e => handleEditChange('variantStock', e.target.value, index)}
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Description</h3>
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
              />
            </div>
          </div>
        </div>
      )}

      {/* نافذة منبثقة لكل المنتجات التي ستوكها أقل من 5 */}
      {lowStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
            <button onClick={() => setLowStockModalOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold">&times;</button>
            <h2 className="text-xl font-bold mb-4 text-yellow-500 text-center">Tous les produits presque épuisés</h2>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-3 py-2 text-left">Produit</th>
                  <th className="px-3 py-2 text-left">Attributs</th>
                  <th className="px-3 py-2 text-center">Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStockList.map((item, i) => (
                  <tr key={item.product._id + '-' + i} className="border-b border-gray-200 dark:border-gray-800">
                    <td className="px-3 py-2">{item.product.name}</td>
                    <td className="px-3 py-2">{item.attributes || '-'}</td>
                    <td className="px-3 py-2 text-center text-red-600 font-bold">{item.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => {
            setEditModalOpen(false);
            setNewImages([]); // Clear new images on close
            setImagesToDelete([]); // Clear images to delete on close
          }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-2 p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setEditModalOpen(false);
                setNewImages([]); // Clear new images on close
                setImagesToDelete([]); // Clear images to delete on close
              }}
              className="absolute top-3 right-3 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 text-2xl font-bold focus:outline-none"
              aria-label="Fermer"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Modifier le Produit</h2>
            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nom du produit</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editForm.name}
                  onChange={e => handleEditChange('name', e.target.value)}
                  placeholder="Nom du produit"
                />
              </div>

              {/* General Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Prix</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editForm.price}
                    onChange={e => handleEditChange('price', e.target.value)}
                    placeholder="Prix"
                    step="0.01"
                    min="0"
                  />
                </div>
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Catégorie</label>
                  <select
                    value={editForm.category}
                    onChange={e => handleEditChange('category', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {(Array.isArray(categories) ? categories : []).map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                {/* Fiche Technique */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Fiche Technique</label>
                  <select
                    value={editForm.ficheTechnique}
                    onChange={e => handleEditChange('ficheTechnique', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner une fiche technique</option>
                    {(Array.isArray(catalogues) ? catalogues : []).map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock Management */}
              {editForm.variants && editForm.variants.length > 0 ? (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Stock des variantes</h3>
                  {editForm.variants.map((variant, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-2">
                      <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {variant.options && Array.isArray(variant.options)
                          ? variant.options.map((opt: any) => {
                              console.log('Variant Option - opt:', JSON.parse(JSON.stringify(opt)));
                              console.log('productToEdit.attributes:', JSON.parse(JSON.stringify(productToEdit?.attributes)));
                              // opt.attributeId يجب أن يكون كائنًا مأهولًا { _id, name }
                              // opt.value هو ID مثل '683c072cdc9ff7fcbac25386'

                              const attributeName = opt.attributeId?.name; // مثلاً 'Color', 'Seau'
                              let displayValue = opt.value; // القيمة الافتراضية هي الـ ID

                              // البحث عن القيمة الوصفية في productToEdit.attributes باستخدام opt.value كـ _id
                              const matchingAttributeValueEntry = productToEdit?.attributes?.find(
                                (attrItem: any) =>
                                  attrItem.value === opt.value && // Match the attribute value entry by its value (the descriptive string)
                                  attrItem.attribute &&
                                  attrItem.attribute._id === opt.attributeId?._id // Match attribute type
                              );

                              if (matchingAttributeValueEntry) {
                                // إذا تم العثور على إدخال مطابق، استخدم قيمته الوصفية 'value'
                                displayValue = matchingAttributeValueEntry.value;
                              }

                              return attributeName ? `${attributeName}: ${displayValue}` : displayValue;
                            }).filter(Boolean).join(' / ')
                          : ''}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Stock:</label>
                        <input
                          type="number"
                          className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={variant.stock ?? 0}
                          onChange={e => handleEditChange('variantStock', e.target.value, index)}
                          min="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Stock principal</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editForm.stock}
                    onChange={e => handleEditChange('stock', e.target.value)}
                    placeholder="Stock"
                    min="0"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description du produit</label>
                <TiptapEditor
                  key={editForm.description}
                  content={editForm.description}
                  onChange={value => {
                    console.log('Tiptap onChange:', value)
                    handleEditChange('description', value)
                  }}
                />
              </div>

              {/* Image Section - New */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiImage className="text-blue-500" />
                  <h2 className="text-xl font-semibold">Images du produit</h2>
                </div>

                {/* Existing Images */}
                {baseImages.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Images actuelles:</label>
                    <div className="flex flex-wrap gap-2">
                      {baseImages.map((imageUrl, index) => (
                        <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                          <img src={imageUrl} alt={`Product Image ${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleBaseImageDelete(imageUrl)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600 transition-colors"
                            title="Supprimer cette image"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Ajouter de nouvelles images:</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBaseImageUpload}
                    className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                  />
                </div>

                {/* Preview New Images */}
                {newImages.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Nouvelles images à télécharger:</label>
                    <div className="flex flex-wrap gap-2">
                      {newImages.map((file, index) => (
                        <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                          <img src={URL.createObjectURL(file)} alt={`New Image ${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewImages(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600 transition-colors"
                            title="Annuler le téléchargement de cette image"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleEditSave}
              disabled={editLoading}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-60"
            >
              {editLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}