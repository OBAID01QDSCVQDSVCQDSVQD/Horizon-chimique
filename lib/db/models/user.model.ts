import { IUserInput } from '@/types'
import {
  Document,
  // InferSchemaType,
  Model,
  model,
  models,
  Schema,
} from 'mongoose'

export type UserRole = 'ADMIN' | 'USER' | 'EDITOR' | 'APPLICATEUR'

export interface IUser extends Document, IUserInput {
  _id: string
  createdAt: Date
  updatedAt: Date
  role: UserRole
  phone?: string
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { 
      type: String, 
      required: true, 
      enum: ['ADMIN', 'USER', 'EDITOR', 'APPLICATEUR'],
      default: 'USER' 
    },
    password: { type: String },
    profileImage: { type: String },
    emailVerified: { type: Boolean, default: false },
    whatsapp: { type: String },
    phone: { type: String },
    bio: { type: String },
    company: { type: String },
    companyLogo: { type: String },
    address: { type: String },
    matriculeFiscale: { type: String, required: false },
    website: { type: String, required: false },
    socialMedia: { type: String, required: false },
  },
  {
    timestamps: true,
  }
)

const User = (models.User as Model<IUser>) || model<IUser>('User', userSchema)

export default User