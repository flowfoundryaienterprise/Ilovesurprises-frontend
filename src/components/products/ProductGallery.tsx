import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { resolveProductImage } from '../../services/productService';
import { handleImageErrorSafely } from '../../utils/imageUtils';

interface ProductGalleryProps {
  mainImage: string;
  productName: string;
  alternateImages?: string[];
  badge?: string;
  surpriseValue?: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  mainImage,
  productName,
  alternateImages = [],
  badge,
  surpriseValue,
}) => {
  const resolvedMain = resolveProductImage(mainImage, productName);
  const allImages = Array.from(
    new Set([resolvedMain, ...alternateImages.map((img) => resolveProductImage(img, productName))].filter(Boolean))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHoverZooming, setIsHoverZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(1);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Reset index to 0 whenever the selected product or mainImage changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentIndex(0);
      setFailedImages({});
    }, 0);
    return () => clearTimeout(timer);
  }, [mainImage]);

  const rawCurrentImage = allImages[currentIndex] || resolvedMain;
  const currentImage = failedImages[rawCurrentImage]
    ? resolveProductImage(null, productName)
    : rawCurrentImage;

  // Body scroll lock during Lightbox
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  // Handle Mouse Move for Dynamic Pan-Zoom Lens (only on hover-capable pointer devices) - rAF throttled
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) return;
    if (!containerRef.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      setZoomOrigin({ x, y });
    });
  };

  const handleNext = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
    setLightboxScale(1);
  }, [allImages.length]);

  const handlePrev = React.useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    setLightboxScale(1);
  }, [allImages.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handleNext, handlePrev]);

  return (
    <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden select-none">

      {/* Featured Main Image Display with Pan-Zoom Lens */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHoverZooming(true)}
        onMouseLeave={() => setIsHoverZooming(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsLightboxOpen(true)}
        className="relative w-full max-w-full aspect-square max-h-[520px] rounded-2xl overflow-hidden bg-white border border-[#ebdce5] p-3 sm:p-6 flex items-center justify-center isolate group shadow-[0_4px_24px_rgba(50,31,63,0.04)] cursor-zoom-in transition-all duration-300"
      >
        {/* Main Product Image with Smooth Transform Origin Zoom */}
        <img
          src={currentImage}
          alt={productName}
          width={600}
          height={600}
          style={{
            transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
          }}
          className={`w-full h-full max-h-[480px] object-contain mx-auto transition-transform duration-200 ease-out ${isHoverZooming ? 'scale-[2.1]' : 'scale-100 group-hover:scale-102'
            }`}
          loading="eager"
          onError={(e) => {
            if (!failedImages[rawCurrentImage]) {
              setFailedImages((prev) => ({ ...prev, [rawCurrentImage]: true }));
            } else {
              handleImageErrorSafely(e);
            }
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 flex flex-col items-start gap-1.5 z-10 pointer-events-none">
          {badge && (
            <span className="px-3 py-1 rounded-full bg-[#141219] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
              {badge}
            </span>
          )}
        </div>

        {/* Top Right Quick Actions (Fullscreen & Zoom Indicator) */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#141219] hover:text-[#D30915] flex items-center justify-center transition-all cursor-pointer shadow-xs border border-[#ebdce5] hover:scale-110 active:scale-95"
            aria-label="Open fullscreen gallery modal"
            title="Expand Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Hover/Touch Zoom Pill Hint */}
        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#ebdce5] text-[10px] sm:text-[11px] font-bold text-[#55505a] shadow-xs flex items-center gap-1.5 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-3.5 h-3.5 text-[#D30915]" />
          <span>Tap or hover to zoom details</span>
        </div>
      </div>

      {/* Surprise Value Feature Callout (if available) */}
      {surpriseValue && (
        <div className="bg-[#fff8fb] rounded-[16px] p-3 border border-[#fecdd3] flex items-center gap-2.5 shadow-2xs w-full max-w-full overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-[#D30915] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-xs font-black text-[#141219] truncate">
              {surpriseValue}
            </strong>
            <span className="text-[10px] text-[#716d77] block truncate">
              Sealed in waterproof capsule inside every product
            </span>
          </div>
        </div>
      )}

      {/* Multi-Angle / Alternate Image Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex items-center justify-center gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x pt-1 w-full max-w-full mx-auto translate-x-[1px]">
          {allImages.map((img, idx) => {
            const isSelected = currentIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[14px] overflow-hidden border p-1 bg-white transition-all duration-200 cursor-pointer snap-start shrink-0 ${
                  isSelected
                    ? 'border-[#D30915] ring-2 ring-[#D30915]/30 shadow-xs'
                    : 'border-[#ebdce5] hover:border-[#f1b8cb] opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`${productName} view ${idx + 1}`}
                  width={80}
                  height={80}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => handleImageErrorSafely(e)}
                  className="w-full h-full object-contain rounded-[10px]"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN LIGHTBOX / HIGH-DEFINITION GALLERY MODAL                       */}
      {/* ========================================================================= */}
      {isLightboxOpen &&
        createPortal(
          <div
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          >
            {/* Lightbox Top Toolbar - Strictly Protected from Overflow on Mobile */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between w-full max-w-5xl mx-auto gap-2 z-10 mb-2 shrink-0"
            >
              {/* Title & Counter with Safe Truncation */}
              <div className="min-w-0 flex-1 mr-1">
                <h3 className="text-xs sm:text-base font-black text-white m-0 truncate leading-tight">
                  {productName}
                </h3>
                <span className="text-[10px] sm:text-[11px] text-white/70 block mt-0.5">
                  Image {currentIndex + 1} of {allImages.length}
                </span>
              </div>

              {/* Controls Bar */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setLightboxScale((s) => Math.max(0.75, s - 0.25))}
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Zoom Out"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setLightboxScale(1)}
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Reset Zoom"
                  title="Reset Scale"
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setLightboxScale((s) => Math.min(3, s + 0.25))}
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Zoom In"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* Close Button - Always Highly Visible and Tappable */}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#D30915] hover:bg-[#B60711] text-white flex items-center justify-center transition-all cursor-pointer shadow-md ml-1 active:scale-90 shrink-0"
                  aria-label="Close Lightbox"
                  title="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Main Stage with Drag/Zoom Canvas */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex-1 w-full max-w-4xl mx-auto flex items-center justify-center overflow-hidden py-4"
            >
              {/* Previous Arrow */}
              {allImages.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm shadow-md"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Centered High-Res Zoomable Image */}
              <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                <img
                  src={currentImage}
                  alt={productName}
                  style={{
                    transform: `scale(${lightboxScale})`,
                  }}
                  className="max-w-full max-h-[70vh] object-contain transition-transform duration-200 select-none shadow-2xl rounded-[18px]"
                  onError={(e) => {
                    if (!failedImages[rawCurrentImage]) {
                      setFailedImages((prev) => ({ ...prev, [rawCurrentImage]: true }));
                    } else {
                      handleImageErrorSafely(e);
                    }
                  }}
                />
              </div>

              {/* Next Arrow */}
              {allImages.length > 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm shadow-md"
                  aria-label="Next Image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Lightbox Bottom Thumbnail Ribbon */}
            {allImages.length > 1 && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2 max-w-md mx-auto z-10 overflow-x-auto py-2"
              >
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setLightboxScale(1);
                    }}
                    className={`w-14 h-14 rounded-[12px] overflow-hidden border-2 bg-white/10 p-1 transition-all cursor-pointer ${currentIndex === idx
                      ? 'border-[#D30915] ring-2 ring-[#D30915]/50 scale-110'
                      : 'border-white/30 opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img
                      src={img}
                      alt="Thumbnail"
                      onError={(e) => handleImageErrorSafely(e)}
                      className="w-full h-full object-contain rounded-[8px]"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body
        )}

    </div>
  );
};
