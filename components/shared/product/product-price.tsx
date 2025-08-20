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

  // حساب نسبة الخصم
  const discountPercent = baseListPrice && basePrice
    ? Math.round(100 - (basePrice / baseListPrice) * 100)
    : listPrice > 0 ? Math.round(100 - (price / listPrice) * 100) : 0

  return plain ? (
    <PriceDisplay price={price} className={className} />
  ) : listPrice == 0 || listPrice <= price ? (
    <div className='space-y-2'>
      <div className={cn(!forListing ? 'text-5xl font-bold' : 'text-3xl', className)}>
        <PriceDisplay price={price} />
      </div>
      {!forListing && (
        <div className='text-muted-foreground text-base'>
          Prix actuel
        </div>
      )}
    </div>
  ) : !forListing ? (
    // عرض خاص لصفحة تفاصيل المنتج
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <span className='bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-xl font-bold'>
          -{discountPercent}%
        </span>
        <div className='text-6xl font-bold text-gray-900 dark:text-white'>
          <PriceDisplay price={price} />
        </div>
      </div>
      <div className='text-muted-foreground text-lg'>
        Prix catalogue: <span className='line-through'><PriceDisplay price={listPrice} /></span>
      </div>
    </div>
  ) : isDeal ? (
    <div className='space-y-3'>
      <div className='flex justify-center items-center gap-3'>
        <span className='bg-red-700 rounded-lg px-3 py-2 text-white text-base font-bold'>
          {discountPercent}% de réduction
        </span>
        <span className='text-red-700 text-sm font-bold'>
          Offre limitée
        </span>
      </div>
      <div className={`flex ${forListing ? 'justify-center' : 'flex-col'} items-center gap-3`}>
        <div className={cn('text-4xl font-bold', className)}>
          <PriceDisplay price={price} />
        </div>
        <div className='text-muted-foreground text-base py-2'>
          Était: <span className='line-through'><PriceDisplay price={listPrice} /></span>
        </div>
      </div>
    </div>
  ) : (
    <div className='space-y-3'>
      <div className='flex items-center gap-4'>
        <span className='bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-base font-bold'>
          -{discountPercent}%
        </span>
        <div className={cn('text-4xl font-bold', className)}>
          <PriceDisplay price={price} />
        </div>
      </div>
      <div className='text-muted-foreground text-base'>
        Prix catalogue: <span className='line-through'><PriceDisplay price={listPrice} /></span>
      </div>
    </div>
  )
}

export default ProductPrice 