import { z } from 'zod'
import { formatNumberWithDecimal } from './utils'

// Common
const Price = (field: string) =>
  z.coerce
    .number()
    .refine(
      (value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(value)),
      `${field} must have exactly two decimal places (e.g., 49.99)`
    )

const AttributeSchema = z.object({
  attributeId: z.string(),
  values: z.array(z.string())
})

export const ProductInputSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').optional(),
  slug: z.string().min(3, 'Slug must be at least 3 characters').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  images: z.array(z.string()).min(1, 'Product must have at least one image').optional(),
  brand: z.string().min(1, 'Brand is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  isPublished: z.boolean().optional(),
  price: Price('Price').optional(),
  listPrice: Price('List price').optional(),
  countInStock: z.coerce
    .number()
    .int()
    .nonnegative('count in stock must be a non-negative number')
    .optional(),
  tags: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  attributes: z.array(AttributeSchema).optional(),
  variants: z.array(z.object({
    options: z.array(z.object({
      attributeId: z.string(),
      value: z.string()
    })),
    price: z.string().optional(),
    image: z.string().optional(),
    numSales: z.number().default(0)
  })).optional(),
  avgRating: z.coerce
    .number()
    .min(0, 'Average rating must be at least 0')
    .max(5, 'Average rating must be at most 5')
    .optional(),
  numReviews: z.coerce
    .number()
    .int()
    .nonnegative('Number of reviews must be a non-negative number')
    .optional(),
  ratingDistribution: z
    .array(z.object({ rating: z.number(), count: z.number() }))
    .max(5)
    .optional(),
  reviews: z.array(z.string()).default([]),
  numSales: z.coerce
    .number()
    .int()
    .nonnegative('Number of sales must be a non-negative number')
    .optional(),
})

export const ProductUpdateSchema = ProductInputSchema.extend({
    _id: z.string(),
  })


// Order Item
export const OrderItemSchema = z.object({
  clientId: z.string().min(1, 'clientId is required'),
  product: z.string().min(1, 'Product is required'),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z
    .number()
    .int()
    .nonnegative('Quantity must be a non-negative number'),
  countInStock: z
    .number()
    .int()
    .nonnegative('Quantity must be a non-negative number'),
  image: z.string().min(1, 'Image is required'),
  price: Price('Price'),
  size: z.string().optional(),
  color: z.string().optional(),
})

export const CartSchema = z.object({
  items: z
    .array(OrderItemSchema)
    .min(1, 'Order must contain at least one item'),
  itemsPrice: z.number(),

  taxPrice: z.optional(z.number()),
  shippingPrice: z.optional(z.number()),
  totalPrice: z.number(),
  paymentMethod: z.optional(z.string()),
  deliveryDateIndex: z.optional(z.number()),
  expectedDeliveryDate: z.optional(z.date()),
})

// USER
const UserName = z
  .string()
  .min(2, { message: 'Username must be at least 2 characters' })
  .max(50, { message: 'Username must be at most 30 characters' })
const Email = z.string().min(1, 'Email is required').email('Email is invalid')
const Password = z.string().min(3, 'Password must be at least 3 characters')
const UserRole = z.string().min(1, 'role is required')

export const UserInputSchema = z.object({
  name: UserName,
  email: Email,
  profileImage: z.string().optional(),
  companyLogo: z.string().optional(),
  emailVerified: z.boolean(),
  role: UserRole,
  password: Password,
  whatsapp: z.string().min(8, 'WhatsApp number is required').regex(/^(\+|0)[0-9]{8,}$/,'Invalid WhatsApp number'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  company: z.string().optional(),
  address: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'Province is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    phone: z.string().min(1, 'Phone number is required'),
  }),
  matriculeFiscale: z.string().optional(),
  website: z.string().optional(),
  socialMedia: z.string().optional(),
})

export const UserSignInSchema = z.object({
  email: Email,
  password: Password,
})

export const UserSignUpSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: Email,
  password: Password,
  confirmPassword: z.string().min(3, 'Confirm password is required'),
  whatsapp: z.string().min(8, 'WhatsApp number is required').regex(/^(\+|0)[0-9]{8,}$/,'Invalid WhatsApp number'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});