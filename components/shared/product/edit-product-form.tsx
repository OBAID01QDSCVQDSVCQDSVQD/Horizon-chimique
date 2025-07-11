"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FiInfo, FiImage, FiTag, FiLayers, FiSave, FiBold, FiItalic, FiList, FiCopy, FiX, FiPlus, FiUpload } from 'react-icons/fi';
import { FaBoxOpen } from 'react-icons/fa';
import { Combobox } from '@headlessui/react';
import dynamic from 'next/dynamic';
import TiptapEditor from '@/components/TiptapEditor';
import { toast } from 'react-hot-toast';
import { getValueString } from '@/lib/utils';

const Editor = dynamic(
  () => import('@tinymce/tinymce-react').then(mod => mod.Editor),
  { ssr: false }
);

interface Category {
  _id: string;
  name: string;
}

interface Catalogue {
  _id: { $oid: string } | string;
  title: string;
}

interface Attribute {
  _id: string;
  name: string;
  values: {
    label: string;
    image?: string;
    extraPrice?: number;
  }[];
}

interface AttributeValue {
  value: string;
  image?: string;
  price?: number;
}

interface SelectedAttribute {
  attributeId: string;
  values: AttributeValue[];
}

interface VariantOption {
  attributeId: string;
  value: string;
}

interface Variant {
  _id?: string;
  id: string;
  options: VariantOption[];
  price: string;
  image: string;
  stock: string;
}

interface EditProductFormProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    categories: string[];
    brand: string;
    description: string;
    price: number;
    listPrice: number;
    countInStock: number;
    images: string[];
    attributes?: SelectedAttribute[];
    variants?: Variant[];
    ficheTechnique?: string;
    tags?: string[];
  };
  attributes: Attribute[];
  categories: Category[];
  catalogues: Catalogue[];
}

