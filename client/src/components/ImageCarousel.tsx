import { useState, useRef, useCallback } from "react";

/**
 * 通用圖片輪播元件（BUG 1: 多圖上傳前台統一輪播顯示）
 * - 多張圖片：左右滑動瀏覽（觸控滑動 + 箭頭按鈕 + 圓點指示器）
 * - 單張圖片：維持單張顯示，不顯示箭頭與圓點
 */
export default function ImageCarousel({
  images,
  className = "",
  imgClassName = "",
  onImageClick,
  alt = "圖片",
}: {
  images: string[];
  className?: string;
  imgClassName?: string;
  onImageClick?: (url: string) => void;
  alt?: string;
}) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const count = images.length;
  const goTo = useCallback((i: number) => {
    setIndex(((i % count) + count) % count);
  }, [count]);

  if (count === 0) return null;

  // 單張圖片：維持單張顯示
  if (count === 1) {
    return (
      <div className={className}>
        <img
          src={images[0]}
          alt={alt}
          className={imgClassName}
          onClick={() => onImageClick?.(images[0])}
          style={onImageClick ? { cursor: "pointer" } : undefined}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
        touchDeltaX.current = 0;
      }}
      onTouchMove={(e) => {
        if (touchStartX.current !== null) {
          touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
        }
      }}
      onTouchEnd={() => {
        if (Math.abs(touchDeltaX.current) > 50) {
          if (touchDeltaX.current < 0) goTo(index + 1);
          else goTo(index - 1);
        }
        touchStartX.current = null;
        touchDeltaX.current = 0;
      }}
    >
      <div
        className="flex"
        style={{
          transform: `translateX(-${index * 100}%)`,
          transition: "transform 0.35s cubic-bezier(0.23, 1, 0.32, 1)",
          height: "100%",
          minHeight: "fit-content",
        }}
      >
        {images.map((url, i) => (
          <div key={i} className="w-full flex-shrink-0 flex items-center justify-center" style={{ minHeight: "fit-content" }}>
            <img
              src={url}
              alt={`${alt} ${i + 1}`}
              className={imgClassName}
              onClick={() => onImageClick?.(url)}
              style={onImageClick ? { cursor: "pointer" } : undefined}
            />
          </div>
        ))}
      </div>
      {/* 左右箭頭 */}
      <button
        aria-label="上一張"
        onClick={(e) => { e.stopPropagation(); goTo(index - 1); }}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 z-10"
      >
        ‹
      </button>
      <button
        aria-label="下一張"
        onClick={(e) => { e.stopPropagation(); goTo(index + 1); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 z-10"
      >
        ›
      </button>
      {/* 圓點指示器 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`第 ${i + 1} 張`}
            onClick={(e) => { e.stopPropagation(); goTo(i); }}
            className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-amber-400" : "bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
