import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/auth'
import Post from '@/lib/db/models/post.model'
import { connectToDatabase } from '@/lib/db'

// GET /api/posts - الحصول على جميع البوستات
export async function GET() {
  try {
    await connectToDatabase()
    
    // First, get all posts
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .lean()

    // Then, populate user data for each post
    const populatedPosts = await Promise.all(posts.map(async (post) => {
      const populatedPost = await Post.findById(post._id)
        .populate({
          path: 'userId',
          select: 'name image email',
          model: 'User'
        })
        .populate({
          path: 'comments.userId',
          select: 'name image email',
          model: 'User'
        })
        .lean()

      if (populatedPost) {
        console.log('Populated post data:', {
          postId: populatedPost._id,
          userId: populatedPost.userId,
          userName: (populatedPost.userId as any)?.name
        });
      }

      return populatedPost;
    }));

    return NextResponse.json(populatedPosts.filter(Boolean))
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// POST /api/posts - إنشاء بوست جديد
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { description, imageUrls } = await request.json()
    if (!description || !imageUrls || !imageUrls.length) {
      return NextResponse.json(
        { error: 'Description and images are required' },
        { status: 400 }
      )
    }

    await connectToDatabase()
    const post = await Post.create({
      userId: session.user.id,
      description,
      imageUrls,
      likes: [],
      comments: []
    })

    // Populate user data before sending response
    const populatedPost = await Post.findById(post._id)
      .populate({
        path: 'userId',
        select: 'name image email',
        model: 'User'
      })
      .lean()

    return NextResponse.json(populatedPost)
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 