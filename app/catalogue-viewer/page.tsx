"use client";
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, BookOpen, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PageData {
  id: number;
  imageUrl: string;
  alt: string;
}

export default function CatalogueViewerPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const bookRef = useRef<HTMLDivElement>(null);

  // Generate 32 pages data
  const pages: PageData[] = Array.from({ length: 32 }, (_, i) => ({
    id: i + 1,
    imageUrl: `/images/catalogue/${i + 1}.jpg`,
    alt: `Page ${i + 1} du catalogue`
  }));

  const totalPages = pages.length;

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      const isWide = window.innerWidth >= 1024;
      setIsWideScreen(isWide);
      // Auto-show thumbnails on wide screens
      if (isWide) {
        setShowThumbnails(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Calculate current pages to display
  const getCurrentPages = () => {
    if (isWideScreen) {
      // For wide screens, show two pages side by side
      const leftPage = currentPage;
      const rightPage = currentPage + 1;
      
      return {
        left: pages[leftPage - 1],
        right: rightPage <= totalPages ? pages[rightPage - 1] : null,
        isLastPage: rightPage > totalPages
      };
    } else {
      // For small screens, show single page
      return {
        left: pages[currentPage - 1],
        right: null,
        isLastPage: currentPage === totalPages
      };
    }
  };

  const nextPage = () => {
    if (isFlipping) return;
    
    const pagesToSkip = isWideScreen ? 2 : 1;
    const nextPageNum = currentPage + pagesToSkip;
    
    if (nextPageNum <= totalPages) {
      setFlipDirection('right');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(nextPageNum);
        setIsFlipping(false);
      }, 500);
    }
  };

  const prevPage = () => {
    if (isFlipping) return;
    
    const pagesToSkip = isWideScreen ? 2 : 1;
    const prevPageNum = currentPage - pagesToSkip;
    
    if (prevPageNum >= 1) {
      setFlipDirection('left');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prevPageNum);
        setIsFlipping(false);
      }, 500);
    }
  };

  const goToPage = (page: number) => {
    if (!isFlipping && page !== currentPage) {
      setFlipDirection(page > currentPage ? 'right' : 'left');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(page);
        setIsFlipping(false);
      }, 500);
    }
  };

  // Mouse drag navigation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Only trigger if horizontal movement is significant
    if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
      if (deltaX > 0) {
        prevPage();
      } else {
        nextPage();
      }
      setIsDragging(false);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Click navigation
  const handleBookClick = (e: React.MouseEvent) => {
    if (!bookRef.current) return;
    
    const rect = bookRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const bookWidth = rect.width;
    
    if (isWideScreen) {
      // For wide screens, divide into three sections: left, center, right
      const sectionWidth = bookWidth / 3;
      
      if (clickX < sectionWidth) {
        // Left section - previous page
        prevPage();
      } else if (clickX > sectionWidth * 2) {
        // Right section - next page
        nextPage();
      }
      // Center section - no action (binding area)
    } else {
      // For small screens, left half = previous page, right half = next page
      if (clickX < bookWidth / 2) {
        prevPage();
      } else {
        nextPage();
      }
    }
  };

  const zoomIn = () => {
    setZoom(Math.min(zoom + 0.2, 3));
  };

  const zoomOut = () => {
    setZoom(Math.max(zoom - 0.2, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const downloadPage = () => {
    const link = document.createElement('a');
    link.href = pages[currentPage - 1].imageUrl;
    link.download = `catalogue-page-${currentPage}.jpg`;
    link.click();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextPage();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevPage();
          break;
        case 'Home':
          e.preventDefault();
          goToPage(1);
          break;
        case 'End':
          e.preventDefault();
          goToPage(totalPages);
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages, isFlipping]);

  // Preload images
  useEffect(() => {
    const preloadImages = async () => {
      setIsLoading(true);
      const imagePromises = pages.map((page) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = page.imageUrl;
        });
      });

      try {
        await Promise.all(imagePromises);
        setIsLoading(false);
      } catch (error) {
        console.error('Error preloading images:', error);
        setIsLoading(false);
      }
    };

    preloadImages();
  }, []);

  const currentPageData = pages[currentPage - 1];
  const currentPages = getCurrentPages();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-20 md:w-24 md:h-32 bg-gradient-to-br from-amber-200 to-orange-300 rounded-lg shadow-2xl animate-pulse mx-auto mb-4 transform rotate-3"></div>
            <div className="w-16 h-20 md:w-24 md:h-32 bg-gradient-to-br from-orange-200 to-red-300 rounded-lg shadow-2xl animate-pulse mx-auto mb-4 transform -rotate-3 absolute top-0 left-0"></div>
          </div>
          <p className="text-base md:text-lg text-gray-600 font-semibold">Chargement du catalogue...</p>
          <p className="text-xs md:text-sm text-gray-500 mt-2">Préparation de votre expérience de lecture</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 relative overflow-hidden">
      {/* Custom CSS for 3D effects */}
      <style jsx>{`
        .book-container {
          perspective: 1200px;
          transform-style: preserve-3d;
          position: relative;
        }
        
        .book-page {
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform-style: preserve-3d;
          position: relative;
          overflow: hidden;
          background: transparent;
        }
        
        .book-page.flipping-right {
          animation: slideRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .book-page.flipping-left {
          animation: slideLeft 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        @keyframes slideRight {
          0% { 
            transform: translateX(0) scale(${zoom});
            opacity: 1;
          }
          50% { 
            transform: translateX(-100%) scale(${zoom}) rotateY(-15deg);
            opacity: 0.3;
          }
          100% { 
            transform: translateX(0) scale(${zoom});
            opacity: 1;
          }
        }
        
        @keyframes slideLeft {
          0% { 
            transform: translateX(0) scale(${zoom});
            opacity: 1;
          }
          50% { 
            transform: translateX(100%) scale(${zoom}) rotateY(15deg);
            opacity: 0.3;
          }
          100% { 
            transform: translateX(0) scale(${zoom});
            opacity: 1;
          }
        }
        
        .book-page:hover {
          cursor: pointer;
          transform: scale(${zoom}) translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        }
        
        @media (max-width: 768px) {
          .book-page:hover {
            transform: scale(${zoom});
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          }
        }
        
        @media (min-width: 1024px) {
          .book-page:hover {
            transform: scale(${zoom}) translateY(-5px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          }
        }
        
        .book-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 5;
        }
        
        .book-page:hover::before {
          opacity: 1;
          animation: shimmer 13s ease-in-out;
        }
        
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        
        .page-curl {
          position: absolute;
          top: 0;
          right: 0;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 25px 25px 0;
          border-color: transparent #f3f4f6 transparent transparent;
          transition: all 0.3s ease;
          z-index: 10;
        }
        
        .book-page:hover .page-curl {
          border-width: 0 30px 30px 0;
          border-color: transparent #e5e7eb transparent transparent;
        }
        
        @media (max-width: 768px) {
          .page-curl {
            border-width: 0 15px 15px 0;
          }
          
          .book-page:hover .page-curl {
            border-width: 0 20px 20px 0;
          }
        }
        
        @media (min-width: 1024px) {
          .page-curl {
            border-width: 0 35px 35px 0;
          }
          
          .book-page:hover .page-curl {
            border-width: 0 40px 40px 0;
          }
        }
        
        .book-spine {
          position: absolute;
          left: -12px;
          top: 0;
          bottom: 0;
          width: 24px;
          background: linear-gradient(90deg, #1f2937, #374151, #4b5563, #374151, #1f2937);
          border-radius: 12px;
          box-shadow: inset 0 0 15px rgba(0,0,0,0.5);
          transform: rotateY(90deg) translateZ(-12px);
        }
        
        @media (max-width: 768px) {
          .book-spine {
            left: -8px;
            width: 16px;
            border-radius: 8px;
            transform: rotateY(90deg) translateZ(-8px);
          }
        }
        
        @media (min-width: 1024px) {
          .book-spine {
            left: -16px;
            width: 32px;
            border-radius: 16px;
            transform: rotateY(90deg) translateZ(-16px);
          }
        }
        
        .book-spine::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          background: linear-gradient(45deg, #1f2937, #374151);
          border-radius: 50%;
          box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        }
        
        @media (max-width: 768px) {
          .book-spine::before {
            width: 12px;
            height: 12px;
          }
        }
        
        @media (min-width: 1024px) {
          .book-spine::before {
            width: 20px;
            height: 20px;
          }
        }
        
        .page-shadow {
          position: absolute;
          bottom: -15px;
          left: 15px;
          right: 15px;
          height: 25px;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%);
          border-radius: 50%;
          transform: rotateX(90deg);
          opacity: 0.7;
          transition: all 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .page-shadow {
            bottom: -10px;
            left: 10px;
            right: 10px;
            height: 20px;
          }
        }
        
        @media (min-width: 1024px) {
          .page-shadow {
            bottom: -20px;
            left: 20px;
            right: 20px;
            height: 35px;
          }
        }
        
        .book-page:hover .page-shadow {
          opacity: 0.9;
          transform: rotateX(90deg) scale(1.15);
        }
        
        .flipping .page-shadow {
          animation: shadowPulse 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        @keyframes shadowPulse {
          0%, 100% { 
            opacity: 0.7;
            transform: rotateX(90deg) scale(1);
          }
          50% { 
            opacity: 0.4;
            transform: rotateX(90deg) scale(0.8);
          }
        }
        
        .book-binding {
          position: absolute;
          left: -6px;
          top: 0;
          bottom: 0;
          width: 12px;
          background: linear-gradient(90deg, #111827, #1f2937, #374151, #1f2937, #111827);
          border-radius: 6px;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.6);
        }
        
        @media (max-width: 768px) {
          .book-binding {
            left: -4px;
            width: 8px;
            border-radius: 4px;
          }
        }
        
        @media (min-width: 1024px) {
          .book-binding {
            left: -8px;
            width: 16px;
            border-radius: 8px;
          }
        }
        
        .book-binding::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 3px,
            rgba(255,255,255,0.1) 3px,
            rgba(255,255,255,0.1) 6px
          );
        }
        
        .page-content {
          position: relative;
          z-index: 1;
          transition: all 0.3s ease;
          width: 100%;
          height: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .page-content:hover {
          transform: scale(1.02);
        }
        
        @media (max-width: 768px) {
          .page-content:hover {
            transform: scale(1.01);
          }
        }
        
        @media (min-width: 1024px) {
          .page-content:hover {
            transform: scale(1.03);
          }
          
          /* Dual page specific styles */
          .page-content .flex {
            gap: 0;
            width: 100%;
            height: auto;
            max-width: 100%;
          }
          
          .page-content .flex > div {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          
          .page-content .flex > div:first-child {
            border-radius: 0;
          }
          
          .page-content .flex > div:last-child {
            border-radius: 0;
          }
          
          /* Image container styles */
          .page-content .flex > div:first-child,
          .page-content .flex > div:last-child {
            overflow: hidden;
          }
          
          .page-content .flex img {
            width: 100%;
            height: auto;
            object-fit: contain;
            display: block;
          }
        }
        
        /* Single page natural image dimensions */
        .page-content img {
          width: 100%;
          height: auto;
          object-fit: contain;
          display: block;
        }
        
        .flipping .page-content {
          animation: contentFade 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        @keyframes contentFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f59e0b, #ea580c);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #d97706, #dc2626);
        }
      `}</style>

      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-16 h-16 md:w-32 md:h-32 lg:w-48 lg:h-48 bg-amber-200 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-20 h-20 md:w-40 md:h-40 lg:w-56 lg:h-56 bg-orange-200 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-60 md:h-60 lg:w-80 lg:h-80 bg-red-200 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/4 right-1/4 w-24 h-24 lg:w-40 lg:h-40 bg-yellow-200 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 lg:w-32 lg:h-32 bg-pink-200 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* Header */}
      <div className="relative bg-gradient-to-r from-white/95 via-amber-50/90 to-white/95 backdrop-blur-md shadow-xl border-b border-amber-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-14 lg:w-14 lg:h-16 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 via-amber-700 to-orange-700 bg-clip-text text-transparent">
                  Catalogue Horizon Chimique
                </h1>
                <p className="text-sm lg:text-base text-gray-600 hidden sm:block font-medium">
                  Votre expérience de lecture interactive et immersive
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowThumbnails(!showThumbnails)}
                className="hidden md:flex bg-white/90 hover:bg-white border-amber-300 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showThumbnails ? 'Masquer' : 'Afficher'} les vignettes
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowThumbnails(!showThumbnails)}
                className="md:hidden bg-white/80 hover:bg-white border-amber-200"
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="bg-white/90 hover:bg-white border-amber-300 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="hidden sm:inline">{isFullscreen ? 'Quitter' : 'Plein écran'}</span>
                <span className="sm:hidden">{isFullscreen ? '✕' : '⛶'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8 relative">
        <div className="flex gap-4 lg:gap-8">
          {/* Thumbnails Sidebar */}
          {showThumbnails && (
            <div className="hidden lg:block w-56 flex-shrink-0">
              <Card className="p-6 h-fit sticky top-8 bg-white/95 backdrop-blur-md border-amber-200/50 shadow-2xl rounded-2xl">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-3 text-lg">
                  <BookOpen className="w-5 h-5" />
                  Pages du Catalogue
                </h3>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      onClick={() => goToPage(page.id)}
                      className={`cursor-pointer rounded-xl border-2 transition-all transform hover:scale-105 hover:shadow-lg ${
                        currentPage === page.id
                          ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-xl'
                          : 'border-gray-200 hover:border-amber-300 bg-white hover:bg-amber-50/30'
                      }`}
                    >
                      <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={page.imageUrl}
                          alt={page.alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-center py-2 font-semibold text-gray-700">
                        Page {page.id}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Main Book Viewer */}
          <div className="flex-1">
            <Card className="p-6 lg:p-8 bg-white/95 backdrop-blur-md border-amber-200/50 shadow-2xl rounded-2xl">
              {/* Book Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-0 mb-6 lg:mb-8">
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={currentPage <= 1 || isFlipping}
                    className="bg-white hover:bg-amber-50 border-amber-300 text-amber-700 shadow-lg hover:shadow-xl transition-all duration-300 px-4"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Précédent</span>
                  </Button>
                  
                  <div className="bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-3 rounded-xl border border-amber-300 shadow-lg">
                    <span className="text-sm lg:text-base font-bold text-amber-800">
                      {isWideScreen ? (
                        <>
                          Pages {currentPage}-{Math.min(currentPage + 1, totalPages)} sur {totalPages}
                        </>
                      ) : (
                        <>
                          Page {currentPage} sur {totalPages}
                        </>
                      )}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={currentPages.isLastPage || isFlipping}
                    className="bg-white hover:bg-amber-50 border-amber-300 text-amber-700 shadow-lg hover:shadow-xl transition-all duration-300 px-4"
                  >
                    <span className="hidden sm:inline mr-1">Suivant</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-center lg:justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomOut}
                    disabled={zoom <= 0.5}
                    className="bg-white hover:bg-amber-50 border-amber-300 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm lg:text-base text-gray-700 min-w-[50px] lg:min-w-[70px] text-center font-bold bg-gray-100 px-3 py-2 rounded-lg">
                    {Math.round(zoom * 100)}%
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomIn}
                    disabled={zoom >= 3}
                    className="bg-white hover:bg-amber-50 border-amber-300 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetZoom}
                    className="bg-white hover:bg-amber-50 border-amber-300 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPage}
                    className="bg-white hover:bg-amber-50 border-amber-300 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Book Display */}
              <div className="flex justify-center">
                <div className="book-container relative w-full max-w-6xl lg:max-w-8xl">
                  {/* Book Spine */}
                  <div className="book-spine"></div>
                  
                  {/* Book Binding */}
                  <div className="book-binding"></div>
                  
                  {/* Main Book Pages */}
                  <div
                    ref={bookRef}
                    className={`book-page relative rounded-2xl shadow-2xl overflow-hidden ${
                      isFlipping ? `flipping-${flipDirection} flipping` : ''
                    }`}
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center top',
                      maxWidth: '100%',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      height: 'auto'
                    }}
                    onClick={handleBookClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* Enhanced Page Curl Effect */}
                    <div className="page-curl"></div>
                    
                    {/* Page Shadow */}
                    <div className="page-shadow"></div>
                    
                    {/* Page Content Shadow - Removed for cleaner look */}
                    
                    <div className="page-content w-full">
                      {isWideScreen ? (
                        /* Dual Page Layout for Wide Screens */
                        <div className="flex w-full">
                          {/* Left Page */}
                          <div className="flex-1 relative">
                            <img
                              src={currentPages.left.imageUrl}
                              alt={currentPages.left.alt}
                              className="w-full h-auto object-contain"
                              style={{
                                maxHeight: 'calc(100vh - 250px)',
                                minHeight: '400px'
                              }}
                            />
                          </div>
                          
                          {/* Center Binding for Wide Screens - Removed for cleaner look */}
                          
                          {/* Right Page */}
                          <div className="flex-1 relative">
                            {currentPages.right ? (
                              <img
                                src={currentPages.right.imageUrl}
                                alt={currentPages.right.alt}
                                className="w-full h-auto object-contain"
                                style={{
                                  maxHeight: 'calc(100vh - 250px)',
                                  minHeight: '400px'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                                <div className="text-center">
                                  <div className="w-16 h-20 bg-gradient-to-br from-amber-200 to-orange-300 rounded-lg shadow-lg mx-auto mb-4 transform rotate-3"></div>
                                  <p className="text-amber-700 font-semibold">Fin du catalogue</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Single Page Layout for Small Screens */
                        <img
                          src={currentPages.left.imageUrl}
                          alt={currentPages.left.alt}
                          className="w-full h-auto object-contain"
                          style={{
                            maxHeight: 'calc(100vh - 250px)',
                            minHeight: '400px'
                          }}
                        />
                      )}
                    </div>
                    
                    {/* Navigation Hints */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                      <div className="absolute left-4 lg:left-8 top-1/2 transform -translate-y-1/2 bg-black/30 text-white px-3 py-2 rounded-lg text-sm opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                        ← Précédent
                      </div>
                      <div className="absolute right-4 lg:right-8 top-1/2 transform -translate-y-1/2 bg-black/30 text-white px-3 py-2 rounded-lg text-sm opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                        Suivant →
                      </div>
                    </div>
                  </div>
                  
                  {/* Book Spine Shadow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 rounded-2xl transform rotate-1 scale-105 opacity-10 -z-10"></div>
                </div>
              </div>

              {/* Navigation Instructions */}
              <div className="mt-6 lg:mt-8 text-center">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-4 lg:p-6 inline-block shadow-lg">
                  <p className="text-sm lg:text-base text-amber-800 font-medium">
                    {isWideScreen ? (
                      <>
                        💡 Cliquez sur la gauche/droite du livre pour naviguer • Glissez avec la souris • 
                        Utilisez les flèches ← → ou Espace • Échap pour quitter le plein écran
                        <br />
                        <span className="text-xs text-amber-600 mt-2 block">
                          Mode double page activé - Navigation par paires de pages
                        </span>
                      </>
                    ) : (
                      <>
                        💡 Cliquez sur la gauche/droite du livre pour naviguer • Glissez avec la souris • 
                        Utilisez les flèches ← → ou Espace • Échap pour quitter le plein écran
                      </>
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Thumbnails Modal */}
      {showThumbnails && (
        <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
          <div className="bg-white rounded-lg p-3 md:p-4 w-full max-w-sm max-h-[80vh] overflow-y-auto border border-amber-200 shadow-2xl">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h3 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                <BookOpen className="w-4 h-4" />
                Pages
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowThumbnails(false)}
                className="bg-white hover:bg-amber-50 border-amber-200"
              >
                <span className="hidden sm:inline">Fermer</span>
                <span className="sm:hidden">✕</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {pages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => {
                    goToPage(page.id);
                    setShowThumbnails(false);
                  }}
                  className={`cursor-pointer rounded-lg border-2 transition-all transform hover:scale-105 ${
                    currentPage === page.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300 bg-white'
                  }`}
                >
                  <div className="aspect-[3/4] bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={page.imageUrl}
                      alt={page.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-center py-1 font-medium">
                    {page.id}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 