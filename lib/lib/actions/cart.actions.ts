import Cart from '@/lib/db/models/cart.model'
import { connectToDatabase } from '@/lib/db'

export async function getCartByUserId(userId: string) {
  await connectToDatabase()
  const cart = await Cart.findOne({ userId }).populate('items.product')
  return cart
}
