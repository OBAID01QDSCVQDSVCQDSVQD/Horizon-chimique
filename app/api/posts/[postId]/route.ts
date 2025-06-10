import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/auth'
import Post from '@/lib/db/models/post.model'
import { connectToDatabase } from '@/lib/db'
import { NextRequest } from 'next/server'

// GET /api/posts/[postId] - الحصول على بوست محدد
export async function GET(req: NextRequest, context: any) {
  try {
    await connectToDatabase()
    const postId = context?.params?.postId
    
    const post = await Post.findById(postId)
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

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    console.log('Post data with user:', {
      postId: post._id,
      userId: post.userId,
      userName: (post.userId as any)?.name
    });

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// POST /api/posts/[postId] - إضافة أو إزالة إعجاب
export async function POST(req: NextRequest, context: any) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()
    const post = await Post.findById(context?.params?.postId)
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const userId = session.user.id
    const hasLiked = post.likes.includes(userId)

    if (hasLiked) {
      post.likes = post.likes.filter(id => id !== userId)
    } else {
      post.likes.push(userId)
    }

    await post.save()
    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating like:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// PUT /api/posts/[postId] - إضافة تعليق
export async function PUT(req: NextRequest, context: any) {
  try {
    const session = await getServerSession(authConfig)
    console.log('Session:', session)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { comment } = await req.json()
    console.log('Add comment to post:', context?.params?.postId, 'Comment:', comment)
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()
    const post = await Post.findById(context?.params?.postId)
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (!Array.isArray(post.comments)) {
      post.comments = []
    }

    post.comments.push({
      userId: session.user.id,
      comment,
      createdAt: new Date()
    })

    await post.save()
    return NextResponse.json(post)
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as any)?.message },
      { status: 500 }
    )
  }
} 