export default function EditProductForm({ 
  product, 
  attributes: initialAttributes, 
  categories: initialCategories, 
  catalogues: initialCatalogues 
}: EditProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(product?.name || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [categorySearch, setCategorySearch] = useState('');
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    product?.categories?.map((cat: any) => typeof cat === 'object' && '$oid' in cat ? cat.$oid : cat) || []
  );
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [brand, setBrand] = useState(product?.brand || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [listPrice, setListPrice] = useState(product?.listPrice?.toString() || '');
  const [countInStock, setCountInStock] = useState(product?.countInStock?.toString() || '');
  const [attributes, setAttributes] = useState<Attribute[]>(initialAttributes || []);
  const initialSelectedAttributes: SelectedAttribute[] = product?.attributes?.reduce((acc: SelectedAttribute[], item: any) => {
    if (item.attribute && item.attribute._id) {
      const attributeId = item.attribute._id.toString();
      let existingAttribute = acc.find(sa => sa.attributeId === attributeId);
      const attributeValue: AttributeValue = {
        value: item.value,
        ...(item.image && { image: item.image }),
        ...(item.price && { price: item.price })
      };
      if (existingAttribute) {
        existingAttribute.values.push(attributeValue);
      } else {
        acc.push({
          attributeId: attributeId,
          values: [attributeValue]
        });
      }
    }
    return acc;
  }, []) || [];
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttribute[]>(
    initialSelectedAttributes
  );
  const [variants, setVariants] = useState<Variant[]>(
    product?.variants?.map(v => ({
      id: v._id?.toString() || Date.now().toString(),
      options: v.options,
      price: v.price?.toString() || '',
      stock: v.stock?.toString() || '',
      image: v.image || ''
    })) || []
  );
  const [baseImages, setBaseImages] = useState<string[]>(product?.images || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevSlugFromNameRef = useRef('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiImages, setAIImages] = useState<File[]>([]);
  const [aiPrompt, setAIPrompt] = useState('Écris une description commerciale pour ce produit');
  const [aiRawResult, setAiRawResult] = useState('');
  const [ficheTechnique, setFicheTechnique] = useState(product?.ficheTechnique || '');
  const [catalogues, setCatalogues] = useState<Catalogue[]>(initialCatalogues || []);
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [loadingCatalogues, setLoadingCatalogues] = useState(false);
  const [cataloguesError, setCataloguesError] = useState<string | null>(null);
  const [uploadingVariantImage, setUploadingVariantImage] = useState<number | null>(null);
  const [selectedProductTags, setSelectedProductTags] = useState<string[]>(product?.tags || []);

  // Add this constant for predefined tags
  const PREDEFINED_TAGS = [
    { id: 'new-arrival', label: 'Nouvel arrivage' },
    { id: 'featured', label: 'En vedette' },
    { id: 'best-seller', label: 'Meilleure vente' },
    { id: 'todays-deal', label: 'Offre du jour' }
  ];

  // Re-introducing and standardizing the Cloudinary upload function
  const uploadImageToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ecommerce-app'); // Make sure this preset is correct
    
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dwio60ll1/image/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to upload image to Cloudinary: ${errorText}`);
      }
      
      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error in uploadImageToCloudinary:', error);
      throw error; // Re-throw to be caught by calling function
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
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

        // Fetch tags
        // setLoadingTags(true);
        // const tagsRes = await fetch('/api/tags');
        // if (!tagsRes.ok) {
        //   throw new Error('Failed to fetch tags');
        // }
        // const tagsData = await tagsRes.json();
        // if (isMounted) {
        //   setAvailableTags(tagsData);
        //   setLoadingTags(false);
        // }
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

  const filteredCatalogues = (catalogues || []).filter(cat =>
    cat?.title?.toLowerCase().startsWith(catalogueSearch.toLowerCase())
  );

  useEffect(() => {
    if (selectedAttributes.length === 0) {
      setVariants([]);
      return;
    }
    const allValues = selectedAttributes.map(attr =>
      attr.values.map(val => ({ attributeId: attr.attributeId, value: getValueString(val) }))
    );
    function cartesian(arr: any[]): any[] {
      return arr.reduce((a, b) =>
        a.flatMap((d: any) => b.map((e: any) => [...d, e])), [[]]
      );
    }
    const combos = cartesian(allValues);

    // DEBUG LOG 1: What are product.variants initially?
    console.log('DEBUG (edit-product-form): product.variants at useEffect start:', JSON.parse(JSON.stringify(product?.variants || [])));

    const existingVariantsMap = new Map<string, Variant>();
    product?.variants?.forEach(v => {
      const transformedOptions = v.options.map(opt => ({
        attributeId: opt.attributeId.toString(), // Convert ObjectId to string here
        value: opt.value,
      }));
      const sortedOptions = [...transformedOptions].sort((a, b) => {
        if (a.attributeId < b.attributeId) return -1;
        if (a.attributeId > b.attributeId) return 1;
        return a.value.localeCompare(b.value);
      });
      existingVariantsMap.set(JSON.stringify(sortedOptions), v);
    });

    // DEBUG LOG 2: What's in the map?
    console.log('DEBUG (edit-product-form): existingVariantsMap after population:', JSON.parse(JSON.stringify(Array.from(existingVariantsMap.entries()))));


    setVariants(combos.map((combo, i) => {
      const sortedComboOptions = [...combo].sort((a: any, b: any) => {
        if (a.attributeId < b.attributeId) return -1;
        if (a.attributeId > b.attributeId) return 1;
        return a.value.localeCompare(b.value);
      });
      const comboKey = JSON.stringify(sortedComboOptions);
      const existingVariant = existingVariantsMap.get(comboKey);

      // DEBUG LOG 3: For each combo, what's the key and is an existing variant found?
      console.log(`DEBUG (edit-product-form): Combo ${i}:`, JSON.parse(JSON.stringify(combo)), `Key:`, comboKey, `Found existing:`, JSON.parse(JSON.stringify(existingVariant || null)));

      return {
        id: existingVariant?.id || i.toString(), // Use existing ID if available, otherwise generate new
        options: combo,
        price: existingVariant?.price?.toString() || '', // Explicitly convert to string
        image: existingVariant?.image || '',
        stock: existingVariant?.stock?.toString() || '' // Explicitly convert to string
      };
    }));
  }, [selectedAttributes, product?.variants]);

  const handleVariantImageChange = async (index: number, file: File | null) => {
    if (!file) return;
    setUploadingVariantImage(index);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setVariants(prev => prev.map((v, i) => i === index ? { ...v, image: imageUrl } : v));
    } catch (error) {
      console.error('Error uploading variant image:', error);
      toast.error('Failed to upload variant image');
    } finally {
      setUploadingVariantImage(null);
    }
  };

  const handleVariantPriceChange = (index: number, value: string) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, price: value } : v));
  };

  const handleVariantStockChange = (index: number, value: string) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, stock: value } : v));
  };

  const handleAttributeValueChange = (attributeId: string, value: any, checked: boolean) => {
    setSelectedAttributes(prev => {
      const attribute = prev.find(attr => attr.attributeId === attributeId);
      if (!attribute) {
        return [...prev, { attributeId, values: [value] }];
      }
      if (checked) {
        return prev.map(attr => 
          attr.attributeId === attributeId 
            ? { ...attr, values: [...attr.values, value] }
            : attr
        );
      } else {
        return prev.map(attr => 
          attr.attributeId === attributeId 
            ? { ...attr, values: attr.values.filter(v => v !== value) }
            : attr
        );
      }
    });
  };

  const handleAttributeValueImage = async (attributeId: string, value: any, file: File | null) => {
    if (!file) return;
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setSelectedAttributes(prev => prev.map(attr => 
        attr.attributeId === attributeId 
          ? { ...attr, values: attr.values.map(v => v === value ? { ...v, image: imageUrl } : v) }
          : attr
      ));
    } catch (error) {
      console.error('Error uploading attribute value image:', error);
      toast.error('Failed to upload attribute value image');
    }
  };

  const handleAttributeValuePrice = (attributeId: string, value: any, price: string) => {
    setSelectedAttributes(prev => prev.map(attr => 
      attr.attributeId === attributeId 
        ? { ...attr, values: attr.values.map(v => v === value ? { ...v, price: parseFloat(price) } : v) }
        : attr
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Basic validation using form state
      if (!name || !slug || !price || !brand || !description) {
        setError('Veuillez remplir tous les champs obligatoires');
        toast.error('Veuillez remplir tous les champs obligatoires');
        setLoading(false);
        return;
      }

      // Upload new base images
      const uploadedNewImages = await uploadImages(aiImages); // Assuming aiImages are new images to upload

      // Combine existing images with newly uploaded ones
      const allImages = [...baseImages, ...uploadedNewImages];

      // Prepare variants for submission
      const variantsToSend = variants.map(v => ({
        _id: v._id, // Keep existing _id for updates
        options: v.options.map((opt: any) => ({
          attributeId: opt.attributeId, // This should be the ObjectId string
          value: getValueString(opt.value),
        })),
        price: Number(v.price) || 0,
        image: v.image || '',
        stock: Number(v.stock) || 0,
      }));

      // Prepare attributes for submission in the correct format expected by the Product model
      const formattedAttributes = selectedAttributes.flatMap(attr =>
        attr.values.map(val => ({
          attribute: attr.attributeId, // This is the ObjectId of the Attribute document
          value: typeof val === 'object' ? (val as any).value : val, // Get the string value from the object or use directly
          ...(val.image && { image: val.image }), // Add image if present
          ...(val.price !== undefined && { price: Number(val.price) }), // Add price if present (using val.price)
        }))
      );
      
      const productData: any = {
        _id: product._id,
        name,
        slug,
        categories: selectedCategories, // Use selectedCategories state
        brand,
        description,
        price: Number(price),
        listPrice: Number(listPrice) || undefined,
        countInStock: Number(countInStock) || 0,
        images: allImages, // Use combined images
        tags: selectedProductTags, // Use selectedProductTags state
        attributes: formattedAttributes, // Use the newly formatted attributes
        variants: variantsToSend, // Use the newly prepared variants
        ficheTechnique: ficheTechnique || undefined, // Use ficheTechnique state
      };

      console.log('Product data sent to API for update (before JSON.stringify):', productData);

      const res = await fetch(`/api/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Échec de la mise à jour du produit');
      }

      toast.success('Produit mis à jour avec succès !');
      router.push('/admin/products');
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du produit:', err);
      setError(err.message || 'Une erreur inattendue est survenue.');
      toast.error(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  async function uploadImages(files: File[]) {
    const uploadedUrls = [];
    for (const file of files) {
      try {
        const url = await uploadImageToCloudinary(file);
        uploadedUrls.push(url);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
      }
    }
    return uploadedUrls;
  }

  async function generateDescriptionAI() {
    setLoadingAI(true);
    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: aiPrompt, productName: name }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate description');
      }

      const data = await response.json();
      setAiRawResult(data.description);
      setDescription(data.description);
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate description');
    } finally {
      setLoadingAI(false);
    }
  }

  const handleFicheTechniqueChange = (value: string | null) => {
    setFicheTechnique(value || '');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <FaBoxOpen className="text-blue-600" /> Edit Product
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section: Informations générales */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FiInfo className="text-blue-500" />
            <h2 className="text-xl font-semibold">Informations générales</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nom du produit</label>
              <Input placeholder="Nom du produit" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Slug</label>
              <Input placeholder="Slug" value={slug} onChange={e => setSlug(e.target.value)} />
            </div>

            {/* Categories selection with add button and tags */}
            <div className="space-y-2 col-span-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Catégories
              </label>
              <div className="flex gap-2 items-center">
                <select
                  value={currentCategory}
                  onChange={e => setCurrentCategory(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id} disabled={selectedCategories.includes(cat._id)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  onClick={() => {
                    if (currentCategory && !selectedCategories.includes(currentCategory)) {
                      setSelectedCategories(prev => [...prev, currentCategory]);
                      setCurrentCategory(''); // Reset dropdown
                    }
                  }}
                  className="flex items-center gap-1"
                  disabled={!currentCategory}
                >
                  <FiPlus className="w-4 h-4" /> Ajouter
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedCategories.map(catId => {
                  const category = categories.find(c => c._id === catId);
                  return category ? (
                    <span
                      key={catId}
                      className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-800 px-3 py-0.5 text-sm font-medium text-blue-800 dark:text-blue-100"
                    >
                      {category.name}
                      <button
                        type="button"
                        onClick={() => setSelectedCategories(prev => prev.filter(id => id !== catId))}
                        className="ml-1 -mr-0.5 h-4 w-4 rounded-full flex items-center justify-center text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100"
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Marque</label>
              <Input placeholder="Marque" value={brand} onChange={e => setBrand(e.target.value)} />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tags</label>
              <div className="flex gap-2 items-center">
                <div className="relative w-full">
                  <select
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value=""
                    onChange={(e) => {
                      const selectedTag = e.target.value;
                      if (selectedTag && !selectedProductTags.includes(selectedTag)) {
                        setSelectedProductTags(prev => [...prev, selectedTag]);
                      }
                      e.target.value = ''; // Reset select after selection
                    }}
                  >
                    <option value="">Sélectionner un tag...</option>
                    {PREDEFINED_TAGS.map((tag) => (
                      <option 
                        key={tag.id} 
                        value={tag.id}
                        disabled={selectedProductTags.includes(tag.id)}
                      >
                        {tag.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedProductTags.map((tagId) => {
                  const tag = PREDEFINED_TAGS.find(t => t.id === tagId);
                  return tag ? (
                    <span
                      key={tagId}
                      className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-800 px-3 py-0.5 text-sm font-medium text-blue-800 dark:text-blue-100"
                    >
                      {tag.label}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductTags(prev => prev.filter(t => t !== tagId));
                        }}
                        className="ml-1 -mr-0.5 h-4 w-4 rounded-full flex items-center justify-center text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100"
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
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
                        <th className="border px-2 py-1">Prix</th>
                        <th className="border px-2 py-1">Stock</th>
                        <th className="border px-2 py-1">Image de la variante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((variant, i) => (
                        <tr key={i}>
                          <td className="border px-2 py-1">{i + 1}</td>
                          <td className="border px-2 py-1">
                            {variant.options.map((opt: any) => {
                              const attribute = attributes.find(a => a._id === opt.attributeId);
                              return `${attribute?.name}: ${opt.value}`;
                            }).join(', ')}
                          </td>
                          <td className="border px-2 py-1">
                            <input
                              type="number"
                              className="w-24 border rounded px-2 py-1 text-center"
                              value={variant.price || ''}
                              onChange={e => handleVariantPriceChange(i, e.target.value)}
                              min={0}
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <input
                              type="number"
                              className="w-24 border rounded px-2 py-1 text-center"
                              value={variant.stock || ''}
                              onChange={e => handleVariantStockChange(i, e.target.value)}
                              min={0}
                            />
                          </td>
                          <td className="border px-2 py-1 text-center">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              {variant.image ? (
                                <img src={variant.image} alt="Variant" className="w-16 h-16 object-contain rounded border" />
                              ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">Aucune image</span>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`variant-image-upload-${i}`}
                                onChange={e => handleVariantImageChange(i, e.target.files ? e.target.files[0] : null)}
                              />
                              <label
                                htmlFor={`variant-image-upload-${i}`}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition"
                                style={{ display: uploadingVariantImage === i ? 'none' : 'block' }}
                              >
                                {uploadingVariantImage === i ? 'Téléchargement...' : 'Modifier l\'image'}
                              </label>
                              {uploadingVariantImage === i && (
                                <span className="text-sm text-blue-600">Chargement...</span>
                              )}
                            </div>
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
                  placeholder="La description générée apparaîtra ici..."
                  style={{ resize: 'vertical', minHeight: 80 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (description) {
                      navigator.clipboard.writeText(description)
                      toast.success('Texte copié !')
                    }
                  }}
                  className="absolute top-2 right-2 px-2 py-1 text-xs bg-white border border-gray-300 rounded shadow hover:bg-gray-100 flex items-center gap-1 text-gray-700 transition"
                  title="Copier le texte"
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
                  try {
                    const url = await uploadImageToCloudinary(file)
                    urls.push(url)
                  } catch (uploadError) {
                    console.error('Error uploading base image:', uploadError);
                    toast.error('Échec du téléchargement de l\'image principale. Veuillez réessayer.');
                    // Optionally break or continue based on desired behavior for multiple uploads
                  }
                }
                setBaseImages(prev => [...prev, ...urls]) // Append new images
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
                    value={currentCategory}
                    onChange={e => setCurrentCategory(e.target.value)}
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
                    onChange={e => handleFicheTechniqueChange(e.target.value)}
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
            <h2 className="text-xl font-semibold">Attributs et Variantes</h2>
          </div>
          {/* Attribute Selection and Management */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Ajouter un nouvel attribut</label>
            <div className="flex gap-2">
              <select
                className="flex-grow border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                onChange={(e) => {
                  const selectedAttrId = e.target.value;
                  const selectedAttr = attributes.find(a => a._id === selectedAttrId);
                  if (selectedAttr && !selectedAttributes.some(sa => sa.attributeId === selectedAttrId)) {
                    setSelectedAttributes(prev => [...prev, { attributeId: selectedAttrId, values: [] }]);
                  }
                }}
                value=""
              >
                <option value="">Sélectionner une attribute</option>
                {attributes.map(attr => (
                  <option key={attr._id} value={attr._id} disabled={selectedAttributes.some(sa => sa.attributeId === attr._id)}>
                    {attr.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedAttributes.map((selectedAttr, selectedAttrIndex) => {
              const attributeDetails = attributes.find(a => a._id === selectedAttr.attributeId);
              if (!attributeDetails) return null;

              return (
                <Card key={selectedAttr.attributeId} className="p-4">
                  <CardHeader className="flex flex-row items-center justify-between p-0 mb-4">
                    <h3 className="text-lg font-semibold">{attributeDetails.name}</h3>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet attribut ?")) {
                          setSelectedAttributes(prev => prev.filter(sa => sa.attributeId !== selectedAttr.attributeId));
                        }
                      }}
                    >
                      <FiX className="w-4 h-4" /> Supprimer l'attribut
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    {/* Existing Attribute Values */}
                    {selectedAttr.values.map((val, valIndex) => (
                      <div key={valIndex} className="flex items-center gap-2 border rounded-md p-2 bg-gray-50 dark:bg-gray-800">
                        <Input
                          placeholder="Valeur de l'attribut"
                          value={typeof val === 'object' ? val.value : val}
                          onChange={e => {
                            const newValue = e.target.value;
                            setSelectedAttributes(prev => prev.map((sa, saIdx) =>
                              saIdx === selectedAttrIndex
                                ? { ...sa, values: sa.values.map((v, vIdx) => vIdx === valIndex ? { ...val, value: newValue } : v) }
                                : sa
                            ));
                          }}
                        />
                        {/* Image Upload for Attribute Value */}
                        <div className="flex items-center gap-1">
                          {val.image && <img src={val.image} alt="value" className="w-10 h-10 object-contain rounded" />}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`attr-val-image-${selectedAttr.attributeId}-${valIndex}`}
                            onChange={e => handleAttributeValueImage(selectedAttr.attributeId, val, e.target.files ? e.target.files[0] : null)}
                          />
                          <label
                            htmlFor={`attr-val-image-${selectedAttr.attributeId}-${valIndex}`}
                            className="p-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                          >
                            <FiUpload className="w-4 h-4" />
                          </label>
                        </div>
                        {/* Price Input for Attribute Value */}
                        <Input
                          placeholder="Prix (optionnel)"
                          value={val.price !== undefined ? val.price.toString() : ''}
                          onChange={e => handleAttributeValuePrice(selectedAttr.attributeId, val, e.target.value)}
                          type="number"
                          className="w-32"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAttributes(prev => prev.map((sa, saIdx) =>
                              saIdx === selectedAttrIndex
                                ? { ...sa, values: sa.values.filter((v, vIdx) => vIdx !== valIndex) }
                                : sa
                            ));
                          }}
                        >
                          <FiX className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    {/* Add New Attribute Value */}
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Ajouter une nouvelle valeur (ex: 10 kg)"
                        id={`new-value-input-${selectedAttr.attributeId}`}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          const newValueInput = document.getElementById(`new-value-input-${selectedAttr.attributeId}`) as HTMLInputElement;
                          const newValue = newValueInput.value.trim();
                          if (newValue && !selectedAttr.values.some(v => v.value === newValue)) {
                            setSelectedAttributes(prev => prev.map((sa, saIdx) =>
                              saIdx === selectedAttrIndex
                                ? { ...sa, values: [...sa.values, { value: newValue }] }
                                : sa
                            ));
                            newValueInput.value = ''; // Clear input
                          }
                        }}
                      >
                        <FiPlus className="w-4 h-4" /> Ajouter une valeur
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Variants Table */}
          {selectedAttributes.length > 0 && (
            <div className="col-span-2 mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Stock par variante</label>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="border px-2 py-1">#</th>
                      <th className="border px-2 py-1">Attributs</th>
                      <th className="border px-2 py-1">Prix</th>
                      <th className="border px-2 py-1">Stock</th>
                      <th className="border px-2 py-1">Image de la variante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, i) => (
                      <tr key={variant.id || i}>
                        <td className="border px-2 py-1">{i + 1}</td>
                        <td className="border px-2 py-1">
                          {variant.options.map((opt: any) => {
                            const attribute = attributes.find(a => a._id === opt.attributeId);
                            return `${attribute?.name}: ${opt.value}`;
                          }).join(', ')}
                        </td>
                        <td className="border px-2 py-1">
                          <input
                            type="number"
                            className="w-24 border rounded px-2 py-1 text-center"
                            value={variant.price || ''}
                            onChange={e => handleVariantPriceChange(i, e.target.value)}
                            min={0}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <input
                            type="number"
                            className="w-24 border rounded px-2 py-1 text-center"
                            value={variant.stock || ''}
                            onChange={e => handleVariantStockChange(i, e.target.value)}
                            min={0}
                          />
                        </td>
                        <td className="border px-2 py-1 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            {variant.image ? (
                              <img src={variant.image} alt="Variant" className="w-16 h-16 object-contain rounded border" />
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">Aucune image</span>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id={`variant-image-upload-${i}`}
                              onChange={e => handleVariantImageChange(i, e.target.files ? e.target.files[0] : null)}
                            />
                            <label
                              htmlFor={`variant-image-upload-${i}`}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition"
                              style={{ display: uploadingVariantImage === i ? 'none' : 'block' }}
                            >
                              {uploadingVariantImage === i ? 'Téléchargement...' : 'Modifier l\'image'}
                            </label>
                            {uploadingVariantImage === i && (
                              <span className="text-sm text-blue-600">Chargement...</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" className="mt-4 flex items-center gap-2 px-6 py-2 text-lg" onClick={handleSubmit} disabled={loading}>
            <FiSave /> {loading ? 'Enregistrement...' : 'Enregistrer le produit'}
          </Button>
        </div>

        {/* Error Message */}
        {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
      </form>
    </div>
  );
} 