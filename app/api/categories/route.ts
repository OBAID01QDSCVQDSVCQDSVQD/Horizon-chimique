import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { Category } from '@/lib/db/models/category.model'

// Connect to MongoDB
const connectToDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not defined')
        throw new Error('MONGODB_URI is not defined')
      }
      console.log('Connecting to MongoDB...')
      await mongoose.connect(process.env.MONGODB_URI)
      console.log('Connected to MongoDB successfully')
    } else {
      console.log('Already connected to MongoDB')
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    throw error
  }
}

export async function GET() {
  console.log('GET /api/categories called')
  try {
    await connectToDB()
    console.log('Fetching categories...')
    
    const categories = await Category.find({})
      .sort({ name: 1 })
      .lean()
      .exec()
    
    console.log('Categories fetched:', categories)
    
    // Always return an array, even if empty
    return NextResponse.json(categories || [])
    
  } catch (error) {
    console.error('Error in GET /api/categories:', error)
    // Return a proper error response
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

export async function POST(request: Request) {
  console.log('POST /api/categories called')
  try {
    await connectToDB()
    const body = await request.json()
    console.log('Received category data:', body)
    
    if (!body.name) {
      console.log('Category name is missing')
      return new NextResponse(
        JSON.stringify({ error: 'Category name is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const category = await Category.create(body)
    console.log('Category created:', category)
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/categories:', error)
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to create category',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
