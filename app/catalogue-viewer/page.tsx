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
  const [isLoading, setIsLoading] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const bookRef = useRef<HTMLDivElement>(null);

  // Generate 32 pages data
  const pages: PageData[] = Array.from({ length: 32 }, (_, i) => ({
    id: i + 1,
    imageUrl: `/images/catalogue/${i + 1}.jpg`,
    alt: `Page ${i + 1} du catalogue`
  }));

  const totalPages = pages.length;

  const nextPage = () => {
    if (currentPage < totalPages && !isFlipping) {
      setFlipDirection('right');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsFlipping(false);
      }, 500);
    }
  };

  const prevPage = () => {
    if (currentPage > 1 && !isFlipping) {
      setFlipDirection('left');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
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
    if (!isDragging) return;
    
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
    
    // Left half = previous page, Right half = next page
    if (clickX < bookWidth / 2) {
      prevPage();
    } else {
      nextPage();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-32 bg-gradient-to-br from-amber-200 to-orange-300 rounded-lg shadow-2xl animate-pulse mx-auto mb-4 transform rotate-3"></div>
            <div className="w-24 h-32 bg-gradient-to-br from-orange-200 to-red-300 rounded-lg shadow-2xl animate-pulse mx-auto mb-4 transform -rotate-3 absolute top-0 left-0"></div>
          </div>
          <p className="text-lg text-gray-600 font-semibold">Chargement du catalogue...</p>
          <p className="text-sm text-gray-500 mt-2">Préparation de votre expérience de lecture</p>
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
          animation: shimmer 2s ease-in-out infinite;
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
        }
        
        .book-page:hover .page-content {
          transform: scale(1.02);
        }
        
        .flipping .page-content {
          animation: contentFade 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        @keyframes contentFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-amber-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-200 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-red-200 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-sm shadow-lg border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg shadow-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Catalogue Horizon Chimique</h1>
                <p className="text-gray-600">Votre expérience de lecture interactive</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowThumbnails(!showThumbnails)}
                className="hidden md:flex bg-white/80 hover:bg-white border-amber-200"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showThumbnails ? 'Masquer' : 'Afficher'} les vignettes
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="bg-white/80 hover:bg-white border-amber-200"
              >
                {isFullscreen ? 'Quitter' : 'Plein écran'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 relative">
        <div className="flex gap-6">
          {/* Thumbnails Sidebar */}
          {showThumbnails && (
            <div className="hidden lg:block w-48 flex-shrink-0">
              <Card className="p-4 h-fit sticky top-6 bg-white/90 backdrop-blur-sm border-amber-200 shadow-xl">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Pages
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      onClick={() => goToPage(page.id)}
                      className={`cursor-pointer rounded-lg border-2 transition-all transform hover:scale-105 ${
                        currentPage === page.id
                          ? 'border-amber-500 bg-amber-50 shadow-lg'
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
            <Card className="p-6 bg-white/90 backdrop-blur-sm border-amber-200 shadow-2xl">
              {/* Book Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={currentPage === 1 || isFlipping}
                    className="bg-white hover:bg-amber-50 border-amber-200 text-amber-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  
                  <div className="bg-amber-100 px-4 py-2 rounded-lg border border-amber-200">
                    <span className="text-sm font-semibold text-amber-800">
                      Page {currentPage} sur {totalPages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={currentPage === totalPages || isFlipping}
                    className="bg-white hover:bg-amber-50 border-amber-200 text-amber-700"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomOut}
                    disabled={zoom <= 0.5}
                    className="bg-white hover:bg-amber-50 border-amber-200"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-gray-600 min-w-[60px] text-center font-semibold">
                    {Math.round(zoom * 100)}%
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomIn}
                    disabled={zoom >= 3}
                    className="bg-white hover:bg-amber-50 border-amber-200"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetZoom}
                    className="bg-white hover:bg-amber-50 border-amber-200"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPage}
                    className="bg-white hover:bg-amber-50 border-amber-200"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Book Display */}
              <div className="flex justify-center">
                <div className="book-container relative">
                  {/* Book Spine */}
                  <div className="book-spine"></div>
                  
                  {/* Book Binding */}
                  <div className="book-binding"></div>
                  
                  {/* Main Book Page */}
                  <div
                    ref={bookRef}
                    className={`book-page relative bg-white rounded-lg shadow-2xl overflow-hidden ${
                      isFlipping ? `flipping-${flipDirection} flipping` : ''
                    }`}
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center top'
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
                    
                    {/* Page Content Shadow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-transparent to-gray-100 opacity-30"></div>
                    
                    <div className="page-content">
                      <img
                        src={currentPageData.imageUrl}
                        alt={currentPageData.alt}
                        className="relative z-10 max-w-full h-auto"
                        style={{
                          maxHeight: 'calc(100vh - 300px)',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                    
                    {/* Navigation Hints */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 text-white px-2 py-1 rounded text-xs opacity-0 hover:opacity-100 transition-opacity">
                        ← Précédent
                      </div>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 text-white px-2 py-1 rounded text-xs opacity-0 hover:opacity-100 transition-opacity">
                        Suivant →
                      </div>
                    </div>
                  </div>
                  
                  {/* Book Spine Shadow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 rounded-lg transform rotate-1 scale-105 opacity-10 -z-10"></div>
                </div>
              </div>

              {/* Navigation Instructions */}
              <div className="mt-6 text-center">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 inline-block">
                  <p className="text-xs text-amber-700">
                    💡 Cliquez sur la gauche/droite du livre pour naviguer • Glissez avec la souris • 
                    Utilisez les flèches ← → ou Espace • Échap pour quitter le plein écran
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Thumbnails Modal */}
      {showThumbnails && (
        <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full max-h-96 overflow-y-auto border border-amber-200 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Pages
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowThumbnails(false)}
                className="bg-white hover:bg-amber-50 border-amber-200"
              >
                Fermer
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
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