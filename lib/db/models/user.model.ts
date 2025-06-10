import { IUserInput } from '@/types'
import {
  Document,
  // InferSchemaType,
  Model,
  model,
  models,
  Schema,
} from 'mongoose'

export type UserRole = 'ADMIN' | 'USER' | 'EDITOR'

export interface IUser extends Document, IUserInput {
  _id: string
  createdAt: Date
  updatedAt: Date
  role: UserRole
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { 
      type: String, 
      required: true, 
      enum: ['ADMIN', 'USER', 'EDITOR'],
      default: 'USER' 
    },
    password: { type: String },
    image: { type: String },
    emailVerified: { type: Boolean, default: false },
    whatsapp: { type: String },
  },
  {
    timestamps: true,
  }
)

const User = (models.User as Model<IUser>) || model<IUser>('User', userSchema)

export default User