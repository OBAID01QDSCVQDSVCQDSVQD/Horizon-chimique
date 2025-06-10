'use client'

import * as React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import ProductCard from './product-card'
import { IProduct } from '@/lib/db/models/product.model'
import Autoplay from 'embla-carousel-autoplay'

export default function ProductSlider({
  title,
  products,
  hideDetails = false,
}: {
  title?: string
  products: IProduct[]
  hideDetails?: boolean
}) {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: false })
  )
  return (
    <div className='w-full bg-background'>
      <h2 className='text-xl md:text-2xl font-extrabold mb-5 text-gray-900 dark:text-white'>{title}</h2>
      <Carousel opts={{ align: 'start' }} className='w-full' plugins={[plugin.current]}>
        <CarouselContent>
          {products.map((product, idx) => (
            <CarouselItem
              key={product._id || product.slug || idx}
              className={
                hideDetails
                  ? 'md:basis-1/4 lg:basis-1/6'
                  : 'md:basis-1/3 lg:basis-1/5'
              }
            >
              <ProductCard
                hideDetails={hideDetails}
                hideAddToCart
                hideBorder
                product={product}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className='left-0' />
        <CarouselNext className='right-0' />
      </Carousel>
    </div>
  )
} 