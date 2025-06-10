import { getServerSession } from 'next-auth'
import { authConfig } from '@/auth'
import PostCard from '@/components/post/post-card'
import Link from 'next/link'
import { Plus } from 'lucide-react'

async function getPosts() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/posts`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Échec de la récupération des publications')
  }
  return response.json()
}

export default async function PostsPage() {
  const session = await getServerSession(authConfig)
  const posts = await getPosts()

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Publications</h1>
        {session ? (
          <Link
            href="/posts/create"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Créer une nouvelle publication</span>
          </Link>
        ) : (
          <Link
            href="/auth/signin"
            className="text-blue-500 hover:text-blue-600"
          >
            Connectez-vous pour publier
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Aucune publication pour le moment</p>
          {session && (
            <Link
              href="/posts/create"
              className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Soyez le premier à publier
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <PostCard
              key={post._id}
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
                  throw new Error('Échec de l\'ajout du commentaire')
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
} 