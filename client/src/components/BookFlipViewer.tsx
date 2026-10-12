import { useState, useRef, useCallback } from "react";

/**
 * 第15批次-9: 真實紙本書籍翻頁效果元件
 * - 每張圖片視為書本攤開的一頁（圖片本身已是左右頁攤開狀態）
 * - 翻頁時以 3D rotateY 模擬紙張沿書脊翻起的動畫，含紙張陰影漸層
 * - 支援點擊左右箭頭、圓點指示器與觸控滑動翻頁
 */
export default function BookFlipViewer({
  images,
  className = "",
  imgClassName = "",
  onImageClick,
  alt = "圖片",
  flipFromCenter = false,
  rightPageFlip = false,
}: {
  images: string[];
  className?: string;
  imgClassName?: string;
  onImageClick?: (url: string) => void;
  alt?: string;
  /** 單張長方形圖片使用中線作為翻頁起點；預設保留原書頁邊緣翻頁。 */
  flipFromCenter?: boolean;
  /** 書本攤開圖僅翻動右半頁，左半頁在動畫期間固定。 */
  rightPageFlip?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [flipping, setFlipping] = useState<null | {
    direction: "next" | "prev";
    from: number;
    to: number;
  }>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const count = images.length;

  const flipTo = useCallback(
    (target: number, direction: "next" | "prev") => {
      if (flipping || count <= 1) return;
      const to = ((target % count) + count) % count;
      if (to === index) return;
      setFlipping({ direction, from: index, to });
      // 菜單右頁動畫為0.62秒；完成時立即定格，避免反向翻頁在最右側留下靜止圖層。
      setTimeout(() => {
        setIndex(to);
        setFlipping(null);
      }, rightPageFlip ? 620 : 700);
    },
    [flipping, count, index, rightPageFlip]
  );

  if (count === 0) return null;

  const current = flipping ? flipping.from : index;
  const incoming = flipping ? flipping.to : index;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ perspective: "1600px" }}
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
          if (touchDeltaX.current < 0) flipTo(index + 1, "next");
          else flipTo(index - 1, "prev");
        }
        touchStartX.current = null;
        touchDeltaX.current = 0;
      }}
    >
      <style>{`
        @keyframes book-flip-next {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(-180deg); }
        }
        @keyframes book-flip-prev {
          0% { transform: rotateY(-180deg); }
          100% { transform: rotateY(0deg); }
        }
        @keyframes book-shadow-sweep {
          0% { opacity: 0; }
          40% { opacity: 0.45; }
          100% { opacity: 0; }
        }
        @keyframes menu-right-outgoing-half {
          0% { transform: rotateY(0deg); opacity: 1; }
          49.99% { transform: rotateY(-90deg); opacity: 1; }
          50%, 100% { transform: rotateY(-90deg); opacity: 0; }
        }
        @keyframes menu-right-incoming-half {
          0%, 49.99% { transform: rotateY(-90deg); opacity: 0; }
          50% { transform: rotateY(-90deg); opacity: 1; }
          100% { transform: rotateY(-180deg); opacity: 1; }
        }
        @keyframes menu-left-prev-outgoing-half {
          0% { transform: rotateY(0deg); opacity: 1; }
          49.99% { transform: rotateY(90deg); opacity: 1; }
          50%, 100% { transform: rotateY(90deg); opacity: 0; }
        }
        @keyframes menu-left-prev-incoming-half {
          0%, 49.99% { transform: rotateY(90deg); opacity: 0; }
          50% { transform: rotateY(90deg); opacity: 1; }
          100% { transform: rotateY(180deg); opacity: 1; }
        }
      `}</style>

      {/* 底層：翻頁後將顯示的頁面（往後翻=下一頁在底層右側；往前翻=上一頁在底層） */}
      <div className="absolute inset-0 flex items-center justify-center bg-inherit">
        <img
          src={images[incoming]}
          alt={`${alt} ${incoming + 1}`}
          className={imgClassName}
          onClick={() => !flipping && onImageClick?.(images[incoming])}
          style={onImageClick ? { cursor: "pointer" } : undefined}
        />
      </div>

      {/* 翻頁層：沿中央書脊 3D 翻起的紙張 */}
      {flipping ? (
        <>
          {rightPageFlip && (
            <img
              src={images[flipping.from]}
              alt=""
              className={`${imgClassName} absolute inset-0 z-[1]`}
              style={{
                clipPath: flipping.direction === "prev" ? "inset(0 0 0 50%)" : "inset(0 50% 0 0)",
                pointerEvents: "none",
              }}
            />
          )}
          {rightPageFlip && flipping.direction === "next" ? (
            <>
              <div
                className="absolute inset-0 z-[2]"
                style={{
                  clipPath: "inset(0 0 0 50%)",
                  transformOrigin: "center center",
                  transformStyle: "preserve-3d",
                  willChange: "transform, opacity",
                  animation: "menu-right-outgoing-half 0.62s linear forwards",
                }}
              >
                <img src={images[flipping.from]} alt="" className={imgClassName} />
              </div>
              <div
                className="absolute inset-0 z-[2]"
                style={{
                  clipPath: "inset(0 0 0 50%)",
                  transformOrigin: "center center",
                  transformStyle: "preserve-3d",
                  willChange: "transform, opacity",
                  animation: "menu-right-incoming-half 0.62s linear forwards",
                }}
              >
                <img
                  src={images[flipping.to]}
                  alt=""
                  className={imgClassName}
                  style={{ transform: "scaleX(-1)" }}
                />
              </div>
            </>
          ) : rightPageFlip && flipping.direction === "prev" ? (
            <>
              <div
                className="absolute inset-0 z-[2]"
                style={{
                  clipPath: "inset(0 50% 0 0)",
                  transformOrigin: "center center",
                  transformStyle: "preserve-3d",
                  willChange: "transform, opacity",
                  animation: "menu-left-prev-outgoing-half 0.62s linear forwards",
                }}
              >
                <img src={images[flipping.from]} alt="" className={imgClassName} />
              </div>
              <div
                className="absolute inset-0 z-[2]"
                style={{
                  clipPath: "inset(0 50% 0 0)",
                  transformOrigin: "center center",
                  transformStyle: "preserve-3d",
                  willChange: "transform, opacity",
                  animation: "menu-left-prev-incoming-half 0.62s linear forwards",
                }}
              >
                <img src={images[flipping.to]} alt="" className={imgClassName} style={{ transform: "scaleX(-1)" }} />
              </div>
            </>
          ) : (
          <div
            className="absolute inset-0 z-[2]"
            style={{
              transformStyle: "preserve-3d",
              willChange: "transform",
              // 長方形菜單僅右頁沿中線書脊翻起；其他既有書本頁面仍維持由左右頁緣翻起。
              transformOrigin: rightPageFlip || flipFromCenter ? "center center" : flipping.direction === "next" ? "left center" : "right center",
              ...(rightPageFlip ? { clipPath: "inset(0 0 0 50%)" } : {}),
            animation: `${flipping.direction === "next" ? "book-flip-next" : "book-flip-prev"} 0.62s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
            ...(flipping.direction === "prev" ? { transform: "rotateY(-180deg)" } : {}),
          }}
        >
          {/* 正面：目前頁 */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backfaceVisibility: "hidden", background: "rgba(15,23,42,0.98)" }}
          >
            <img
              src={flipping.direction === "next" ? images[flipping.from] : images[flipping.to]}
              alt=""
              className={imgClassName}
            />
            {/* 紙張翻起時的陰影 */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to right, rgba(0,0,0,0.5), rgba(0,0,0,0) 45%)",
                animation: "book-shadow-sweep 0.7s ease-in-out forwards",
              }}
            />
          </div>
          {/* 背面：翻過去的頁（鏡像模擬紙背） */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "rgba(15,23,42,0.98)",
              // 菜單右頁使用下一頁的正向紙背；同一張紙持續轉動，越過中線時自然接管，不產生交接停頓。
            }}
          >
            <img
              src={flipping.direction === "next" ? images[flipping.to] : images[flipping.from]}
              alt=""
              className={imgClassName}
              style={{ transform: "scaleX(-1)", opacity: 0.92, filter: "brightness(0.9)" }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to left, rgba(0,0,0,0.35), rgba(0,0,0,0) 50%)" }}
            />
          </div>
          </div>
          )}
        </>
      ) : null}

      {/* 書脊中線效果 */}
      <div
        className="absolute top-0 bottom-0 left-1/2 w-px pointer-events-none z-[5]"
        style={{ background: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(0,0,0,0.05))" }}
      />

      {count > 1 && (
        <>
          <button
            aria-label="上一頁"
            onClick={(e) => { e.stopPropagation(); flipTo(index - 1, "prev"); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 z-10"
          >
            ‹
          </button>
          <button
            aria-label="下一頁"
            onClick={(e) => { e.stopPropagation(); flipTo(index + 1, "next"); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 z-10"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`第 ${i + 1} 頁`}
                onClick={(e) => { e.stopPropagation(); flipTo(i, i > index ? "next" : "prev"); }}
                className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-amber-400" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
