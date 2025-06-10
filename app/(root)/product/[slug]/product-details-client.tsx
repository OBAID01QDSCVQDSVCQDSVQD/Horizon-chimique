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
import { generateId, round2 } from '@/lib/utils';

// نصوص فرنسية
const STOCK_TEXT = 'Stock disponible :';
const OUT_OF_STOCK_TEXT = 'Rupture de stock';

export default function ProductDetailsClient({ product, relatedProducts }: { product: any, relatedProducts: any[] }) {
  // Group attributes by name
  const grouped: Record<string, string[]> = {};
  product.attributes?.forEach((attr: any) => {
    const attrName = (attr.attribute && typeof attr.attribute === 'object' && 'name' in attr.attribute)
      ? (attr.attribute as any).name
      : attr.attribute;
    if (!grouped[attrName]) grouped[attrName] = [];
    if (!grouped[attrName].includes(attr.value)) grouped[attrName].push(attr.value);
  });

  // State for selected values
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    Object.entries(grouped).forEach(([attrName, values]) => {
      if (values.length === 1) {
        defaults[attrName] = values[0];
      }
    });
    return defaults;
  });

  // Find matching variant
  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    return product.variants.find((variant: any) =>
      variant.options.every((opt: any) => {
        // Find attribute name by id
        const attrObj = product.attributes.find((a: any) => {
          if (a.attribute && typeof a.attribute === 'object' && a.attribute._id) {
            return a.attribute._id === opt.attributeId;
          }
          return a.attribute === opt.attributeId;
        });
        const attrName = attrObj && attrObj.attribute && typeof attrObj.attribute === 'object' && 'name' in attrObj.attribute
          ? attrObj.attribute.name
          : attrObj?.attribute;
        return selected[attrName] === opt.value;
      })
    );
  }, [selected, product]);

  // الكمية المتوفرة للفاريونت المطابق
  const availableStock = selectedVariant
    ? selectedVariant.stock
    : (product.countInStock ?? product.stock ?? 0);

  // لوج للتشخيص
  console.log('selectedVariant:', selectedVariant);
  console.log('availableStock:', availableStock);

  // Merge product images with selected attribute images (if any)
  const galleryImages = useMemo(() => {
    const images = [...(product.images || [])];
    // Add images from selected attributes if available
    product.attributes?.forEach((attr: any) => {
      const attrName = attr.attribute && typeof attr.attribute === 'object' && 'name' in attr.attribute
        ? attr.attribute.name
        : attr.attribute;
      if (selected[attrName] === attr.value && attr.image) {
        images.push(attr.image);
      }
    });
    // Add variant image if available
    if (selectedVariant?.image) {
      images.unshift(selectedVariant.image);
    }
    // فلترة الصور النهائية
    return Array.from(new Set(images)).filter(img => img && typeof img === 'string' && img.trim() !== "");
  }, [product, selected, selectedVariant]);

  // Price to display
  const displayPrice = selectedVariant?.price ?? product.price;

  // أضف هذا المتغير قبل return
  const allAttributesSelected = Object.entries(grouped).every(([attrName, values]) => selected[attrName]);

  return (
    <section>
      <AddToBrowsingHistory id={product._id} category={product.category} />
      <div className='grid grid-cols-1 md:grid-cols-5'>
        <div className='col-span-2'>
          <ProductGallery images={galleryImages} />
        </div>
        <div className='flex w-full flex-col gap-2 md:p-5 col-span-2'>
          <div className='flex flex-col gap-3'>
            <p className='p-medium-16 rounded-full bg-grey-500/10 text-grey-500'>
              Brand {product.brand} {product.category}
            </p>
            <h1 className='font-bold text-lg lg:text-xl'>{product.name}</h1>
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
          </div>
          <div>
            <SelectVariant
              product={product}
              selected={selected}
              setSelected={setSelected}
            />
          </div>
          <Separator className='my-2' />
          <div className='flex flex-col gap-2'>
            <p className='p-bold-20 text-grey-600'>Description:</p>
            <div className='p-medium-16 lg:p-regular-18' dangerouslySetInnerHTML={{ __html: product.description }} />
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
                    category: product.category,
                    price: round2(displayPrice),
                    quantity: 1,
                    image: galleryImages[0],
                    countInStock: availableStock,
                    attributes: Object.entries(selected).map(([attribute, value]) => ({ attribute, value })),
                  }}
                  disabled={!allAttributesSelected || availableStock === 0}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
      <section className='mt-10'>
        <ProductSlider
          products={relatedProducts}
          title={`Best Sellers in ${product.category}`}
        />
      </section>
    </section>
  );
} 