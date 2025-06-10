'use client'

import { useSession } from 'next-auth/react'
import useCartStore from '@/hooks/use-cart-store'
import ProductPrice from '@/components/shared/product/product-price'
import CheckoutClient from './checkout-client'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const {
    cart: { items, itemsPrice },
  } = useCartStore()
  const router = useRouter()

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <CheckoutClient />
  )
}

