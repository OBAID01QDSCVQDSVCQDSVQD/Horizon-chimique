"use client"
import { useState } from 'react'
import { usePathname } from 'next/navigation'

interface AddPostButtonProps {
  session: any
}

export default function AddPostButton({ session }: AddPostButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const pathname = usePathname()

  const handleAddPostClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault()
      setShowModal(true)
    }
    // إذا كان هناك session، يذهب مباشرة للرابط
  }

  return (
    <>
      <a
        href="/posts/create"
        onClick={handleAddPostClick}
        className="fixed bottom-8 right-8 z-50 bg-[#00AEEF] hover:bg-cyan-600 text-white rounded-full shadow-lg p-4 flex items-center gap-2 font-bold text-lg transition-all duration-200"
      >
        + Ajouter un post
      </a>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xs w-full flex flex-col items-center relative animate-fade-in">
            <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none" aria-label="Fermer">&times;</button>
            <h2 className="text-xl font-bold mb-4 text-blue-600 text-center">Veuillez vous connecter ou créer un compte</h2>
            <div className="flex flex-col gap-3 w-full">
              <a href={`/sign-in?callbackUrl=${encodeURIComponent(pathname || '/')}`} className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold text-center hover:bg-blue-600 transition">Se connecter</a>
              <a href="/sign-up" className="w-full px-4 py-2 bg-gray-100 text-blue-700 rounded-lg font-semibold text-center hover:bg-blue-100 transition">Créer un nouveau compte</a>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 