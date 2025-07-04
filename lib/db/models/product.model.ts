import { Document, Model, model, models, Schema } from 'mongoose'
import { IProductInput } from '@/types'
import mongoose from 'mongoose'

export interface IProduct extends Document {
  _id: string
  name: string
  slug: string
  categories: mongoose.Types.ObjectId[]
  images: string[]
  brand: string
  description: string
  price: number
  listPrice: number
  countInStock: number
  tags?: string[]
  attributes?: {
    attribute: mongoose.Types.ObjectId
    value: string
    image?: string
    price?: number
  }[]
  variants?: {
    options: {
      attributeId: mongoose.Types.ObjectId
      value: string
    }[]
    price?: number
    image?: string
    stock: number
    numSales: number
  }[]
  avgRating: number
  numReviews: number
  ratingDistribution?: { rating: number; count: number }[]
  numSales: number
  isPublished: boolean
  reviews?: any[]
  createdAt: Date
  updatedAt: Date
  ficheTechnique?: mongoose.Types.ObjectId | string;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String },
    slug: { type: String, unique: true },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    images: [String],
    brand: { type: String },
    description: { type: String, trim: true },
    price: { type: Number },
    listPrice: { type: Number },
    countInStock: { type: Number },
    tags: { type: [String], default: ['new-arrival'] },
    attributes: [
      {
        attribute: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Attribute',
        },
        value: { type: String },
        image: { type: String },
        price: { type: Number },
      },
    ],
    variants: [
      {
        options: [
          {
            attributeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attribute' },
            value: { type: String },
          },
        ],
        price: { type: Number },
        image: { type: String },
        stock: { type: Number },
        numSales: { type: Number, default: 0 },
      },
    ],
    avgRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    ratingDistribution: [
      {
        rating: { type: Number },
        count: { type: Number },
      },
    ],
    numSales: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review', default: [] }],
    ficheTechnique: { type: mongoose.Schema.Types.ObjectId, ref: 'Catalogue' },
  },
  {
    timestamps: true,
    validateBeforeSave: false
  }
)

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

// Only create the model if we're not in a browser environment
const Product: Model<IProduct> = (models.Product as Model<IProduct>) || model<IProduct>('Product', productSchema)

export default Product