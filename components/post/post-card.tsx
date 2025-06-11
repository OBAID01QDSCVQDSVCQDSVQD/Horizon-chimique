'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Heart, MessageCircle, Share2, X, ChevronLeft, ChevronRight, Pencil, Trash2, Send, Smile, Gift, MoreVertical, Edit } from 'lucide-react'
import { toast } from 'sonner'
import React from 'react'
import { GiphyFetch } from '@giphy/js-fetch-api'
import { Grid } from '@giphy/react-components'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { marked } from 'marked'
import { useRouter, usePathname } from 'next/navigation'

interface Post {
  _id: string
  userId: {
    _id: string
    name: string
    image: string
    email: string
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

interface PostCardProps {
  post: Post
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
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const commentInputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const [showOptions, setShowOptions] = useState(false)
  const optionsRef = useRef<HTMLDivElement>(null)
  const [editDescription, setEditDescription] = useState(post.description)
  const [timeAgo, setTimeAgo] = useState('')
  const [htmlDescription, setHtmlDescription] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  const isAuthor = session?.user?.email === post.userId.email
  const postDate = new Date(post.createdAt)
  const now = new Date()
  const hoursDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)
  const canEdit = isAuthor && hoursDiff <= 24
  const canDelete = isAuthor && hoursDiff <= 24

  const isWithin24Hours = useMemo(() => {
    const postDate = new Date(post.createdAt)
    const now = new Date()
    const diffInHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)
    return diffInHours <= 24
  }, [post.createdAt])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

  useEffect(() => {
    const updateTimeAgo = () => {
      const formattedTime = formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: true,
        locale: fr
      })
      setTimeAgo(formattedTime)
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 60000) // تحديث كل دقيقة

    return () => clearInterval(interval)
  }, [post.createdAt])

  useEffect(() => {
    const desc = showFullDescription
      ? post.description
      : post.description.split(' ').slice(0, 60).join(' ') + (post.description.split(' ').length > 60 ? '...' : '')
    const result = marked(desc)
    if (result instanceof Promise) {
      result.then(setHtmlDescription)
    } else {
      setHtmlDescription(result as string)
    }
  }, [post.description, showFullDescription])

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

  const refreshComments = async () => {
    const response = await fetch(`/api/posts/${post._id}`)
    if (response.ok) {
      const fullPost = await response.json()
      setComments(fullPost.comments)
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
        await refreshComments()
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
    const url = `${window.location.origin}/posts/${post._id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: authorName,
          text: post.description.substring(0, 100),
          url,
        })
      } catch (e) {
        // المستخدم أغلق نافذة المشاركة
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Lien de la publication copié')
      } catch (error) {
        toast.error('Erreur lors de la copie du lien')
      }
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
        await refreshComments()
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
        await refreshComments()
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

  const maxGridImages = 4;
  const showPlus = post.imageUrls.length > maxGridImages;
  const gridImages = showPlus ? post.imageUrls.slice(0, maxGridImages) : post.imageUrls;

  const isLongDescription = post.description.split(/\r?\n| /).length > 30 || post.description.length > 200

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete post')
      window.location.href = '/posts'
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('حدث خطأ أثناء حذف المنشور')
    }
  }

  const handleEdit = async () => {
    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: editDescription }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update post')
      }

      const updatedPost = await response.json()
      // تحديث البوست في الواجهة
      window.location.reload()
    } catch (error) {
      console.error('Error updating post:', error)
      toast.error('حدث خطأ أثناء تعديل المنشور')
    }
  }

  const goToPost = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    router.push(`/posts/${post._id}`);
  };

  const handleAfficherTout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pathname.startsWith('/posts')) {
      setShowFullDescription(true);
    } else {
      goToPost();
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${post.userId._id}`}>
              {post.userId.image ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={post.userId.image}
                    alt={post.userId.name || 'User'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shadow-md"
                  style={{ background: stringToColor(post.userId.name), color: '#fff' }}
                >
                  {post.userId.name?.substring(0, 2).toUpperCase()}
                </div>
              )}
            </Link>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {post.userId.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {timeAgo}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {isAuthor && (
              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showOptions && (
                  <div
                    ref={optionsRef}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10"
                  >
                    {canEdit && (
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        Modifier
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="mb-4 cursor-pointer" onClick={goToPost}>
            <p
              className={`text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line ${!showFullDescription ? 'line-clamp-4' : ''}`}
              dangerouslySetInnerHTML={{ __html: htmlDescription }}
            />
            {isLongDescription && !showFullDescription && (
              <button
                type="button"
                className="text-[#00AEEF] hover:underline text-sm mt-1 font-semibold"
                onClick={handleAfficherTout}
              >Afficher tout</button>
            )}
          </div>

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
                  onClick={(e) => {
                    if (pathname.startsWith('/posts')) {
                      e.stopPropagation();
                      handleImageClick(idx);
                    } else {
                      goToPost();
                    }
                  }}
                >
                  <Image
                    src={url}
                    alt={`Image de la publication ${idx + 1}`}
                    fill
                    className="object-cover hover:opacity-90 transition-opacity duration-200"
                  />
                  {showPlus && idx === maxGridImages - 1 && (
                    <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/40">
                      <span className="text-blue-900 text-3xl font-bold drop-shadow">+{post.imageUrls.length - maxGridImages}</span>
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
            <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 cursor-pointer" onClick={goToPost}>
              <MessageCircle />
              <span>{comments.length}</span>
            </div>
          </div>

          <form onSubmit={handleComment} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 mt-2 mb-4 shadow-inner">
            <div className="flex-shrink-0">
              {session?.user?.image ? (
                <Image src={session.user.image} alt={session.user.name || ''} width={36} height={36} className="rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#00AEEF] flex items-center justify-center text-white font-bold text-lg">{session?.user?.name?.substring(0,2).toUpperCase() || '?'}</div>
              )}
            </div>
            <input
              ref={commentInputRef}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={`Commenter en tant que ${session?.user?.name || ''}`}
              className="flex-1 bg-transparent outline-none border-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-2 py-2"
            />
            <div className="flex gap-1 text-gray-400 dark:text-gray-500 relative">
              <div className="relative">
                <button type="button" tabIndex={-1} onClick={() => { setShowEmojiPicker(v => !v); }}>
                  <Smile className="w-5 h-5" />
                </button>
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="fixed z-50"
                    style={{
                      top: '80px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 350,
                      maxWidth: '95vw',
                      borderRadius: 16,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                      background: 'var(--background, #222)'
                    }}
                  >
                    <Picker
                      data={data}
                      locale="fr"
                      theme="auto"
                      onEmojiSelect={(emoji: any) => {
                        setComment(comment + emoji.native)
                        setShowEmojiPicker(false)
                        commentInputRef.current?.focus()
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <button type="submit" className="ml-2 p-2 rounded-full bg-[#00AEEF] hover:bg-cyan-600 text-white transition">
              <Send className="w-5 h-5" />
            </button>
          </form>

          <button
            className="text-[#00AEEF] hover:underline font-semibold mb-2"
            onClick={() => setShowComments(v => !v)}
          >
            {showComments ? 'Masquer les commentaires' : `Commentaires (${comments.length})`}
          </button>
          {showComments && (
            <div className="space-y-2 mt-2">
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
          )}
        </div>
      </div>

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

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Modifier la publication</h3>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 min-h-[100px]"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 