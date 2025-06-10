import useCartStore from '@/hooks/use-cart-store'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import { Button, buttonVariants } from '../ui/button'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { TrashIcon } from 'lucide-react'
import ProductPrice from './product/product-price'
import { FREE_SHIPPING_MIN_PRICE } from '@/lib/constants'
import styles from './cart-sidebar.module.css'
import { useRouter } from 'next/navigation'

export default function CartSidebar({ onClose }: { onClose?: () => void }) {
  const {
    cart: { items, itemsPrice },
    updateItem,
    removeItem,
  } = useCartStore()
  const router = useRouter()

  return (
    <div className='w-80 max-w-xs'>
      <div className='fixed right-0 top-16 h-[calc(100vh-4rem)] border-l bg-white dark:bg-gray-900 shadow-lg z-50 flex flex-col overflow-y-auto transition-all duration-300'>
        <div className='p-4 flex-1 flex flex-col gap-2 justify-start items-center text-black dark:text-white'>
          {onClose && (
            <button onClick={onClose} className='mb-4 p-2 bg-red-600 hover:bg-red-700 rounded w-full font-bold text-white transition'>
              Close
            </button>
          )}
          <ScrollArea className='flex-1  w-full'>
            {items.map((item) => (
              <div key={item.clientId}>
                <div className='my-3'>
                  <Link href={`/product/${item.slug}`}>
                    <div className='relative h-24'>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes='20vw'
                        className='object-contain'
                      />
                    </div>
                  </Link>
                  <div className='text-sm text-center font-bold'>
                    <ProductPrice price={item.price} plain />
                  </div>
                  <div className='flex gap-2 mt-2'>
                    <input
                      type="number"
                      min={1}
                      max={item.countInStock}
                      value={item.quantity}
                      onChange={e => {
                        const val = Number(e.target.value)
                        if (val >= 1 && val <= item.countInStock) {
                          updateItem(item, val)
                        }
                      }}
                      className="w-16 text-center border border-gray-600 dark:border-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-600 rounded font-bold text-xs ml-1 h-8 transition bg-white dark:bg-gray-800 dark:text-white"
                    />
                    <Button
                      variant={'outline'}
                      size={'sm'}
                      onClick={() => {
                        removeItem(item)
                      }}
                      className='border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 transition'
                    >
                      <TrashIcon className='w-4 h-4 text-red-600' />
                    </Button>
                  </div>
                </div>
                <Separator />
              </div>
            ))}
          </ScrollArea>
          <div className='text-center space-y-2 mt-4'>
            <div className='flex items-center justify-between text-lg font-bold mb-2 text-black dark:text-white'>
              <span>Subtotal</span>
              <span className='ml-2 text-green-700 dark:text-green-400'>
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>
            {itemsPrice > FREE_SHIPPING_MIN_PRICE && (
              <div className='text-center text-xs text-black dark:text-white'>
                Your order qualifies for FREE Shipping
              </div>
            )}

            <Link
              href='/cart'
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'rounded-full hover:no-underline w-full bg-green-600 text-white hover:bg-green-700 border-green-600 transition font-bold'
              )}
              onClick={e => {
                e.preventDefault()
                if (onClose) onClose()
                router.push('/cart')
              }}
            >
              Go to Cart
            </Link>
            <Separator className='mt-3' />
          </div>

        </div>
      </div>
    </div>
  )
}