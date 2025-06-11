import { getServerSession } from 'next-auth'
import { authConfig } from '@/auth'
import PostCard from '@/components/post/post-card'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import React from 'react'
import AddPostButton from '@/components/post/AddPostButton'

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
    <div className="min-h-screen bg-[#f7fbfd] dark:bg-gray-900 flex flex-col items-center py-8 px-2">
      {/* Header */}
      <div className="w-full max-w-2xl flex flex-col items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#00AEEF] mb-2 tracking-tight">Actualités & Projets</h1>
        <p className="text-gray-500 dark:text-gray-300 text-base mb-4">Partagez vos idées, vos questions et vos expériences avec la communauté Horizon Chimique.</p>
      </div>
      {/* Floating Add Post Button */}
      <AddPostButton session={session} />
      {/* Posts List */}
      <div className="w-full max-w-2xl flex flex-col gap-8">
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
          posts.map((post: any) => (
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
          ))
        )}
      </div>
    </div>
  )
} 