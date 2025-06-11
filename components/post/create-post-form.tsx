'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { CldUploadButton } from 'next-cloudinary'
import { Image as ImageIcon, Loader2, X, Smile, Bold } from 'lucide-react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

export default function CreatePostForm() {
  const router = useRouter()
  const { data: session } = useSession()
  const [description, setDescription] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      toast.error("Vous devez vous connecter d'abord")
      return
    }

    if (!description.trim()) {
      toast.error('Veuillez écrire une description pour la publication')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          imageUrls,
        }),
      })

      if (!response.ok) {
        throw new Error('Échec de la création de la publication')
      }

      toast.success('Publication créée avec succès')
      router.push('/posts')
      router.refresh()
    } catch (error) {
      toast.error("Une erreur s'est produite lors de la création de la publication")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = (result: any) => {
    const urls = Array.isArray(result.info)
      ? result.info.map((img: any) => img.secure_url)
      : [result.info.secure_url]
    setImageUrls((prev) => [...prev, ...urls])
    toast.success('Image(s) téléchargée(s) avec succès')
  }

  const removeImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx))
  }

  const insertEmoji = (emoji: any) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = description.substring(0, start)
    const after = description.substring(end)
    setDescription(before + emoji.native + after)
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + emoji.native.length
    }, 0)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

  console.log('Nom du cloud :', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-6 border border-gray-100"
    >
      <h2 className="text-2xl font-bold text-center mb-2 text-blue-700">Créer une nouvelle publication</h2>
      <div className="relative">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(v => !v)}
            className="p-2 rounded-full hover:bg-blue-100 text-gray-500 hover:text-blue-500 transition"
            tabIndex={-1}
            aria-label="Ajouter un emoji"
          >
            <Smile className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => {
              const textarea = textareaRef.current;
              if (!textarea) return;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const before = description.substring(0, start);
              const selected = description.substring(start, end);
              const after = description.substring(end);
              setDescription(before + '**' + selected + '**' + after);
              setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = end + 4;
              }, 0);
            }}
            className="p-2 rounded-full hover:bg-blue-100 text-gray-500 hover:text-blue-500 transition"
            tabIndex={-1}
            aria-label="Gras"
          >
            <Bold className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <textarea
            id="description"
            ref={textareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition resize-none min-h-[100px] bg-gray-50"
            rows={4}
            placeholder="Écrivez la description de votre publication..."
          />
        </div>
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
              onEmojiSelect={insertEmoji}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Images <span className="text-gray-400">(max 10)</span>
        </label>
        <CldUploadButton
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          options={{ multiple: true, maxFiles: 10 }}
          onUpload={handleUpload}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer transition"
        >
          <ImageIcon className="w-5 h-5 text-blue-400" />
          {imageUrls.length > 0 ? 'Images sélectionnées' : 'Choisir des images'}
        </CldUploadButton>
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={url}
                  alt="Aperçu"
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red-500 hover:bg-white shadow group-hover:opacity-100 opacity-60 transition"
                  title="Supprimer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-xl shadow hover:from-blue-600 hover:to-blue-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading && <Loader2 className="animate-spin w-5 h-5" />}
        {isLoading ? 'Publication en cours...' : 'Publier'}
      </button>
    </form>
  )
} 