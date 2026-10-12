import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const GOLD_DUST_STAR = "/manus-storage/gold-dust-star-cc0_bbd3bebd.png";
const FLIGHT_START = 0.256;
const FLIGHT_END = 0.668;
const MAX_PARTICLES = 420;

type GoldDustProps = {
  motionSourceRef: RefObject<HTMLSpanElement | null>;
  tailAnchorRef: RefObject<HTMLSpanElement | null>;
};

type GoldParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  age: number;
  lifetime: number;
  shimmer: number;
  star: boolean;
};

function getCycleProgress(element: HTMLSpanElement | null) {
  const animation = element
    ?.getAnimations()
    .find(
      item =>
        (item as CSSAnimation).animationName ===
        "store-select-flame-butterfly-side-profile-cycle"
    );
  const progress = animation?.effect?.getComputedTiming().progress;
  return progress === null || progress === undefined ? null : progress;
}

/** Restored original butterfly-tail gold dust canvas. */
export function StoreSelectGoldDustCanvas({
  motionSourceRef,
  tailAnchorRef,
}: GoldDustProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const particles: GoldParticle[] = [];
    const starImage = new Image();
    let starMask: HTMLCanvasElement | null = null;
    const makeStarMask = () => {
      if (starImage.naturalWidth < 1 || starImage.naturalHeight < 1) return;
      const source = document.createElement("canvas");
      source.width = starImage.naturalWidth;
      source.height = starImage.naturalHeight;
      const sourceContext = source.getContext("2d", {
        willReadFrequently: true,
      });
      const maskContext = source.getContext("2d");
      if (!sourceContext || !maskContext) return;
      try {
        sourceContext.drawImage(starImage, 0, 0);
        const sourcePixels = sourceContext.getImageData(
          0,
          0,
          source.width,
          source.height
        );
        const goldPixels = maskContext.createImageData(
          source.width,
          source.height
        );
        for (let offset = 0; offset < sourcePixels.data.length; offset += 4) {
          const luminance =
            (sourcePixels.data[offset] +
              sourcePixels.data[offset + 1] +
              sourcePixels.data[offset + 2]) /
            (3 * 255);
          const alpha = Math.pow(Math.max(0, (luminance - 0.09) / 0.91), 1.3);
          goldPixels.data[offset] = 255;
          goldPixels.data[offset + 1] = 217;
          goldPixels.data[offset + 2] = 119;
          goldPixels.data[offset + 3] = Math.round(alpha * 255);
        }
        maskContext.putImageData(goldPixels, 0, 0);
        starMask = source;
        canvas.dataset.starMaskState = "ready";
        canvas.dataset.starMaskCornerAlpha = String(goldPixels.data[3]);
      } catch {
        starMask = null;
        canvas.dataset.starMaskState = "failed";
      }
    };
    starImage.crossOrigin = "anonymous";
    starImage.onload = makeStarMask;
    starImage.src = GOLD_DUST_STAR;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    const previousTail = { x: 0, y: 0, ready: false };
    const lastEmissionTail = { x: 0, y: 0, ready: false };
    let frameId = 0;
    let lastFrame = performance.now();
    let lastEmission = -Infinity;
    let pixelRatio = 1;

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const emit = (
      x: number,
      y: number,
      directionX: number,
      directionY: number
    ) => {
      const tierSizes = [1.48, 0.78, 0.35];
      for (let index = 0; index < 3; index += 1) {
        const tier =
          index === 0 ? 0 : Math.min(tierSizes.length - 1, 1 + (index % 4));
        const random = Math.random();
        particles.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: directionX * (0.85 + random * 1.35) + (Math.random() - 0.5) * 4,
          vy: directionY * (0.65 + random * 0.9) + (Math.random() - 0.5) * 3,
          size: tierSizes[tier] * (0.82 + random * 0.42),
          age: 0,
          lifetime: 0.64 + random * 0.42,
          shimmer: Math.random() * Math.PI * 2,
          star: tier === 0 && random > 0.78,
        });
      }
      if (particles.length > MAX_PARTICLES) {
        particles.splice(0, particles.length - MAX_PARTICLES);
      }
    };

    const drawParticle = (particle: GoldParticle, time: number) => {
      const life = particle.age / particle.lifetime;
      const fade = Math.sin(Math.min(1, life) * Math.PI);
      const flash = Math.pow(
        Math.max(
          0,
          Math.sin(time * (12 + particle.size * 3) + particle.shimmer)
        ),
        5
      );
      const alpha = fade * (0.16 + flash * 0.64);
      if (alpha <= 0.01) return;

      context.save();
      context.globalAlpha = alpha;
      if (particle.star && starMask) {
        const diameter = particle.size * 2.7;
        context.globalCompositeOperation = "lighter";
        context.drawImage(
          starMask,
          particle.x - diameter / 2,
          particle.y - diameter / 2,
          diameter,
          diameter
        );
        context.globalCompositeOperation = "source-over";
      } else {
        const glowRadius = Math.max(0.7, particle.size * 1.35);
        const gradient = context.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          glowRadius
        );
        gradient.addColorStop(0, "rgba(255, 255, 236, 1)");
        gradient.addColorStop(0.28, "rgba(255, 224, 120, 1)");
        gradient.addColorStop(0.66, "rgba(255, 170, 48, .72)");
        gradient.addColorStop(1, "rgba(255, 126, 20, 0)");
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    };

    const render = (now: number) => {
      const delta = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      const cssWidth = canvas.width / pixelRatio;
      const cssHeight = canvas.height / pixelRatio;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, cssWidth, cssHeight);
      context.globalCompositeOperation = "source-over";

      const progress = getCycleProgress(motionSourceRef.current);
      const tailAnchor = tailAnchorRef.current;
      if (
        tailAnchor &&
        progress !== null &&
        progress >= FLIGHT_START &&
        progress <= FLIGHT_END
      ) {
        const canvasRect = canvas.getBoundingClientRect();
        const tailRect = tailAnchor.getBoundingClientRect();
        const x = tailRect.left + tailRect.width / 2 - canvasRect.left;
        const y = tailRect.top + tailRect.height / 2 - canvasRect.top;
        const deltaX = previousTail.ready ? x - previousTail.x : -1;
        const deltaY = previousTail.ready ? y - previousTail.y : 0;
        const distance = Math.hypot(deltaX, deltaY) || 1;
        const directionX = deltaX / distance;
        const directionY = deltaY / distance;
        const emissionDistance = lastEmissionTail.ready
          ? Math.hypot(x - lastEmissionTail.x, y - lastEmissionTail.y)
          : Number.POSITIVE_INFINITY;
        if (emissionDistance >= 1.15 && now - lastEmission >= 32) {
          emit(x, y, directionX, directionY);
          lastEmission = now;
          lastEmissionTail.x = x;
          lastEmissionTail.y = y;
          lastEmissionTail.ready = true;
        }
        previousTail.x = x;
        previousTail.y = y;
        previousTail.ready = true;
      } else {
        previousTail.ready = false;
        lastEmissionTail.ready = false;
      }

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.age += delta;
        if (particle.age >= particle.lifetime) {
          particles.splice(index, 1);
          continue;
        }
        particle.vy += 64 * delta;
        particle.vx *= 0.984;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        drawParticle(particle, now / 1000);
      }
      canvas.dataset.particleCount = String(particles.length);
      context.globalCompositeOperation = "source-over";
      frameId = window.requestAnimationFrame(render);
    };
    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      starImage.src = "";
      starMask = null;
    };
  }, [motionSourceRef, tailAnchorRef]);

  return (
    <canvas
      ref={canvasRef}
      className="store-select-webgl-gold-dust-canvas"
      aria-hidden="true"
    />
  );
}
