'use client'
import { useState, useMemo } from 'react';
import SelectVariant from '@/components/shared/product/select-variant';
import ProductPrice from '@/components/shared/product/product-price';
import ProductGallery from '@/components/shared/product/product-gallery';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ProductSlider from '@/components/shared/product/product-slider';
import Rating from '@/components/shared/product/rating';
import AddToBrowsingHistory from '@/components/shared/product/add-to-browsing-history';
import AddToCart from '@/components/shared/product/add-to-cart';
import { generateId, round2, getValueString } from '@/lib/utils';
import { FiDownload } from 'react-icons/fi';
import { Button } from '@/components/ui/button';

// نصوص فرنسية
const STOCK_TEXT = 'Stock disponible :';
const OUT_OF_STOCK_TEXT = 'Rupture de stock';

export default function ProductDetailsClient({ product, relatedProducts, allAttributes }: { product: any, relatedProducts: any[], allAttributes: any[] }) {
  console.log('Product data received in ProductDetailsClient:', product);
  // Group attributes by name based on available variants
  const grouped: Record<string, string[]> = {};
  console.log('Product attributes in ProductDetailsClient:', product.attributes);

  // Iterate through variants to build grouped attributes
  product.variants?.forEach((variant: any) => {
    variant.options.forEach((opt: any) => {
      const attrObj = product.attributes.find((a: any) => {
        if (a.attribute && typeof a.attribute === 'object' && a.attribute._id) {
          return a.attribute._id.toString() === opt.attributeId.toString();
        }
        return a.attribute === opt.attributeId.toString();
      });

      let attrName = null;
      if (attrObj && attrObj.attribute && typeof attrObj.attribute === 'object' && 'name' in attrObj.attribute) {
        attrName = attrObj.attribute.name;
      } else if (typeof attrObj?.attribute === 'string') {
        const foundAttribute = allAttributes.find(a => a._id === attrObj.attribute);
        if (foundAttribute) {
          attrName = foundAttribute.name;
        }
      }

      const attrValue = getValueString(opt.value);
      if (attrName) {
        if (!grouped[attrName]) grouped[attrName] = [];
        if (!grouped[attrName].includes(attrValue)) grouped[attrName].push(attrValue);
      }
    });
  });

  // State for selected values
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    console.log('DEBUG SELECT INITIAL: Starting useState initialization. Product variants:', product.variants);
    console.log('DEBUG SELECT INITIAL: Product attributes:', product.attributes);

    let initialVariantToSelect = null;

    // 1. Try to find a variant with stock first
    initialVariantToSelect = product.variants?.find((v: any) => v.stock > 0);
    console.log('DEBUG SELECT INITIAL: Variant with stock found:', initialVariantToSelect);

    // 2. If no variant with stock, try to find any variant
    if (!initialVariantToSelect && product.variants && product.variants.length > 0) {
      initialVariantToSelect = product.variants[0];
      console.log('DEBUG SELECT INITIAL: No variant with stock, defaulting to first variant:', initialVariantToSelect);
    }
    
    // 3. Populate defaults based on the chosen initial variant
    if (initialVariantToSelect) {
      initialVariantToSelect.options.forEach((opt: any) => {
        // Find the corresponding attribute details from allAttributes based on attributeId
        const foundAttribute = allAttributes.find((a: any) => a._id.toString() === opt.attributeId.toString());
        if (foundAttribute) {
          const attrName = foundAttribute.name;
          if (attrName) {
            defaults[attrName] = getValueString(opt.value);
          }
        }
      });
    } else {
      // Fallback: If no variants at all, use first available values from grouped
      Object.entries(grouped).forEach(([attrName, values]) => {
        if (values.length > 0) {
          defaults[attrName] = values[0];
        }
      });
      console.log('DEBUG SELECT INITIAL: No variants, defaulting to grouped values:', defaults);
    }

    console.log('DEBUG SELECT INITIAL: Final selected defaults:', defaults);
    return defaults;
  });

  // أضف هذا المتغير قبل return
  const allAttributesSelected = Object.entries(grouped).every(([attrName, values]) => selected[attrName]);

  // Prepare selected attributes for cart item
  const formattedSelectedAttributes = Object.entries(selected).map(([attrName, attrValue]) => ({
    attribute: attrName,
    value: attrValue,
  }));

  // Find the matching variant based on selected attributes
  const matchingVariant = product.variants?.find((variant: {
    options: Array<{
      attributeId: string;
      value: string;
    }>;
    stock: number;
    price?: number;
    image?: string;
  }) =>
    variant.options.every((opt: { attributeId: string; value: string }) => {
      const foundAttribute = allAttributes.find((a: any) => a._id.toString() === opt.attributeId.toString());
      const attributeName = foundAttribute ? foundAttribute.name : undefined;

      return formattedSelectedAttributes.some(selected => 
        selected.attribute === attributeName && selected.value === getValueString(opt.value)
      );
    })
  );

  // Get available stock for the selected variant
  const availableStock = matchingVariant?.stock || 0;

  // Merge product images with selected attribute images (if any)
  const galleryImages = useMemo(() => {
    const images = [...(product.images || [])];
    // Add images from selected attributes if available
    product.attributes?.forEach((attr: any) => {
      const attrName = attr.attribute && typeof attr.attribute === 'object' && 'name' in attr.attribute
        ? attr.attribute.name
        : attr.attribute;
      // Ensure attr.image is not an empty string before pushing
      if (attrName && selected[attrName] === attr.value && attr.image && attr.image.trim() !== '') {
        images.push(attr.image);
      }
    });
    // Add variant image if available
    // Ensure matchingVariant.image is not an empty string before unshifting
    if (matchingVariant?.image && matchingVariant.image.trim() !== '') {
      images.unshift(matchingVariant.image);
    }
    console.log('DEBUG GALLERY: Images before final filter:', images);
    // فلترة الصور النهائية
    const finalImages = Array.from(new Set(images)).filter(img => img && typeof img === 'string' && img.trim() !== "");
    console.log('DEBUG GALLERY: Images after final filter:', finalImages);
    return finalImages;
  }, [product, selected, matchingVariant]);

  // Price to display
  const displayPrice = matchingVariant?.price ?? product.price;

  return (
    <section>
      <AddToBrowsingHistory id={product._id} category={product.categories[0]} />
      <div className='grid grid-cols-1 md:grid-cols-5'>
        <div className='col-span-2'>
          <ProductGallery images={galleryImages} />
        </div>
        <div className='flex w-full flex-col gap-2 md:p-5 col-span-2'>
          <div className='flex flex-col gap-3'>
            <p className='text-sm rounded-full bg-grey-500/10 text-grey-500 px-3 py-1'>
              Brand {product.brand}
            </p>
            <h1 className='font-bold text-base lg:text-lg'>{product.name}</h1>
            <div className='flex items-center gap-2'>
              <span>{product.avgRating?.toFixed(1)}</span>
              <Rating rating={product.avgRating} />
              <span>{product.numReviews} ratings</span>
            </div>
            <Separator />
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <div className='flex gap-3'>
                <ProductPrice
                  price={displayPrice}
                  listPrice={product.listPrice}
                  isDeal={product.tags?.includes('todays-deal') ?? false}
                  forListing={false}
                  basePrice={product.price}
                  baseListPrice={product.listPrice}
                />
              </div>
            </div>
            {/* معلومات إضافية عن المنتج */}
            <div className='flex flex-wrap gap-2 mt-2'>
              {product.tags && product.tags.length > 0 && (
                <div className='flex gap-2'>
                  {product.tags.map((tag: string) => (
                    <span key={tag} className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'>
                      {tag === 'new-arrival' && 'Nouveau'}
                      {tag === 'featured' && 'En vedette'}
                      {tag === 'best-seller' && 'Meilleur vendeur'}
                      {tag === 'todays-deal' && 'Offre du jour'}
                    </span>
                  ))}
                </div>
              )}
              {product.countInStock > 0 && (
                <span className='px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full'>
                  En stock: {product.countInStock}
                </span>
              )}
            </div>
          </div>
          <div>
            <SelectVariant
              product={product}
              selected={selected}
              setSelected={setSelected}
              allAttributes={allAttributes}
            />
          </div>
          <Separator className='my-2' />
          {/* Stock Display Section */}
          <div className='mt-2'>
            {allAttributesSelected && matchingVariant ? (
              <p className={
                `text-base font-semibold ${availableStock > 0 ? 'text-green-600' : 'text-red-600'}`
              }>
                {availableStock > 0
                  ? `${STOCK_TEXT} ${availableStock}`
                  : OUT_OF_STOCK_TEXT}
              </p>
            ) : (
              <p className={
                `text-base font-semibold ${product.countInStock > 0 ? 'text-green-600' : 'text-red-600'}`
              }>
                {product.countInStock > 0
                  ? `${STOCK_TEXT} ${product.countInStock}`
                  : OUT_OF_STOCK_TEXT}
              </p>
            )}
          </div>
          <Separator className='my-2' />
          {/* Fiche Technique Section */}
          {(() => {
            console.log('Fiche Technique Data:', {
              ficheTechnique: product.ficheTechnique,
              type: typeof product.ficheTechnique
            });
            
            const ficheTechniqueId = typeof product.ficheTechnique === 'string' ? product.ficheTechnique : product.ficheTechnique?._id;
            const ficheTechniqueTitle = product.ficheTechnique?.title; // Assuming title exists if it's an object

            if (!ficheTechniqueId) {
              console.log('No ficheTechnique ID found');
              return null;
            }

            return (
              <Card className="p-4 mt-5">
                <CardContent className="p-0 space-y-4">
                  {ficheTechniqueTitle && <h2 className='font-bold text-base'>{ficheTechniqueTitle}</h2>}
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2 mt-2"
                  >
                    <a
                      href={`/api/catalogues/${ficheTechniqueId}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center"
                    >
                      <FiDownload className="h-3 w-3" />
                      <span>Télécharger la fiche technique</span>
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })()}
          <div className='flex flex-col gap-2'>
            <p className='font-bold text-base text-grey-600'>Description:</p>
            <div
              className='p-medium-16 lg:p-regular-18'
              dangerouslySetInnerHTML={{
                __html: product.description && !product.description.includes("ne erreur inattendue s'est produite")
                  ? product.description
                  : "Aucune description n'est disponible pour le moment."
              }}
            />
          </div>
        </div>
        <div>
          <Card>
            <CardContent className='p-4 flex flex-col gap-4'>
              <ProductPrice price={displayPrice} />
              {allAttributesSelected && (
                availableStock > 0 ? (
                  <div className='text-green-700 text-xl'>
                    {`${STOCK_TEXT} ${availableStock}`}
                  </div>
                ) : (
                  <div className='text-destructive text-xl'>{OUT_OF_STOCK_TEXT}</div>
                )
              )}
            </CardContent>
            {allAttributesSelected && availableStock > 0 && (
              <div className='flex justify-center items-center'>
                <AddToCart
                  item={{
                    clientId: generateId(),
                    product: product._id,
                    name: product.name,
                    slug: product.slug,
                    categories: [product.categories[0]],
                    image: matchingVariant?.image || product.images[0],
                    price: round2(displayPrice),
                    countInStock: availableStock,
                    attributes: formattedSelectedAttributes,
                    variantId: matchingVariant._id,
                    quantity: 1,
                  }}
                  disabled={!allAttributesSelected || availableStock <= 0}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
      <section className='mt-10'>
        <ProductSlider
          products={relatedProducts}
          title={`Meilleures ventes dans ${product.categories[0]?.name || 'cette catégorie'}`}
        />
      </section>
    </section>
  );
} 