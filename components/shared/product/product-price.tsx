'use client'
import { cn } from '@/lib/utils'
import { PriceDisplay } from '@/components/shared/price-display'

const ProductPrice = ({
  price,
  className,
  listPrice = 0,
  isDeal = false,
  forListing = true,
  plain = false,
  basePrice,
  baseListPrice,
}: {
  price: number | undefined | null
  isDeal?: boolean
  listPrice?: number
  className?: string
  forListing?: boolean
  plain?: boolean
  basePrice?: number
  baseListPrice?: number
}) => {
  if (price === undefined || price === null || isNaN(Number(price))) {
    return <span className={className}>Non disponible</span>;
  }

  // For the new product page design, we want a cleaner display
  if (!forListing) {
    return (
      <div className='text-4xl font-bold text-gray-900 dark:text-white'>
        {price.toFixed(2)} DT
      </div>
    );
  }

  const discountPercent = baseListPrice && basePrice
    ? Math.round(100 - (basePrice / baseListPrice) * 100)
    : Math.round(100 - (price / listPrice) * 100)

  return plain ? (
    <PriceDisplay price={price} className={className} />
  ) : listPrice == 0 ? (
    <div className={cn('text-3xl', className)}>
      <PriceDisplay price={price} />
    </div>
  ) : isDeal ? (
    <div className='space-y-2'>
      <div className='flex justify-center items-center gap-2'>
        <span className='bg-red-700 rounded-sm p-1 text-white text-sm font-semibold'>
          {discountPercent}% de réduction
        </span>
        <span className='text-red-700 text-xs font-bold'>
          Offre limitée
        </span>
      </div>
      <div className={`flex ${forListing && 'justify-center'} items-center gap-2`}>
        <div className={cn('text-3xl', className)}>
          <PriceDisplay price={price} />
        </div>
        <div className='text-muted-foreground text-xs py-2'>
          Était: <span className='line-through'><PriceDisplay price={listPrice} /></span>
        </div>
      </div>
    </div>
  ) : (
    <div className=''>
      <div className='flex justify-center gap-3'>
        <div className='text-3xl text-orange-700'>-{discountPercent}%</div>
        <div className={cn('text-3xl', className)}>
          <PriceDisplay price={price} />
        </div>
      </div>
      <div className='text-muted-foreground text-xs py-2'>
        Prix catalogue: <span className='line-through'><PriceDisplay price={listPrice} /></span>
      </div>
    </div>
  )
}

export default ProductPrice 