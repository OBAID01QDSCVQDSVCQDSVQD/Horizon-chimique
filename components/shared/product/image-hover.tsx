'use client'
import Image from 'next/image'
import { useState } from 'react'

const ImageHover = ({
  src,
  hoverSrc,
  alt,
}: {
  src: string
  hoverSrc: string
  alt: string
}) => {
  const [isHovered, setIsHovered] = useState(false)
  let hoverTimeout: any

  const handleMouseEnter = () => {
    hoverTimeout = setTimeout(() => setIsHovered(true), 100)
  }

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout)
    setIsHovered(false)
  }

  // التحقق من صحة الصور
  const isValidSrc = src && typeof src === 'string' && src.trim() !== ""
  const isValidHoverSrc = hoverSrc && typeof hoverSrc === 'string' && hoverSrc.trim() !== ""

  return (
    <div
      className='relative h-52'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isValidSrc ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes='80vw'
          className={`object-contain transition-opacity duration-500 ${
            isHovered ? 'opacity-0' : 'opacity-100'
          }`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.jpg';
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <span className="text-gray-400">لا توجد صورة متاحة</span>
        </div>
      )}
      {isValidHoverSrc && (
        <Image
          src={hoverSrc}
          alt={alt}
          fill
          sizes='80vw'
          className={`absolute inset-0 object-contain transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.jpg';
          }}
        />
      )}
    </div>
  )
}

export default ImageHover 