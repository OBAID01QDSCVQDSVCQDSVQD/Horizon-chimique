import mongoose, { Schema } from 'mongoose'

const cartSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [
    {
      product: { type: Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, required: true },
    }
  ],
}, { timestamps: true })

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema)
export default Cart
