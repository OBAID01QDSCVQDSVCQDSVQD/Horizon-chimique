'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiEdit2, FiTrash2, FiPlus, FiX, FiEye, FiFilter, FiImage, FiUpload, FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import React from 'react'
import TiptapEditor from '@/components/TiptapEditor'
import { toast } from 'react-hot-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'


interface Product {
  _id: string
  name: string
  slug: string
  description: string
  price: number
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
    image?: string
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
  categories?: { _id: string; name: string }[]
  tags?: string[]
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
  const [lowStockModalOpen, setLowStockModalOpen] = useState(false)
  const [catalogues, setCatalogues] = useState<{ _id: string; title: string }[]>([])
  const [bestSellers, setBestSellers] = useState<Product[]>([])
  const [attributes, setAttributes] = useState<any[]>([])

  // Helper to get attribute name (moved here for clearer scope)
  const getAttributeName = (id: string, product: any) => {
    // console.log("Type of attributes in getAttributeName:", typeof attributes, "Is Array:", Array.isArray(attributes));
    // Utiliser le state `attributes` global plutôt que `product.attributes`
    if (!Array.isArray(attributes)) {
      // console.error("Attributes is not an array when getAttributeName is called:", attributes);
      return id; // Fallback to ID if attributes is not an array
    }
    const attribute = attributes.find((attr: any) => attr._id === id);
    return attribute ? attribute.name : id;
  };

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
    fetchAttributes()
    fetchBestSellers()
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
          const errorData = await res.json().catch(() => ({}));
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
          toast.error('Échec du chargement des catégories. Veuillez rafraîchir la page.')
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
        throw new Error('Échec du chargement des catalogues')
      }
      const data = await res.json()
      setCatalogues(data)
    } catch (error) {
      console.error('Erreur lors du chargement des catalogues:', error)
      toast.error('Échec du chargement des catalogues')
    }
  }

  const fetchAttributes = async () => {
    try {
      // console.log("Fetching attributes...");
      const res = await fetch('/api/attributes/list');
      // console.log("Attributes API response status:", res.status);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // console.error("Attributes API error:", errorData);
        throw new Error(errorData.error || 'Échec du chargement des attributs');
      }
      let responseData = await res.json();
      // console.log("Raw data from attributes API:", responseData);

      // التحقق من هيكل البيانات والتأكد من أنها مصفوفة من data.data
      if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
        setAttributes(responseData.data); // استخدام responseData.data
      } else {
        console.error("Invalid attributes data format: Expected an object with 'data' array.", responseData);
        setAttributes([]); // تعيين مصفوفة فارغة لتجنب الأخطاء اللاحقة
      }
      
      // console.log("Attributes fetched successfully (formatted):");
      // console.log("Current attributes state after fetch:", responseData.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement de attributs:', error);
      toast.error('Échec du chargement des attributs.');
    }
  };

  const fetchBestSellers = async () => {
    try {
      const response = await fetch('/api/products?tag=best-seller&limit=5');
      if (!response.ok) {
        throw new Error('Échec du chargement des meilleures ventes');
      }
      const data = await response.json();
      setBestSellers(data);
    } catch (error) {
      console.error('Erreur lors du chargement des meilleures ventes:', error);
      toast.error('Échec du chargement des produits les plus vendus.');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products with filters:', filters);
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
      });
      const res = await fetch(`/api/products/admin?${queryParams.toString()}`);
      console.log('Products API response status:', res.status);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Products API error:', errorData);
        throw new Error(errorData.error || `Échec du chargement des produits (${res.status})`);
      }
      const data = await res.json();
      console.log('Products fetched:', data);

      if (data && typeof data === 'object' && 'products' in data && Array.isArray(data.products)) {
        setProducts(data.products);
        setTotalPages(data.totalPages || 1);
      } else {
        setProducts([]);
        setTotalPages(1);
        console.warn('Structure de réponse API inattendue pour les produits:', data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      toast.error('Échec du chargement des produits. Veuillez rafraîchir la page.');
    } finally {
      setLoading(false);
    }
  };

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

  function getLowStockVariants(product: Product) {
    // Implementation of getLowStockVariants function
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-400"></div>
        <span className="ml-3 text-lg">Chargement en cours...</span>
      </div>
    );
  }
  if (!Array.isArray(products) || products.length === 0) {
    return <div className="text-center text-gray-500">Aucun produit disponible</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-100 dark:bg-gray-950 min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-primary dark:text-yellow-400">Gestion des produits</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestion des Produits</h1>
        <div className="flex gap-4">
          <Button onClick={() => router.push('/admin/products/create')}>
            <FiPlus className="mr-2" /> Ajouter un nouveau produit
          </Button>
          <Button onClick={() => setFiltersOpen(!filtersOpen)} variant="outline">
            <FiFilter className="mr-2" /> Filtrer
          </Button>
        </div>
      </div>

      {filtersOpen && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3">Options de filtrage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Catégorie</label>
                  <select
                  id="categoryFilter"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 dark:text-gray-100"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                  <option value="">Toutes les catégories</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                <label htmlFor="minPriceFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Prix Min</label>
                <Input
                  id="minPriceFilter"
                    type="number"
                  placeholder="Prix minimum"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  />
                </div>
                <div>
                <label htmlFor="maxPriceFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Prix Max</label>
                <Input
                  id="maxPriceFilter"
                    type="number"
                  placeholder="Prix maximum"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                </div>
                <div>
                <label htmlFor="minStockFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Stock Min</label>
                <Input
                  id="minStockFilter"
                    type="number"
                  placeholder="Stock minimum"
                    value={filters.minStock}
                    onChange={(e) => handleFilterChange('minStock', e.target.value)}
                  />
                </div>
                <div>
                <label htmlFor="maxStockFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Stock Max</label>
                <Input
                  id="maxStockFilter"
                    type="number"
                  placeholder="Stock maximum"
                    value={filters.maxStock}
                    onChange={(e) => handleFilterChange('maxStock', e.target.value)}
                  />
                </div>
                <div>
                <label htmlFor="sortByFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Trier par</label>
                  <select
                  id="sortByFilter"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 dark:text-gray-100"
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="createdAt">Date de création</option>
                    <option value="name">Nom</option>
                  <option value="price">Prix</option>
                  <option value="countInStock">Stock</option>
                  <option value="numSales">Ventes</option>
                  </select>
                </div>
                <div>
                <label htmlFor="sortOrderFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Ordre de tri</label>
                  <select
                  id="sortOrderFilter"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 dark:text-gray-100"
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                  >
                    <option value="desc">Décroissant</option>
                    <option value="asc">Croissant</option>
                  </select>
                </div>
              </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={resetFilters} variant="outline">
                Réinitialiser les filtres
              </Button>
              <Button onClick={() => setFiltersOpen(false)}>
                Appliquer les filtres
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table for larger screens */}
            <div className="overflow-x-auto hidden sm:block">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Liste des Produits ({products.length})</h2>
        <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</TableHead>
              <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</TableHead>
              <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</TableHead>
              <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</TableHead>
              <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ventes</TableHead>
              <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
                  </tr>
                </thead>
          <tbody>
            {products.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Aucun produit trouvé.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className="py-3 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {product.images && product.images[0] && (
                        <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded-md" />
                          )}
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                              {product.name.split(' ').slice(0, 3).join(' ')}
                        {product.name.split(' ').length > 3 && '...'}
                            </div>
                            </div>
                  </TableCell>
                  <TableCell className="py-3 px-6 whitespace-nowrap text-gray-700 dark:text-gray-300">
                    {product.categories?.map((cat, index) => (
                      <span key={cat._id}>
                        {cat.name}
                        {index < (product.categories?.length || 0) - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell className="py-3 px-6 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {formatPriceDisplay(product.price)}
                  </TableCell>
                  <TableCell className="py-3 px-6 whitespace-nowrap text-gray-700 dark:text-gray-300">
                    {product.countInStock}
                  </TableCell>
                  <TableCell className="py-3 px-6 whitespace-nowrap text-gray-700 dark:text-gray-300">
                    {product.numSales ?? 0}
                  </TableCell>
                  <TableCell className="py-3 px-6 whitespace-nowrap">
                    <div className="flex gap-2 items-center">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedProduct(product)}>
                        <FiEye className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/products/edit/${product.slug}`)}
                        className="text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product._id)}>
                        <FiTrash2 className="w-4 h-4 text-red-500" />
                      </Button>
                        </div>
                  </TableCell>
                </TableRow>
              ))
            )}
                </tbody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Page {page} sur {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <FiArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Suivant
            <FiArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Modal for viewing product details */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-[800px] p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Détails du Produit</DialogTitle>
            <DialogDescription className="text-gray-500">Aperçu complet du produit.</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-1">Nom:</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedProduct.name}</p>
                    </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Catégories:</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedProduct.categories && selectedProduct.categories.length > 0 ? selectedProduct.categories.map(cat => cat.name).join(', ') : 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Prix:</h4>
                  <p className="text-gray-700 dark:text-gray-300">{formatPriceDisplay(selectedProduct.price)}</p>
                </div>
                {selectedProduct.listPrice !== undefined && selectedProduct.listPrice !== 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Prix affiché:</h4>
                    <p className="text-gray-700 dark:text-gray-300">{formatPriceDisplay(selectedProduct.listPrice)}</p>
              </div>
            )}
              <div>
                  <h4 className="font-semibold text-lg mb-1">Marque:</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedProduct.brand || 'N/A'}</p>
                </div>
                  <div>
                  <h4 className="font-semibold text-lg mb-1">Stock:</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedProduct.countInStock}</p>
                  </div>
                  <div>
                  <h4 className="font-semibold text-lg mb-1">Ventes:</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedProduct.numSales ?? 0}</p>
                  </div>
                  <div>
                  <h4 className="font-semibold text-lg mb-1">Publié:</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedProduct.isPublished ? 'Oui' : 'Non'}</p>
                  </div>
                  {selectedProduct.ficheTechnique && (
                    <div>
                    <h4 className="font-semibold text-lg mb-1">Fiche Technique:</h4>
                    <p className="text-gray-700 dark:text-gray-300">{selectedProduct.ficheTechnique.title}</p>
                    </div>
                  )}
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Tags:</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedProduct.tags.map((tag) => {
                        const translatedTag = {
                          'new-arrival': 'Nouvel arrivage',
                          'featured': 'En vedette',
                          'best-seller': 'Meilleure vente',
                          'todays-deal': 'Offre du jour',
                        }[tag] || tag;
                        return <span key={tag} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">{translatedTag}</span>;
                      })}
                    </p>
                </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-1">Description:</h4>
                  <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: selectedProduct.description }} />
                        </div>
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Images:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.images.map((img, index) => (
                        <img key={index} src={img} alt={`Produit ${index + 1}`} className="w-24 h-24 object-cover rounded-md border border-gray-200" />
                    ))}
                  </div>
                </div>
              )}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Variantes:</h4>
                    <ul className="space-y-2">
                      {selectedProduct.variants.map((variant, index) => (
                        <li key={index} className="border p-2 rounded-md bg-gray-50 dark:bg-gray-800">
                          <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                            Options: {variant.options.map((opt: any) => {
                              // console.log("Variant option:", opt);
                              const attributeName = getAttributeName(opt.attributeId || '', selectedProduct);
                              // console.log("Attribute Name for ID ", opt.attributeId, ":", attributeName);
                              return `${attributeName}: ${opt.value}`;
                            }).join(', ')}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">Prix: {variant.price ? formatPriceDisplay(variant.price) : 'N/A'}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">Stock: {variant.stock ?? 'N/A'}</p>
                          {variant.image && (
                            <img src={variant.image} alt="Variante" className="w-16 h-16 object-cover rounded-md mt-1" />
                          )}
                        </li>
                ))}
                    </ul>
                  </div>
                )}
          </div>
        </div>
      )}
          <DialogFooter className="mt-6">
            <Button onClick={() => setSelectedProduct(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Low Stock Products Modal */}
      <Dialog open={lowStockModalOpen} onOpenChange={setLowStockModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Produits à Faible Stock</DialogTitle>
            <DialogDescription className="text-gray-500">Liste des produits dont le stock est inférieur au seuil.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto">
            {bestSellers.filter(p => p.countInStock !== undefined && p.countInStock <= 5).length === 0 ? (
              <p className="text-gray-700 dark:text-gray-300">Aucun produit à faible stock pour le moment.</p>
            ) : (
              bestSellers.filter(p => p.countInStock !== undefined && p.countInStock <= 5).map(product => (
                <div key={product._id} className="flex items-center gap-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                  {product.images && product.images[0] && (
                    <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded-md" />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Stock actuel: {product.countInStock}</p>
                    <Button variant="link" onClick={() => {
                      setLowStockModalOpen(false);
                      getLowStockVariants(product);
                    }} className="p-0 h-auto text-blue-600 dark:text-blue-400">
                      Modifier le produit
                    </Button>
          </div>
        </div>
              ))
      )}
    </div>
          <DialogFooter className="mt-6">
            <Button onClick={() => setLowStockModalOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}