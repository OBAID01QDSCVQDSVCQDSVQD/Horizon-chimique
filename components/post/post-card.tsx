'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Heart, MessageCircle, Share2, X, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import React from 'react'

interface PostCardProps {
  post: {
    _id: string
    userId: {
      name: string
      image: string
    }
    description: string
    imageUrls: string[]
    likes: string[]
    comments: {
      userId: string
      comment: string
      createdAt: string
    }[]
    createdAt: string
  }
  onComment: (postId: string, comment: string) => Promise<void>
}

function stringToColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  let color = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF
    color += ('00' + value.toString(16)).substr(-2)
  }
  return color
}

export default function PostCard({ post, onComment }: PostCardProps) {
  const { data: session } = useSession()
  const [isLiked, setIsLiked] = useState(post.likes.includes(session?.user?.id || ''))
  const [likesCount, setLikesCount] = useState(post.likes.length)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState(post.comments)
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [commentToEdit, setCommentToEdit] = useState<number | null>(null)
  const [editCommentValue, setEditCommentValue] = useState('')

  const handleLike = async () => {
    if (!session) {
      toast.error("Vous devez vous connecter d'abord")
      return
    }

    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        setIsLiked(!isLiked)
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
      }
    } catch (error) {
      toast.error('Une erreur s\'est produite lors de la mise à jour du like')
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      toast.error("Vous devez vous connecter d'abord")
      return
    }

    if (!comment.trim()) {
      toast.error('Veuillez écrire un commentaire')
      return
    }

    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
        credentials: 'include',
      })
      if (response.ok) {
        const updatedPost = await response.json()
        setComments(updatedPost.comments)
        setComment('')
        toast.success('Commentaire ajouté avec succès')
      } else {
        toast.error('Erreur lors de l\'ajout du commentaire')
      }
    } catch (error) {
      toast.error('Une erreur s\'est produite lors de l\'ajout du commentaire')
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/posts/${post._id}`)
      toast.success('Lien de la publication copié')
    } catch (error) {
      toast.error('Erreur lors de la copie du lien')
    }
  }

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index)
    setShowImageModal(true)
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % post.imageUrls.length)
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + post.imageUrls.length) % post.imageUrls.length)
  }

  // Delete comment handler
  const handleDeleteComment = async () => {
    if (commentToDelete === null) return
    try {
      const response = await fetch(`/api/posts/${post._id}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: commentToDelete }),
        credentials: 'include',
      })
      if (response.ok) {
        setComments(prev => prev.filter((_, idx) => idx !== commentToDelete))
        toast.success('تم حذف التعليق بنجاح')
      } else {
        toast.error('حدث خطأ أثناء حذف التعليق')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف التعليق')
    }
    setShowDeleteModal(false)
    setCommentToDelete(null)
  }

  // Edit comment handler
  const handleEditComment = async () => {
    if (commentToEdit === null) return
    try {
      const response = await fetch(`/api/posts/${post._id}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: commentToEdit, comment: editCommentValue }),
        credentials: 'include',
      })
      if (response.ok) {
        const updatedPost = await response.json()
        setComments(updatedPost.comments)
        toast.success('تم تعديل التعليق بنجاح')
      } else {
        toast.error('حدث خطأ أثناء تعديل التعليق')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تعديل التعليق')
    }
    setShowEditModal(false)
    setCommentToEdit(null)
    setEditCommentValue('')
  }

  const author = post.userId as any
  const authorName = typeof author === 'object' && author !== null
    ? author.name || author.email?.split('@')[0] || 'Utilisateur'
    : 'Utilisateur'
  const authorImage = typeof author === 'object' && author !== null ? author.image : undefined

  // Image grid logic
  const maxGridImages = 4;
  const showPlus = post.imageUrls.length > maxGridImages;
  const gridImages = showPlus ? post.imageUrls.slice(0, maxGridImages) : post.imageUrls;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className="relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-base shadow-md"
                style={{ background: authorImage ? undefined : stringToColor(authorName), color: '#fff' }}
              >
                {authorImage ? (
                  <Image
                    src={authorImage}
                    alt={`Photo de profil de ${authorName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span>{authorName.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-base text-gray-900 dark:text-gray-100">{authorName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
                </p>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
              title="Partager la publication"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <Link href={`/posts/${post._id}`} className="block">
            <p className="mb-4 text-gray-800 dark:text-gray-200">{post.description}</p>
          </Link>

          {/* Image Grid */}
          <div className="w-full mb-4">
            <div
              className={`grid gap-2 ${
                gridImages.length === 1
                  ? 'grid-cols-1'
                  : gridImages.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-2 grid-rows-2'
              }`}
            >
              {gridImages.map((url, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-lg overflow-hidden cursor-pointer h-48 ${
                    gridImages.length === 1
                      ? 'col-span-2 row-span-2 h-80'
                      : gridImages.length === 2
                      ? 'h-64'
                      : 'h-48'
                  }`}
                  onClick={() => handleImageClick(idx)}
                >
                  <Image
                    src={url}
                    alt={`Image de la publication ${idx + 1}`}
                    fill
                    className="object-cover hover:opacity-90 transition-opacity duration-200"
                  />
                  {showPlus && idx === maxGridImages - 1 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">+{post.imageUrls.length - maxGridImages}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors duration-200 ${
                isLiked ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
              }`}
            >
              <Heart className={isLiked ? 'fill-current' : ''} />
              <span>{likesCount}</span>
            </button>
            <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
              <MessageCircle />
              <span>{comments.length}</span>
            </div>
          </div>

          <form onSubmit={handleComment} className="space-y-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Écrivez un commentaire..."
              className="w-full p-2 border rounded-lg resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-200"
              rows={2}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200"
            >
              Commenter
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {comments.map((comment, index) => {
              const user = (typeof comment.userId === 'object' && comment.userId !== null) ? (comment.userId as any) : null;
              const avatarText = (user?.name || 'U')
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();
              const avatarColor = stringToColor(user?.name || user?._id || 'U');
              const isCurrentUser = session?.user?.email && user?.email && session.user.email === user.email;
              return (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex items-start gap-2 shadow-sm relative transition-colors duration-200">
                  {/* Action Icons */}
                  {isCurrentUser && (
                    <div className="flex gap-2 absolute top-2 right-2 z-10">
                      <button
                        title="Modifier"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 shadow hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200 cursor-pointer border border-gray-200 dark:border-gray-700"
                        style={{ fontSize: '0.9rem' }}
                        onClick={() => {
                          setShowEditModal(true)
                          setCommentToEdit(index)
                          setEditCommentValue(comment.comment)
                        }}
                      >
                        <Pencil className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        title="Supprimer"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 shadow hover:bg-red-100 dark:hover:bg-red-900 transition-colors duration-200 cursor-pointer border border-gray-200 dark:border-gray-700"
                        style={{ fontSize: '0.9rem' }}
                        onClick={() => {
                          setShowDeleteModal(true)
                          setCommentToDelete(index)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  )}
                  {/* Avatar & Content */}
                  <div
                    className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-md"
                    style={{ background: user?.image ? undefined : avatarColor, color: '#fff' }}
                  >
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name ? `Photo de profil de ${user.name}` : 'Photo de profil'}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      <span>{avatarText}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{user?.name || 'Utilisateur'}</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                      {comment.comment.split('\n').map((line, i, arr) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < arr.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors duration-200"
          >
            <X className="w-8 h-8" />
          </button>
          {post.imageUrls.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 text-white hover:text-gray-300 transition-colors duration-200"
              >
                <ChevronLeft className="w-12 h-12" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 text-white hover:text-gray-300 transition-colors duration-200"
              >
                <ChevronRight className="w-12 h-12" />
              </button>
            </>
          )}
          <div
            className="relative w-full h-full max-w-7xl max-h-[90vh] mx-4 flex items-center justify-center cursor-pointer"
            onClick={handleNextImage}
          >
            <Image
              src={post.imageUrls[currentImageIndex]}
              alt={`Image ${currentImageIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {post.imageUrls.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  idx === currentImageIndex ? 'bg-white' : 'bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Delete Comment Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col items-center">
            <p className="mb-4 text-lg text-gray-800 dark:text-gray-100 font-semibold">Êtes-vous sûr de vouloir supprimer ce commentaire ?</p>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={handleDeleteComment}
              >Oui, supprimer</button>
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => { setShowDeleteModal(false); setCommentToDelete(null); }}
              >Annuler</button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Comment Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col items-center">
            <p className="mb-4 text-lg text-gray-800 dark:text-gray-100 font-semibold">Modifier le commentaire</p>
            <textarea
              className="w-full p-2 border rounded-lg resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-200 mb-4"
              rows={3}
              value={editCommentValue}
              onChange={e => setEditCommentValue(e.target.value)}
            />
            <div className="flex gap-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleEditComment}
              >Enregistrer</button>
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => { setShowEditModal(false); setCommentToEdit(null); setEditCommentValue(''); }}
              >Annuler</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 