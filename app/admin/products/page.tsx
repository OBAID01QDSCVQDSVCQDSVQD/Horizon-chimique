'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiEdit2, FiTrash2, FiPlus, FiX, FiEye, FiFilter, FiImage } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import React from 'react'
import TiptapEditor from '@/components/TiptapEditor'


interface Product {
  _id: string
  name: string
  description: string
  price: number
  category: {
    name: string
  }
  stock: number
  images: string[]
  createdAt: string
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
    }
    value: string
  }>
  numSales?: number
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
    variants: [] as any[]
  })
  const [editLoading, setEditLoading] = useState(false)
  const [lowStockModalOpen, setLowStockModalOpen] = useState(false)

  useEffect(() => {
    fetchCategories()
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
    setProductToEdit(product)
    setEditForm({
      name: product.name,
      price: String(product.price ?? ''),
      category: categories.find(c => c.name === product.category?.name)?._id || '',
      stock: String(product.stock ?? ''),
      description: product.description && product.description.trim().startsWith('<')
        ? product.description
        : `<p>${product.description || ''}</p>`,
      variants: product.variants || []
    })
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
      
      // Prepare data with only changed fields
      const updatedData: any = {
        name: editForm.name,
        price: parseFloat(editForm.price),
        category: editForm.category,
        description: editForm.description || ''
      }

      // Handle stock updates
      if (editForm.variants && editForm.variants.length > 0) {
        // For products with variants, update variant stocks
        console.log('Updating variants stock')
        updatedData.variants = editForm.variants.map((variant) => ({
          ...variant,
          stock: Number(variant.stock) || 0
        }))
        console.log('Updated variants:', updatedData.variants)
      } else {
        // For products without variants, update main stock
        console.log('Updating main stock')
        updatedData.stock = Number(editForm.stock) || 0
        console.log('Updated main stock:', updatedData.stock)
      }

      console.log('Final update data:', updatedData)

      const res = await fetch(`/api/products/${productToEdit._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })

      console.log('Response status:', res.status)
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Update failed:', errorData)
        throw new Error(errorData.error || 'Erreur lors de la modification')
      }

      const data = await res.json()
      console.log('Update successful:', data)

      // Update local state
      setProducts(prev =>
        prev.map(p =>
          p._id === productToEdit._id
            ? {
                ...data.product,
                category: categories.find(c => c._id === String(data.product.category)) || data.product.category
              }
            : p
        )
      )

      // Close modal and show success message
      setEditModalOpen(false)
      toast.success('Produit modifié avec succès')
      
    } catch (error) {
      console.error('Error in handleEditSave:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la modification')
    } finally {
      setEditLoading(false)
    }
  }

  // Helper function to get attribute name
  const getAttributeName = (id: string, product: any) => {
    if (!product.attributes) return id
    const found = product.attributes.find((a: any) => (a.attribute?._id || a.attribute) == id)
    return found ? found.value : id
  }

  // Modal component
  function ProductModal({ product, onClose }: { product: any, onClose: () => void }) {
    // Helper to check if product has variants with stock
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0 && product.variants.some((v: any) => v.stock !== undefined)

    // Helper to get attribute name by id
    const getAttributeName = (id: string) => {
      if (!product.attributes) return id
      const found = product.attributes.find((a: any) => (a.attribute?._id || a.attribute) == id)
      return found ? found.value : id
    }

    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen py-4 backdrop-blur-sm bg-black/30 pointer-events-auto"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-lg mx-2 p-4 sm:p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 text-2xl font-bold focus:outline-none"
            aria-label="Fermer"
          >
            &times;
          </button>
          <div className="flex flex-col items-center gap-4">
            <img
              src={product.images[0] || '/placeholder.jpg'}
              alt={product.name}
              className="w-40 h-40 object-contain rounded-lg border bg-white dark:bg-gray-800"
            />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{product.name}</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Catégorie: {product.category?.name || '-'}</div>
              
              {/* Price and Stock Display */}
              {!hasVariants ? (
                <>
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
                    Prix: {product.price.toFixed(2)} €
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Stock: {product.countInStock ?? product.stock ?? 0}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 text-left">
                  <div className="font-semibold mb-1">Variantes:</div>
                  <ul className="space-y-2">
                    {product.variants.map((variant: any, i: number) => (
                      <li key={i} className="border-b border-gray-200 dark:border-gray-800 pb-2 last:border-b-0">
                        <div className="flex flex-col gap-1">
                          <div className="font-medium">
                            {variant.options && Array.isArray(variant.options)
                              ? variant.options.map((opt: any) => getAttributeName(opt.attributeId || opt.attribute)).join(' / ')
                              : ''}
                          </div>
                          <div className="text-green-700 dark:text-green-300 font-bold">
                            Prix: {variant.price !== undefined ? variant.price.toFixed(2) : product.price.toFixed(2)} €
                          </div>
                          <div className="text-blue-700 dark:text-blue-300 font-bold">
                            Stock: {variant.stock ?? 0}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-sm text-gray-700 dark:text-gray-300 mb-2" dangerouslySetInnerHTML={{ __html: product.description }} />
              {product.images.length > 1 && (
                <div className="flex gap-2 mt-2 flex-wrap justify-center">
                  {product.images.slice(1).map((img: any, i: number) => (
                    <img key={i} src={img} alt="extra" className="w-14 h-14 object-contain rounded border bg-white dark:bg-gray-800" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
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
                    Prix Min (€)
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
                    Prix Max (€)
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
                          {product.price.toFixed(2)} €
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
                        <div className="text-sm text-gray-900 dark:text-gray-100">{product.price.toFixed(2)} €</div>
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
        <ProductModal product={selectedProduct} onClose={() => setModalOpen(false)} />
      )}

      {/* Edit Modal */}
      {editModalOpen && productToEdit && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen py-4 backdrop-blur-sm bg-black/40" onClick={() => setEditModalOpen(false)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-2 p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 text-2xl font-bold focus:outline-none"
              aria-label="Fermer"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Modifier le Produit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nom du produit</label>
                <input
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editForm.name}
                  onChange={e => handleEditChange('name', e.target.value)}
                  placeholder="Nom du produit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Prix principal</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editForm.price}
                  onChange={e => handleEditChange('price', e.target.value)}
                  placeholder="Prix (€)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Catégorie</label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editForm.category}
                  onChange={e => handleEditChange('category', e.target.value)}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Stock and Variants Section */}
              {editForm.variants && editForm.variants.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Stock des variantes</h3>
                  {editForm.variants.map((variant, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {variant.options && Array.isArray(variant.options)
                          ? variant.options.map((opt: any) => getAttributeName(opt.attributeId || opt.attribute, productToEdit)).join(' / ')
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
            </div>
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

    </div>
  )
}