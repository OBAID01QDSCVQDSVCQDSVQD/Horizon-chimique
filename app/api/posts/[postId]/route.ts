import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/auth'
import Post from '@/lib/db/models/post.model'
import { connectToDatabase } from '@/lib/db'
import { NextRequest } from 'next/server'

type RouteContext = {
  params: Promise<{ postId: string }>;
};

// GET /api/posts/[postId] - الحصول على بوست محدد
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase()
    const { postId } = await context.params;
    
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
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()
    const { postId } = await context.params;
    const post = await Post.findById(postId)
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
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { comment } = await req.json()
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()
    const { postId } = await context.params;
    console.log('Add comment to post:', postId, 'Comment:', comment)
    const post = await Post.findById(postId)
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

// DELETE /api/posts/[postId] - حذف بوست
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = await context.params;

    await connectToDatabase()
    const post = await Post.findById(postId)

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // التحقق من أن المستخدم هو صاحب البوست
    if (post.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // التحقق من الوقت (24 ساعة)
    const postDate = new Date(post.createdAt)
    const now = new Date()
    const diffInHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours > 24) {
      return NextResponse.json(
        { error: 'Cannot delete post after 24 hours' },
        { status: 400 }
      )
    }

    await Post.findByIdAndDelete(postId)
    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// PATCH /api/posts/[postId] - تحديث بوست جزئيا (مثلاً إضافة أو إزالة إعجاب)
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = await context.params;
    const body = await req.json();
    const { comment, like } = body;

    await connectToDatabase();
    const post = await Post.findById(postId);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Handle comments
    if (comment) {
      if (!Array.isArray(post.comments)) {
        post.comments = [];
      }
      post.comments.push({
        userId: session.user.id,
        comment,
        createdAt: new Date(),
      });
    }

    // Handle likes
    if (typeof like === 'boolean') {
      const userId = session.user.id;
      const hasLiked = post.likes.includes(userId);

      if (like && !hasLiked) {
        post.likes.push(userId);
      } else if (!like && hasLiked) {
        post.likes = post.likes.filter((id) => id !== userId);
      }
    }

    await post.save();
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as any)?.message },
      { status: 500 }
    );
  }
} 