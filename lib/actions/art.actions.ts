import { connectToDatabase } from '@/lib/db'
import { ObjectId } from 'mongodb'

export async function getCartByUserId(userId: string) {
  const db = await connectToDatabase()
  // إذا كنت تستخدم mongoose models:
  // return await CartModel.findOne({ userId: new ObjectId(userId) })

  // إذا كنت تريد استخدام mongoose.connection مباشرة:
  return await db.connection.collection('carts').findOne({ userId: new ObjectId(userId) })
}
