import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authConfig } from '@/auth'
import CreatePostForm from '@/components/post/create-post-form'

export default async function CreatePostPage() {
  const session = await getServerSession(authConfig)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Créer une nouvelle publication</h1>
      <CreatePostForm />
    </div>
  )
} 