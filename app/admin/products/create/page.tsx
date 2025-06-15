"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getAllAttributes } from '@/lib/db/actions/attribute.actions'
import { FiInfo, FiImage, FiTag, FiLayers, FiSave, FiBold, FiItalic, FiList, FiCopy } from 'react-icons/fi'
import { FaBoxOpen } from 'react-icons/fa'
import { Combobox } from '@headlessui/react'
import dynamic from 'next/dynamic'
import TiptapEditor from '@/components/TiptapEditor'
import { toast } from 'react-hot-toast'

const Editor = dynamic(
  () => import('@tinymce/tinymce-react').then(mod => mod.Editor),
  { ssr: false }
)

export default function CreateProductPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([])
  const [brand, setBrand] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [listPrice, setListPrice] = useState('')
  const [countInStock, setCountInStock] = useState('')
  const [attributes, setAttributes] = useState<any[]>([])
  const [selectedAttributes, setSelectedAttributes] = useState<{ attributeId: string, values: { value: string, image?: string, price?: number }[] }[]>([])
  const [variants, setVariants] = useState<any[]>([])
  const [baseImages, setBaseImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevSlugFromNameRef = useRef('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiImages, setAIImages] = useState<File[]>([])
  const [aiPrompt, setAIPrompt] = useState('Écris une description commerciale pour ce produit')
  const [aiRawResult, setAiRawResult] = useState('')
  const [ficheTechnique, setFicheTechnique] = useState('')
  const [catalogues, setCatalogues] = useState<{ _id: { $oid: string } | string; title: string }[]>([])
  const [catalogueSearch, setCatalogueSearch] = useState('')
  const [loadingCatalogues, setLoadingCatalogues] = useState(false)
  const [cataloguesError, setCataloguesError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        // Fetch attributes
        const attributesRes = await getAllAttributes();
        if (isMounted) setAttributes(attributesRes);

        // Fetch categories
        const categoriesRes = await fetch('/api/categories/list');
        const categoriesData = await categoriesRes.json();
        console.log('Categories data:', categoriesData); // Debug log
        if (isMounted) {
          if (categoriesData.categories && Array.isArray(categoriesData.categories)) {
            setCategories(categoriesData.categories);
          } else {
            console.error('Invalid categories data format:', categoriesData);
          }
        }

        // Fetch catalogues
        setLoadingCatalogues(true);
        setCataloguesError(null);
        const cataloguesRes = await fetch('/api/catalogues');
        if (!cataloguesRes.ok) {
          throw new Error('Erreur lors de la récupération des catalogues');
        }
        const cataloguesData = await cataloguesRes.json();
        console.log('Catalogues data:', cataloguesData); // Debug log
        if (isMounted) {
          let formattedCatalogues = [];
          if (Array.isArray(cataloguesData)) {
            formattedCatalogues = cataloguesData;
          } else if (cataloguesData && typeof cataloguesData === 'object') {
            // If it's a single object, wrap it in an array
            formattedCatalogues = [cataloguesData];
          }
          setCatalogues(formattedCatalogues);
          setLoadingCatalogues(false);
        }
      } catch (error) {
        console.error('Erreur:', error);
        if (isMounted) {
          setCataloguesError('Impossible de charger les catalogues. Veuillez réessayer.');
          setLoadingCatalogues(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once

  const filteredCategories = categories.filter(cat =>
    cat?.name?.toLowerCase().startsWith(categorySearch.toLowerCase())
  )

  const filteredCatalogues = catalogues.filter(cat =>
    cat?.title?.toLowerCase().startsWith(catalogueSearch.toLowerCase())
  )

  useEffect(() => {
    if (selectedAttributes.length === 0) {
      setVariants([])
      return
    }
    const allValues = selectedAttributes.map(attr =>
      attr.values.map(val => ({ attributeId: attr.attributeId, value: getValueString(val) }))
    )
    function cartesian(arr: any[]): any[] {
      return arr.reduce((a, b) =>
        a.flatMap((d: any) => b.map((e: any) => [...d, e])), [[]]
      )
    }
    const combos = cartesian(allValues)
    setVariants(combos.map((combo, i) => ({
      id: i,
      options: combo,
      price: '',
      image: ''
    })))
  }, [selectedAttributes])

  const uploadImageToCloudinary = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'ecommerce-app')
    const res = await fetch('https://api.cloudinary.com/v1_1/dwio60ll1/image/upload', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    return data.secure_url
  }

  const handleVariantImageChange = async (index: number, file: File | null) => {
    if (!file) return
    const url = await uploadImageToCloudinary(file)
    const newVariants = [...variants]
    newVariants[index].image = url
    setVariants(newVariants)
  }

  const handleVariantPriceChange = (index: number, value: string) => {
    const newVariants = [...variants]
    newVariants[index].price = value
    setVariants(newVariants)
  }

  // Handle stock for each variant
  const handleVariantStockChange = (index: number, value: string) => {
    const newVariants = [...variants]
    newVariants[index].stock = value
    setVariants(newVariants)
  }

  // Helper to get value as string
  const getValueString = (val: any) => typeof val === 'object' && val !== null ? val.label || val.value || '' : val || ''

  const handleAttributeValueChange = (attributeId: string, value: any, checked: boolean) => {
    const valueStr = getValueString(value)
    setSelectedAttributes(prev => {
      const idx = prev.findIndex(a => a.attributeId === attributeId)
      if (idx === -1 && checked) {
        return [...prev, { attributeId, values: [{ value: valueStr }] }]
      }
      if (idx !== -1) {
        const values = prev[idx].values
        const exists = values.find(v => getValueString(v.value) === valueStr)
        let newValues
        if (checked && !exists) {
          newValues = [...values, { value: valueStr }]
        } else if (!checked && exists) {
          newValues = values.filter(v => getValueString(v.value) !== valueStr)
        } else {
          newValues = values
        }
        if (newValues.length === 0) {
          return prev.filter((_, i) => i !== idx)
        }
        const updated = [...prev]
        updated[idx] = { ...updated[idx], values: newValues }
        return updated
      }
      return prev
    })
  }

  const handleAttributeValueImage = async (attributeId: string, value: any, file: File | null) => {
    if (!file) return
    const valueStr = getValueString(value)
    const url = await uploadImageToCloudinary(file)
    setSelectedAttributes(prev => prev.map(attr =>
      attr.attributeId !== attributeId ? attr : {
        ...attr,
        values: attr.values.map(v => getValueString(v.value) === valueStr ? { ...v, image: url } : v)
      }
    ))
  }

  const handleAttributeValuePrice = (attributeId: string, value: any, price: string) => {
    const valueStr = getValueString(value)
    setSelectedAttributes(prev => prev.map(attr =>
      attr.attributeId !== attributeId ? attr : {
        ...attr,
        values: attr.values.map(v => getValueString(v.value) === valueStr ? { ...v, price: price ? parseFloat(price) : undefined } : v)
      }
    ))
  }

  useEffect(() => {
    if (name && (!slug || slug === prevSlugFromNameRef.current)) {
      const generated = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(generated)
      prevSlugFromNameRef.current = generated
    }
  }, [name, slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit button clicked');
    setLoading(true);
    setError(null);
    try {
      const attributesForDb = selectedAttributes.flatMap(attr =>
        attr.values.map(valObj => ({
          attribute: attr.attributeId,
          value: valObj.value,
          image: valObj.image,
          price: valObj.price,
        }))
      )
      const productData = {
        name,
        slug,
        category,
        brand,
        description,
        price: parseFloat(price),
        listPrice: parseFloat(listPrice),
        countInStock: variants.length === 0 ? parseInt(countInStock) || 0 : 0, // ignore main stock if variants
        images: baseImages,
        attributes: attributesForDb,
        variants: variants.length > 0 ? variants.map(v => ({ ...v, stock: parseInt(v.stock) || 0 })) : [],
        isPublished: true,
        avgRating: 0,
        numReviews: 0,
        numSales: 0,
        tags: ['new arrival'],
        ficheTechnique: ficheTechnique || undefined,
      }

      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      const result = await res.json()
      if (res.ok) {
        toast.success('Product created successfully!');
        router.push(`/product/${result.product.slug}`);
      } else {
        setError(result.message || 'Failed to create product');
        toast.error(result.message || 'Failed to create product');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating product')
    } finally {
      setLoading(false)
    }
  }

  async function uploadImages(files: File[]) {
    const urls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ecommerce-app');
      const res = await fetch('https://api.cloudinary.com/v1_1/dwio60ll1/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      urls.push(data.secure_url);
    }
    return urls;
  }

  async function generateDescriptionAI() {
    if (!aiImages.length || !aiPrompt) return;
    setLoadingAI(true)
    try {
      const imageUrls = await uploadImages(aiImages);
      const res = await fetch('/api/ai-generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          features: aiPrompt,
          images: imageUrls
        }),
      })
      const data = await res.json()
      setAiRawResult(data.description || '')
      setDescription(data.description || '')
    } catch (err) {
      alert('Erreur lors de la génération de la description !')
    } finally {
      setLoadingAI(false)
    }
  }

  const handleFicheTechniqueChange = (value: string | null) => {
    setFicheTechnique(value || '')
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <FaBoxOpen className="text-blue-600" /> Ajouter un produit
      </h1>
      {/* Section: Informations générales */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FiInfo className="text-blue-500" />
          <h2 className="text-xl font-semibold">Informations générales</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input placeholder="Nom du produit" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Slug" value={slug} onChange={e => setSlug(e.target.value)} />
          <Input placeholder="Marque" value={brand} onChange={e => setBrand(e.target.value)} />
          <Input placeholder="Prix de base (€)" value={price} onChange={e => setPrice(e.target.value)} type="number" />
          <Input placeholder="Prix affiché (€)" value={listPrice} onChange={e => setListPrice(e.target.value)} type="number" />
          {/* Stock logic: show main stock if no variants, else show variant stock table */}
          {variants.length === 0 ? (
            <Input
              placeholder="Stock"
              value={countInStock}
              onChange={e => setCountInStock(e.target.value)}
              type="number"
            />
          ) : (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Stock par variante</label>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="border px-2 py-1">#</th>
                      <th className="border px-2 py-1">Attributs</th>
                      <th className="border px-2 py-1">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">{i + 1}</td>
                        <td className="border px-2 py-1">
                          {variant.options.map((opt: any) => `${opt.attributeId}: ${opt.value}`).join(', ')}
                        </td>
                        <td className="border px-2 py-1">
                          <input
                            type="number"
                            className="w-24 border rounded px-2 py-1"
                            value={variant.stock || ''}
                            onChange={e => handleVariantStockChange(i, e.target.value)}
                            min={0}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description du produit</label>
          {/* AI Description Generator */}
          <div className="flex flex-col gap-2 mb-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => setAIImages(Array.from(e.target.files || []))}
            />
            <input
              type="text"
              placeholder="Prompt pour l'IA (ex: Écris une description commerciale pour ce produit)"
              value={aiPrompt}
              onChange={e => setAIPrompt(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
            <Button
              type="button"
              onClick={generateDescriptionAI}
              disabled={loadingAI || !aiImages.length || !aiPrompt}
            >
              {loadingAI ? 'Génération...' : 'Générer une description avec IA (images + texte)'}
            </Button>
            {/* Debug: Show generated description in a plain textarea with a floating copy button */}
            <div className="relative mt-2">
              <textarea
                value={description}
                readOnly
                rows={5}
                className="w-full border border-gray-300 rounded p-2 text-gray-800 pr-16 bg-gray-50"
                placeholder="Description générée apparaîtra ici..."
                style={{ resize: 'vertical', minHeight: 80 }}
              />
              <button
                type="button"
                onClick={() => {
                  if (description) {
                    navigator.clipboard.writeText(description)
                    toast.success('تم نسخ النص!')
                  }
                }}
                className="absolute top-2 right-2 px-2 py-1 text-xs bg-white border border-gray-300 rounded shadow hover:bg-gray-100 flex items-center gap-1 text-gray-700 transition"
                title="نسخ النص"
                disabled={!description}
                style={{ zIndex: 10 }}
              >
                <FiCopy className="w-4 h-4" />
                <span>Copier</span>
              </button>
            </div>
          </div>
          <TiptapEditor
            content={description}
            onChange={setDescription}
          />
        </div>
      </div>
      {/* Section: Images */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FiImage className="text-blue-500" />
          <h2 className="text-xl font-semibold">Images du produit</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <label className="w-full md:w-1/2 flex flex-col items-center px-4 py-6 bg-gray-50 dark:bg-gray-800 text-blue-600 rounded-lg shadow-md tracking-wide uppercase border border-blue-200 dark:border-gray-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
            <span className="mt-2 text-base leading-normal">Glisser-déposer ou cliquer pour télécharger</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
              if (!e.target.files) return
              const files = Array.from(e.target.files)
              const urls: string[] = []
              for (const file of files) {
                const url = await uploadImageToCloudinary(file)
                urls.push(url)
              }
              setBaseImages(urls)
            }} />
          </label>
          <div className="flex gap-2 flex-wrap">
            {baseImages.map((img, i) => (
              img && img.trim() !== "" ? (
                <img key={i} src={img} alt="base" className="w-20 h-20 object-contain rounded border" />
              ) : null
            ))}
          </div>
        </div>
      </div>
      {/* Section: Catégorie */}
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <FiTag className="text-blue-500" />
            <h2 className="text-xl font-semibold">Catégorie</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-5 p-4 md:flex-row md:items-start">
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Catégorie</h2>
              <div className="mt-4">
                <label className="block font-medium mb-1" htmlFor="category">Catégorie</label>
                <select
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories && categories.length > 0 ? (
                    categories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Aucune catégorie disponible</option>
                  )}
                </select>
              </div>
            </div>
            {/* Fiche Technique Select */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Fiche Technique</h2>
              <div className="mt-4">
                <label htmlFor="ficheTechnique" className="block font-medium mb-1">Fiche Technique</label>
                <select
                  id="ficheTechnique"
                  value={ficheTechnique}
                  onChange={e => setFicheTechnique(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  disabled={loadingCatalogues}
                >
                  <option value="">Sélectionner une fiche technique</option>
                  {loadingCatalogues ? (
                    <option value="" disabled>Chargement...</option>
                  ) : cataloguesError ? (
                    <option value="" disabled>Erreur de chargement</option>
                  ) : catalogues && catalogues.length > 0 ? (
                    catalogues.map(cat => (
                      <option key={typeof cat._id === 'object' && '$oid' in cat._id ? cat._id.$oid : cat._id} value={typeof cat._id === 'object' && '$oid' in cat._id ? cat._id.$oid : cat._id}>
                        {cat.title}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Aucune fiche technique disponible</option>
                  )}
                </select>
                {cataloguesError && (
                  <p className="text-red-500 text-sm mt-1">{cataloguesError}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Section: Attributs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FiLayers className="text-blue-500" />
          <h2 className="text-xl font-semibold">Attributs</h2>
        </div>
        {attributes.length === 0 ? (
          <div className="text-gray-400">Aucun attribut disponible.</div>
        ) : (
          attributes.map(attr => (
            <div key={attr._id} className="mb-2">
              <div className="font-medium mb-1">{attr.name}</div>
              <div className="flex flex-wrap gap-2">
                {attr.values.map((val: any) => {
                  const valueStr = getValueString(val)
                  const selectedAttr = selectedAttributes.find(a => a.attributeId === attr._id)
                  const selectedVal = selectedAttr?.values.find((v: any) => getValueString(v.value) === valueStr)
                  return (
                    <label key={val._id || valueStr} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={e => handleAttributeValueChange(attr._id, val, e.target.checked)}
                        checked={!!selectedVal}
                      />
                      <span>{valueStr}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Section: Variantes */}
      {variants.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FiList className="text-blue-500" />
            <h2 className="text-xl font-semibold">Variantes</h2>
          </div>
          <div className="space-y-2">
            {variants.map((variant, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 border p-2 rounded">
                <div className="flex gap-2 flex-wrap">
                  {variant.options.map((opt: any, idx: number) => (
                    <span key={idx} className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                      {attributes.find(a => a._id === opt.attributeId)?.name}: {getValueString(opt.value)}
                    </span>
                  ))}
                </div>
                {/* Price and Stock side by side */}
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="Prix"
                    value={variant.price}
                    onChange={e => handleVariantPriceChange(i, e.target.value)}
                    className="w-24"
                  />
                  <Input
                    type="number"
                    placeholder="Stock"
                    value={variant.stock || ''}
                    onChange={e => handleVariantStockChange(i, e.target.value)}
                    className="w-24"
                    min={0}
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleVariantImageChange(i, e.target.files?.[0] || null)}
                />
                {variant.image && variant.image.trim() !== "" && (
                  <img src={variant.image} alt="variant" className="w-12 h-12 object-contain" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* زر الحفظ والتنبيهات */}
      <div className="flex justify-end">
        <Button type="submit" className="mt-4 flex items-center gap-2 px-6 py-2 text-lg" onClick={handleSubmit} disabled={loading}>
          <FiSave /> {loading ? 'Enregistrement...' : 'Enregistrer le produit'}
        </Button>
      </div>
      {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
    </div>
  )
}