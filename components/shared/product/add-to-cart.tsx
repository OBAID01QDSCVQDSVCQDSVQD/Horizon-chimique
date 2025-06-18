/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useCartStore from '@/hooks/use-cart-store'
import { toast } from 'sonner'
import { OrderItem } from '@/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AddToCart({
  item,
  minimal = false,
  disabled = false,
}: {
  item: OrderItem
  minimal?: boolean
  disabled?: boolean
}) {
  const router = useRouter()
  const { addItem } = useCartStore()

  const [quantity, setQuantity] = useState(1)

  function generateCartItemId(item: any) {
    let key = item.product;
    if (item.variantId) key += `-variant:${item.variantId}`;
    if (item.color) key += `-color:${item.color}`;
    if (item.size) key += `-size:${item.size}`;
    if (item.attributes && Array.isArray(item.attributes)) {
      key += item.attributes
        .map((attr: any) => `-${attr.attribute}:${attr.value}`)
        .join('');
    }
    return key;
  }

  return minimal ? (
    <Button
      className='rounded-full w-auto'
      onClick={() => {
        try {
          const itemWithId = { ...item, clientId: generateCartItemId(item) };
          addItem(itemWithId, 1)
          toast('Added to Cart', {
            action: {
              label: 'Go to Cart',
              onClick: () => router.push('/cart'),
            },
          })
        } catch (error: any) {
          toast.error('Error', {
            description: error.message,
          })
        }
      }}
    >
      Add to Cart
    </Button>
  ) : (
    <div className='w-full space-y-2'>
      <Select
        value={quantity.toString()}
        onValueChange={(i) => setQuantity(Number(i))}
      >
        <SelectTrigger className=''>
          <SelectValue>Quantity: {quantity}</SelectValue>
        </SelectTrigger>
        <SelectContent position='popper'>
          {Array.from({ length: item.countInStock }).map((_, i) => (
            <SelectItem key={i + 1} value={`${i + 1}`}>
              {i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        className='rounded-full w-full'
        type='button'
        disabled={disabled}
        onClick={async () => {
          try {
            const itemWithId = { ...item, clientId: generateCartItemId(item) };
            const itemId = await addItem(itemWithId, quantity)
            router.push(`/cart`)
          } catch (error: any) {
            toast.error('Error', {
              description: error.message,
            })
          }
        }}
      >
        Add to Cart
      </Button>
      <Button
        variant='secondary'
        onClick={() => {
          try {
            const itemWithId = { ...item, clientId: generateCartItemId(item) };
            addItem(itemWithId, quantity)
            router.push(`/checkout`)
          } catch (error: any) {
            toast.error('Error', {
              description: error.message,
            })
          }
        }}
        className='w-full rounded-full '
      >
        Buy Now
      </Button>
    </div>
  )
}