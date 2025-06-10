import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/auth'
import Post from '@/lib/db/models/post.model'
import { connectToDatabase } from '@/lib/db'

export async function DELETE(req: NextRequest, context: any) {
  await connectToDatabase()
  const session = await getServerSession(authConfig)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { index } = await req.json()
  if (typeof index !== 'number') return NextResponse.json({ error: 'Invalid index' }, { status: 400 })

  const postId = context?.params?.postId
  const post = await Post.findById(postId)
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const comment = post.comments[index]
  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })

  // Only author can delete
  if (!session.user || String(comment.userId) !== String(session.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  post.comments.splice(index, 1)
  await post.save()
  // Populate user info for comments
  await post.populate('comments.userId', 'name image email')
  return NextResponse.json({ comments: post.comments }, { status: 200 })
}

export async function PUT(req: NextRequest, context: any) {
  await connectToDatabase()
  const session = await getServerSession(authConfig)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { index, comment } = await req.json()
  if (typeof index !== 'number' || typeof comment !== 'string') {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const postId = context?.params?.postId
  const post = await Post.findById(postId)
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const oldComment = post.comments[index]
  if (!oldComment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })

  // Only author can edit
  if (!session.user || String(oldComment.userId) !== String(session.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  post.comments[index].comment = comment
  await post.save()
  // Populate user info for comments
  await post.populate('comments.userId', 'name image email')
  return NextResponse.json({ comments: post.comments }, { status: 200 })
} 