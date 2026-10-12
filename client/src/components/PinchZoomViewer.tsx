import { useState, useRef, useCallback, useEffect } from "react";

interface PinchZoomViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
  backLabel?: string;
}

export default function PinchZoomViewer({ src, alt = "圖片", onClose, backLabel = "返回" }: PinchZoomViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.max(0.5, Math.min(5, s + delta)));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setIsDragging(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scaleDelta = (dist - lastDist.current) * 0.01;
      setScale((s) => Math.max(0.5, Math.min(5, s + scaleDelta)));
      lastDist.current = dist;
    } else if (e.touches.length === 1 && lastTouch.current && isDragging) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      setPosition((p) => ({ x: p.x + dx, y: p.y + dy }));
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    lastDist.current = null;
    lastTouch.current = null;
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    lastTouch.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !lastTouch.current) return;
    const dx = e.clientX - lastTouch.current.x;
    const dy = e.clientY - lastTouch.current.y;
    setPosition((p) => ({ x: p.x + dx, y: p.y + dy }));
    lastTouch.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    lastTouch.current = null;
    setIsDragging(false);
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Prevent page scroll when interacting with the viewer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preventScroll = (e: TouchEvent) => { e.preventDefault(); };
    el.addEventListener("touchmove", preventScroll, { passive: false });
    return () => { el.removeEventListener("touchmove", preventScroll); };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-gray-700">
        <button onClick={onClose}
          className="text-white text-sm bg-slate-700 px-3 py-1.5 rounded hover:bg-slate-600">
          ← {backLabel}
        </button>
        <span className="text-gray-400 text-xs">手指縮放可移動頁面</span>
        <div className="flex gap-2">
          <button onClick={() => setScale((s) => Math.min(5, s + 0.3))}
            className="text-white text-sm bg-slate-700 px-3 py-1.5 rounded hover:bg-slate-600">+</button>
          <button onClick={() => setScale((s) => Math.max(0.5, s - 0.3))}
            className="text-white text-sm bg-slate-700 px-3 py-1.5 rounded hover:bg-slate-600">−</button>
          <button onClick={handleReset}
            className="text-white text-xs bg-slate-700 px-2 py-1.5 rounded hover:bg-slate-600">重置</button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 overflow-hidden flex items-center justify-center"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
      >
        <img
          src={src}
          alt={alt}
          className="select-none pointer-events-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.1s ease-out",
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
          draggable={false}
        />
      </div>

      {/* Zoom info */}
      <div className="text-center py-2 bg-black/80 border-t border-gray-700">
        <span className="text-gray-400 text-xs">{Math.round(scale * 100)}% ｜ 雙指縮放 ｜ 拖曳移動</span>
      </div>
    </div>
  );
}
