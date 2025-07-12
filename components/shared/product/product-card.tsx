import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import ImageHover from './image-hover'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { IProduct } from '@/lib/db/models/product.model'

import Rating from './rating'
import { formatNumber } from '@/lib/utils'
import ProductPrice from './product-price'

const ProductCard = ({
  product,
  hideBorder = false,
  hideDetails = false,
}: {
  product: IProduct
  hideDetails?: boolean
  hideBorder?: boolean
  hideAddToCart?: boolean
}) => {
  const validImages = product.images?.filter(img => img && typeof img === 'string' && img.trim() !== "") || []

  const ProductImage = () => (
    <Link href={`/product/${product.slug}`}>
      <div className='relative h-52'>
        {validImages.length > 1 ? (
          <ImageHover
            src={validImages[0]}
            hoverSrc={validImages[1]}
            alt={product.name}
          />
        ) : validImages.length === 1 ? (
          <div className='relative h-52'>
            <Image
              src={validImages[0]}
              alt={product.name}
              fill
              sizes='80vw'
              className='object-contain'
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400">Aucune image disponible</span>
          </div>
        )}
      </div>
    </Link>
  )
  const ProductDetails = () => (
    <div className='flex-1 space-y-2'>
      <p className='font-bold'>{product.brand}</p>
      <Link
        href={`/product/${product.slug}`}
        className='overflow-hidden text-ellipsis'
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {product.name}
      </Link>
      <div className='flex gap-2 justify-center'>
        <Rating rating={product.avgRating} />
        <span>({formatNumber(product.numReviews)})</span>
      </div>

      <ProductPrice
        isDeal={product.tags?.includes('todays-deal') ?? false}
        price={product.price}
        listPrice={product.listPrice}
        forListing
      />
    </div>
  )

  return hideBorder ? (
    <div className='flex flex-col'>
      <ProductImage />
      {!hideDetails && (
        <>
          <div className='p-3 flex-1 text-center'>
            <ProductDetails />
          </div>
        </>
      )}
    </div>
  ) : (
    <Card className='flex flex-col  '>
      <CardHeader className='p-3'>
        <ProductImage />
      </CardHeader>
      {!hideDetails && (
        <>
          <CardContent className='p-3 flex-1  text-center'>
            <ProductDetails />
          </CardContent>
        </>
      )}
    </Card>
  )
}

export default ProductCard 