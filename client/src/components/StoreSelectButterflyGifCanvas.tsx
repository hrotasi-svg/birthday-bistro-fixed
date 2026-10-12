import { useEffect, useRef } from "react";
import type { CSSProperties, RefObject } from "react";

const GIF_FRAME_WIDTH = 640;
const GIF_FRAME_HEIGHT = 360;
const GIF_FRAME_INTERVAL = 1000 / 25;
const RETURN_START = 0.441;
const RETURN_END = 0.668;

type ButterflyGifCanvasProps = {
  source: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

type ButterflyGifTrailProps = {
  imageSourceRef: RefObject<HTMLCanvasElement | null>;
  motionSourceRef: RefObject<HTMLElement | null>;
  className?: string;
  style?: CSSProperties;
};

type TrailFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: number;
};

/**
 * Draws the user-supplied GIF directly, then removes only its neutral near-black
 * stage pixels at display time. Saturated wing and glow pixels stay untouched.
 */
function matteNearBlackBackdrop(context: CanvasRenderingContext2D) {
  const frame = context.getImageData(0, 0, GIF_FRAME_WIDTH, GIF_FRAME_HEIGHT);
  const { data } = frame;

  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const chroma = max - min;

    if (max <= 22 || (max <= 42 && chroma <= 13)) {
      data[offset + 3] = 0;
    } else if (max < 58 && chroma < 19) {
      data[offset + 3] = Math.round(
        data[offset + 3] * Math.max(0, (max - 22) / 36)
      );
    }
  }

  context.putImageData(frame, 0, 0);
}

export function StoreSelectButterflyGifCanvas({
  source,
  canvasRef,
}: ButterflyGifCanvasProps) {
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    canvas.width = GIF_FRAME_WIDTH;
    canvas.height = GIF_FRAME_HEIGHT;
    canvas.dataset.butterflyRenderer = "uploaded-original-gif-display-matte";

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = source;
    let lastDrawAt = -GIF_FRAME_INTERVAL;
    let stopped = false;

    const draw = (now: number) => {
      if (stopped) return;
      if (image.complete && image.naturalWidth > 0 && now - lastDrawAt >= GIF_FRAME_INTERVAL) {
        lastDrawAt = now;
        context.clearRect(0, 0, GIF_FRAME_WIDTH, GIF_FRAME_HEIGHT);
        context.drawImage(image, 0, 0, GIF_FRAME_WIDTH, GIF_FRAME_HEIGHT);
        try {
          matteNearBlackBackdrop(context);
          canvas.dataset.butterflyMatte = "neutral-near-black-transparent";
        } catch {
          // The original GIF remains the source. If a browser blocks pixel
          // readback, preserve its animation and keep the screen-composite
          // fallback rather than replacing it with a generated butterfly.
          canvas.dataset.butterflyMatte =
            "screen-composite-fallback-no-pixel-readback";
        }
      }
      animationFrame.current = window.requestAnimationFrame(draw);
    };

    animationFrame.current = window.requestAnimationFrame(draw);
    return () => {
      stopped = true;
      if (animationFrame.current !== null) {
        window.cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [canvasRef, source]);

  return (
    <canvas
      ref={canvasRef}
      className="store-select-uploaded-butterfly-gif"
      aria-hidden="true"
    />
  );
}

/**
 * The trail samples the already-matted GIF canvas only during the pre-existing
 * return leg (44.1%–66.8%). It reads the wrapper's native CSS animation progress
 * but never writes transforms, positions, or timing back to that wrapper.
 */
export function StoreSelectButterflyGifReturnTrail({
  imageSourceRef,
  motionSourceRef,
  className,
  style,
}: ButterflyGifTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const frames: TrailFrame[] = [];
    let animationFrame: number | null = null;
    let lastEmission = 0;
    let stopped = false;

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    resizeCanvas();

    const getReturnProgress = () => {
      const source = motionSourceRef.current;
      const animation = source
        ?.getAnimations()
        .find(
          candidate =>
            candidate instanceof CSSAnimation &&
            candidate.animationName ===
            "store-select-flame-butterfly-side-profile-cycle"
        );
      const progress = animation?.effect?.getComputedTiming().progress;
      return typeof progress === "number" ? progress : null;
    };

    const render = (now: number) => {
      if (stopped) return;
      const sourceCanvas = imageSourceRef.current;
      const motionSource = motionSourceRef.current;
      const canvasBounds = canvas.getBoundingClientRect();
      const progress = getReturnProgress();
      const isReturning =
        progress !== null && progress >= RETURN_START && progress <= RETURN_END;

      if (
        isReturning &&
        sourceCanvas &&
        motionSource &&
        sourceCanvas.width > 0 &&
        now - lastEmission >= 76
      ) {
        const sourceBounds = sourceCanvas.getBoundingClientRect();
        const motionBounds = motionSource.getBoundingClientRect();
        const movingEnough =
          frames.length === 0 ||
          Math.hypot(
            sourceBounds.left - canvasBounds.left - frames.at(-1)!.x,
            sourceBounds.top - canvasBounds.top - frames.at(-1)!.y
          ) >= Math.max(1.1, motionBounds.width * 0.018);

        if (movingEnough) {
          frames.push({
            x: sourceBounds.left - canvasBounds.left,
            y: sourceBounds.top - canvasBounds.top,
            width: sourceBounds.width,
            height: sourceBounds.height,
            createdAt: now,
          });
          if (frames.length > 9) frames.shift();
          lastEmission = now;
        }
      } else if (!isReturning) {
        frames.length = 0;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      if (sourceCanvas) {
        frames.forEach((frame, index) => {
          const age = (now - frame.createdAt) / 1000;
          const alpha = Math.max(0, (index + 1) / frames.length * 0.24 - age * 0.22);
          if (alpha <= 0) return;
          context.globalAlpha = alpha;
          context.drawImage(
            sourceCanvas,
            frame.x,
            frame.y,
            frame.width,
            frame.height
          );
        });
      }
      context.globalAlpha = 1;
      canvas.dataset.butterflyReturnTrail =
        isReturning && frames.length > 0
          ? "uploaded-gif-following-existing-return-arc"
          : "idle";
      animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render);
    return () => {
      stopped = true;
      observer.disconnect();
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, [imageSourceRef, motionSourceRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`store-select-butterfly-return-trail ${className ?? ""}`}
      style={style}
      aria-hidden="true"
    />
  );
}
