'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

export default function ProductGallery({ images }: { images: string[] }) {
  // تصفية الصور الفارغة
  const validImages = images.filter(img => img && typeof img === 'string' && img.trim() !== "")

  // تأكد أن selectedImage دائماً يشير إلى صورة صالحة
  const [selectedImage, setSelectedImage] = useState(0)
  useEffect(() => {
    setSelectedImage(0)
  }, [images])

  useEffect(() => {
    if (selectedImage >= validImages.length) {
      setSelectedImage(0)
    }
  }, [validImages.length, selectedImage])

  // إذا لم توجد صور صالحة، لا تعرض أي صورة أو thumbnails
  if (validImages.length === 0) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-100">
        <span className="text-gray-400">Aucune image disponible</span>
      </div>
    )
  }

  return (
    <div className='flex gap-2'>
      <div className='flex flex-col gap-2 mt-8'>
        {validImages.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            onMouseOver={() => setSelectedImage(index)}
            className={`bg-white rounded-lg overflow-hidden ${
              selectedImage === index
                ? 'ring-2 ring-blue-500'
                : 'ring-1 ring-gray-300'
            }`}
          >
            <Image 
              src={image} 
              alt={'product image'} 
              width={48} 
              height={48}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.jpg';
              }}
            />
          </button>
        ))}
      </div>

      <div className='w-full'>
        <Zoom>
          <div className='relative h-[500px]'>
            <Image
              src={validImages[selectedImage]}
              alt={'product image'}
              fill
              sizes='90vw'
              className='object-contain'
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.jpg';
              }}
            />
          </div>
        </Zoom>
      </div>
    </div>
  )
}