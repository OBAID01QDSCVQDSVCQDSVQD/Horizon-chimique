// lib/actions/cart.actions.ts
import { connectToDatabase } from '@/lib/db'
import Cart from '@/lib/db/models/cart.model'

export async function getCartByUserId(userId: string) {
  await connectToDatabase()

  const cart = await Cart.findOne({ userId }).populate('items.product') // جلب تفاصيل المنتج
    .lean()

  return cart
}
