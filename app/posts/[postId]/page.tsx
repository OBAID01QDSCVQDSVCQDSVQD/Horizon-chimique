import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authConfig } from '@/auth'
import PostCard from '@/components/post/post-card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

async function getPost(postId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/posts/${postId}`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    if (response.status === 404) {
      notFound()
    }
    throw new Error('Failed to fetch post')
  }
  return response.json()
}

export default async function PostPage(props: any) {
  const { params } = props;
  const session = await getServerSession(authConfig)
  const post = await getPost(params.postId)

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto mb-4">
        <Link href="/posts" className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voir toutes les publications
        </Link>
      </div>
      <div className="max-w-2xl mx-auto">
        <PostCard
          post={post}
          onComment={async (postId: string, comment: string) => {
            'use server'
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL}/api/posts/${postId}`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ comment }),
              }
            )
            if (!response.ok) {
              throw new Error('Failed to add comment')
            }
          }}
        />
      </div>
    </div>
  )
} 