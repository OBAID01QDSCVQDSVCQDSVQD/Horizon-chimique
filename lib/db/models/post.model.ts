import { Document, Model, model, models, Schema, Types } from 'mongoose'

export interface IPost extends Document {
  userId: Types.ObjectId | string
  description: string
  imageUrls: string[]
  likes: string[]
  comments: {
    userId: Types.ObjectId | string
    comment: string
    createdAt: Date
  }[]
  createdAt: Date
  updatedAt: Date
}

const postSchema = new Schema<IPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    imageUrls: [{ type: String, required: true }],
    likes: [{ type: String }],
    comments: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  {
    timestamps: true
  }
)

const Post = (models.Post as Model<IPost>) || model<IPost>('Post', postSchema)

export default Post 