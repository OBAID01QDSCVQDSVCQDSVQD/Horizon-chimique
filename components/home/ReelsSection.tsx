"use client"
import { useEffect, useState, useRef } from 'react'
import PostCard from '@/components/post/post-card'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function ReelsSection() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const firstCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => setPosts(data))
      .finally(() => setLoading(false))
  }, [])

  // Auto-scroll كل ثانيتين (مستقر)
  useEffect(() => {
    const container = scrollRef.current
    const card = firstCardRef.current
    if (!container || !card || posts.length === 0) return

    let direction = 1
    const scrollAmount = card.offsetWidth + 24 // 24px gap

    const interval = setInterval(() => {
      if (direction === 1) {
        if (container.scrollLeft + container.offsetWidth >= container.scrollWidth - 10) {
          direction = -1
        } else {
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
      } else {
        if (container.scrollLeft <= 0) {
          direction = 1
        } else {
          container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [posts.length])

  return (
    <div className="w-full max-w-full my-8 bg-white dark:bg-[#181c24] rounded-2xl shadow-lg dark:shadow-black/40 p-6 border border-gray-200 dark:border-gray-700">
      {posts.length > 0 && (
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-2xl font-bold text-blue-700">Actualités & Publications</h2>
          <Link 
            href="/posts" 
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span className="text-sm font-medium">Voir toutes les publications</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
      {loading ? (
        <div className="text-center text-gray-400">Chargement...</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-400">Aucune publication pour le moment</div>
      ) : (
        <div ref={scrollRef} className="flex gap-6 overflow-x-auto scrollbar-hide py-2 px-2" style={{ minWidth: 0 }}>
          {posts.map((post: any, index: number) => (
            <div 
              key={post._id} 
              ref={index === 0 ? firstCardRef : null}
              className="min-w-[340px] max-w-[90vw]"
            >
              <PostCard post={post} onComment={async () => {}} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 