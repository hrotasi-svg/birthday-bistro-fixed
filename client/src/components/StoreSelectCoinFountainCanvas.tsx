import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const COIN_SHEET = "/manus-storage/spinning-gold-coin-cc0_e7540c2b.png";
const REKINDLE_START = 0.674;
// (0.814 - 0.674) × 7.166 seconds = 1.003 seconds.
const REKINDLE_END = 0.814;
const MAX_COINS = 54;
const COIN_FRAMES = [0, 1, 2, 5, 6, 7] as const;
const COIN_SOURCE_INSET = 2;
// Keep the fountain's canvas and physics intact; offset only the event origin
// so the complete CC0 coin burst is slightly left and below the flame head.
const COIN_BURST_OFFSET_X = -10;
const COIN_BURST_OFFSET_Y = 6;

type CoinParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  age: number;
  lifetime: number;
  frameOffset: number;
  mirror: boolean;
};

type CoinDustParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  age: number;
  lifetime: number;
  shimmer: number;
};

type CoinFountainProps = {
  motionSourceRef: RefObject<HTMLSpanElement | null>;
  flameRef: RefObject<HTMLElement | null>;
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

/**
 * Restores the original CC0 coin-sheet fountain. Every draw is clipped to the
 * coin's circular silhouette, so the sheet's square frame cannot be shown.
 * A small independent gold-dust group is emitted only with the coin burst.
 */
export function StoreSelectCoinFountainCanvas({
  motionSourceRef,
  flameRef,
}: CoinFountainProps) {
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

    const particles: CoinParticle[] = [];
    const dustParticles: CoinDustParticle[] = [];
    const coinSheet = new Image();
    coinSheet.crossOrigin = "anonymous";
    coinSheet.src = COIN_SHEET;
    coinSheet.onload = () => {
      canvas.dataset.coinSheetState = "ready";
    };
    coinSheet.onerror = () => {
      canvas.dataset.coinSheetState = "failed";
    };
    canvas.dataset.coinRenderer = "original-cc0-circle-clipped";
    canvas.dataset.coinDustRenderer = "radial-gold";

    let frameId = 0;
    let lastFrame = performance.now();
    let pixelRatio = 1;
    let burstActive = false;
    let lastBurstAt = -Infinity;

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

    const burstFromFlame = (count: number) => {
      const flame = flameRef.current;
      if (!flame || coinSheet.naturalWidth < 8) return;
      const canvasRect = canvas.getBoundingClientRect();
      const flameRect = flame.getBoundingClientRect();
      const sourceX =
        flameRect.left +
        flameRect.width * 0.5 -
        canvasRect.left +
        COIN_BURST_OFFSET_X;
      const sourceY =
        flameRect.top +
        flameRect.height * 0.63 -
        canvasRect.top +
        COIN_BURST_OFFSET_Y;
      for (let index = 0; index < count; index += 1) {
        const depth = Math.random();
        const direction = Math.random() * Math.PI - Math.PI / 2;
        const speed = 118 + Math.random() * 126;
        particles.push({
          x: sourceX + (Math.random() - 0.5) * 5,
          y: sourceY + (Math.random() - 0.5) * 5,
          vx: Math.sin(direction) * speed * (0.64 + depth * 0.46),
          vy: -Math.cos(direction) * speed * (0.88 + depth * 0.52),
          // The previous 2.85–7.60px range was visually too subtle on the
          // oversized event canvas. Preserve the same CC0 frame and circular
          // clip, but make the visible 4.25–11.50px range clearly larger.
          size: 4.25 + depth * 7.25,
          age: 0,
          lifetime: 1.04 + Math.random() * 0.42,
          frameOffset: Math.floor(Math.random() * COIN_FRAMES.length),
          mirror: Math.random() > 0.5,
        });
        // The requested additional gold dust is emitted only in the coin
        // event, leaving the restored butterfly dust behaviour untouched.
        if (index % 4 === 0) {
          const dustAngle = direction + (Math.random() - 0.5) * 0.7;
          const dustSpeed = 42 + Math.random() * 54;
          dustParticles.push({
            x: sourceX + (Math.random() - 0.5) * 5,
            y: sourceY + (Math.random() - 0.5) * 5,
            vx: Math.sin(dustAngle) * dustSpeed,
            vy: -Math.cos(dustAngle) * dustSpeed,
            size: 0.68 + Math.random() * 1.32,
            age: 0,
            lifetime: 0.48 + Math.random() * 0.38,
            shimmer: Math.random() * Math.PI * 2,
          });
        }
      }
      if (particles.length > MAX_COINS) {
        particles.splice(0, particles.length - MAX_COINS);
      }
      if (dustParticles.length > 44) {
        dustParticles.splice(0, dustParticles.length - 44);
      }
      canvas.dataset.lastCoinBurst = "rekindle";
    };

    const drawCoin = (particle: CoinParticle) => {
      const life = particle.age / particle.lifetime;
      const alpha = Math.min(1, life * 7) * Math.pow(1 - life, 0.62);
      if (alpha <= 0.01 || coinSheet.naturalWidth < 8) return;
      const frameWidth = coinSheet.naturalWidth / 8;
      const frame =
        COIN_FRAMES[
          Math.floor(
            (particle.age * 12 + particle.frameOffset) % COIN_FRAMES.length
          )
        ];
      const sourceInset = COIN_SOURCE_INSET + 2;
      const sourceSize = frameWidth - sourceInset * 2;
      context.save();
      context.globalAlpha = alpha;
      context.imageSmoothingEnabled = true;
      context.translate(particle.x, particle.y);
      if (particle.mirror) context.scale(-1, 1);
      // This circle is deliberately the only visible source boundary: no
      // rectangular media pixels can escape the canvas clip.
      context.beginPath();
      context.ellipse(
        0,
        0,
        particle.size * 0.49,
        particle.size * 0.49,
        0,
        0,
        Math.PI * 2
      );
      context.clip();
      context.drawImage(
        coinSheet,
        frame * frameWidth + sourceInset,
        sourceInset,
        sourceSize,
        coinSheet.naturalHeight - sourceInset * 2,
        -particle.size / 2,
        -particle.size / 2,
        particle.size,
        particle.size
      );
      context.restore();
    };

    const drawCoinDust = (particle: CoinDustParticle, time: number) => {
      const life = particle.age / particle.lifetime;
      const fade = Math.sin(Math.min(1, life) * Math.PI);
      const flash = Math.pow(
        Math.max(0, Math.sin(time * 14 + particle.shimmer)),
        5
      );
      const alpha = fade * (0.3 + flash * 0.64);
      if (alpha <= 0.01) return;
      const radius = Math.max(0.75, particle.size * 1.4);
      const glow = context.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        radius
      );
      glow.addColorStop(0, "rgba(255, 255, 235, 1)");
      glow.addColorStop(0.32, "rgba(255, 222, 104, .94)");
      glow.addColorStop(1, "rgba(227, 147, 28, 0)");
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = glow;
      context.beginPath();
      context.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      context.fill();
      // A short cross-shaped glint makes each coin-event gold particle visibly
      // sparkle rather than only fading as a round glow.
      if (flash > 0.12) {
        const ray = radius * (0.9 + flash * 1.7);
        context.globalAlpha = alpha * (0.38 + flash * 0.62);
        context.strokeStyle = "rgba(255, 250, 213, .96)";
        context.lineWidth = Math.max(0.42, particle.size * 0.36);
        context.beginPath();
        context.moveTo(particle.x - ray, particle.y);
        context.lineTo(particle.x + ray, particle.y);
        context.moveTo(particle.x, particle.y - ray);
        context.lineTo(particle.x, particle.y + ray);
        context.stroke();
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

      const progress = getCycleProgress(motionSourceRef.current);
      const inRekindleWindow =
        progress !== null &&
        progress >= REKINDLE_START &&
        progress <= REKINDLE_END;
      if (inRekindleWindow && !burstActive) {
        burstFromFlame(20);
        lastBurstAt = now;
      } else if (inRekindleWindow && now - lastBurstAt >= 110) {
        burstFromFlame(6);
        lastBurstAt = now;
      }
      burstActive = inRekindleWindow;

      for (let index = dustParticles.length - 1; index >= 0; index -= 1) {
        const particle = dustParticles[index];
        particle.age += delta;
        if (particle.age >= particle.lifetime) {
          dustParticles.splice(index, 1);
          continue;
        }
        particle.vy += 72 * delta;
        particle.vx *= 0.987;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        drawCoinDust(particle, now / 1000);
      }

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.age += delta;
        if (particle.age >= particle.lifetime) {
          particles.splice(index, 1);
          continue;
        }
        particle.vy += 228 * delta;
        particle.vx *= 0.992;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        drawCoin(particle);
      }
      canvas.dataset.coinCount = String(particles.length);
      canvas.dataset.coinDustCount = String(dustParticles.length);
      frameId = window.requestAnimationFrame(render);
    };
    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      coinSheet.src = "";
    };
  }, [flameRef, motionSourceRef]);

  return (
    <canvas
      ref={canvasRef}
      className="store-select-webgl-coin-fountain-canvas"
      aria-hidden="true"
    />
  );
}
