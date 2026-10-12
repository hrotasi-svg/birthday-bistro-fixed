import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { CanvasHTMLAttributes } from "react";

const REAL_FLAME_VIDEO =
  "/manus-storage/user-real-candle-flame-complete-loop_d02cfe51.webm";
const REAL_FLAME_IOS_VIDEO =
  "/manus-storage/store-select-real-flame-ipad-baseline_0c3be663.mp4";

function prefersIosCompatibleFlameVideo() {
  const userAgent = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// The source video is 800 × 600. This crop covers the full natural rightward
// sway while framing the flame more broadly than the original tall image.
const SOURCE_CROP = { x: 280, y: 45, width: 300, height: 475 };
const MATTE_WIDTH = 180;
const MATTE_HEIGHT = 285;
const BODY_FADE_START = 0.74;
const BODY_FADE_END = 0.93;
// Keep the original flame's visual proportion, with only the requested subtle
// widening and height reduction. The surrounding CSS stage stays unchanged.
const OUTPUT_WIDTH_SCALE = 1;
const OUTPUT_HEIGHT_SCALE = 0.63;
const OUTPUT_X_OFFSET = -3;
const OUTPUT_Y_OFFSET = -9;

type FlameCanvasProps = CanvasHTMLAttributes<HTMLCanvasElement>;

function smoothstep(edgeStart: number, edgeEnd: number, value: number) {
  const unit = Math.min(
    1,
    Math.max(0, (value - edgeStart) / (edgeEnd - edgeStart))
  );
  return unit * unit * (3 - 2 * unit);
}

function isWhiteHotCore(red: number, green: number, blue: number) {
  return red + green + blue > 560 && red > 175 && green > 145 && blue > 105;
}

function isConnectedWarmFlame(red: number, green: number, blue: number) {
  return red > 82 && green > 38 && red > blue * 1.12 && red + green > 142;
}

function isDarkCompressionBridge(red: number, green: number, blue: number) {
  const brightness = Math.max(red, green, blue);
  const warmLuma = red * 0.58 + green * 0.34 + blue * 0.08;
  return brightness < 86 || (warmLuma < 94 && red - blue < 42);
}

/**
 * Turns the user's real candle video into a transparent, connected flame matte.
 * Only warm pixels joined to the white-hot flame core are preserved, so the
 * source's black backdrop and unconnected dark pixels cannot cover a rightward
 * leaning flame. The bottom fade removes the attached candle / wick body.
 */
export const StoreSelectRealFlameCanvas = forwardRef<
  HTMLCanvasElement,
  FlameCanvasProps
>(function StoreSelectRealFlameCanvas({ className, ...canvasProps }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const outputContext = canvas.getContext("2d", { alpha: true });
    const sourceCanvas = document.createElement("canvas");
    const cleanedCanvas = document.createElement("canvas");
    sourceCanvas.width = MATTE_WIDTH;
    sourceCanvas.height = MATTE_HEIGHT;
    cleanedCanvas.width = MATTE_WIDTH;
    cleanedCanvas.height = MATTE_HEIGHT;
    const sourceContext = sourceCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    const cleanedContext = cleanedCanvas.getContext("2d");
    if (!outputContext || !sourceContext || !cleanedContext) return;

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    const preferredSource = prefersIosCompatibleFlameVideo()
      ? REAL_FLAME_IOS_VIDEO
      : REAL_FLAME_VIDEO;
    let usingFallbackSource = preferredSource === REAL_FLAME_IOS_VIDEO;
    video.src = preferredSource;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-hidden", "true");

    let frameId = 0;
    let pixelRatio = 1;
    let sourceReady = false;

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      outputContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      outputContext.imageSmoothingEnabled = true;
      outputContext.imageSmoothingQuality = "high";
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const applyConnectedFlameMatte = () => {
      sourceContext.clearRect(0, 0, MATTE_WIDTH, MATTE_HEIGHT);
      sourceContext.drawImage(
        video,
        SOURCE_CROP.x,
        SOURCE_CROP.y,
        SOURCE_CROP.width,
        SOURCE_CROP.height,
        0,
        0,
        MATTE_WIDTH,
        MATTE_HEIGHT
      );
      const image = sourceContext.getImageData(0, 0, MATTE_WIDTH, MATTE_HEIGHT);
      const { data } = image;
      const connected = new Uint8Array(MATTE_WIDTH * MATTE_HEIGHT);
      const queue = new Int32Array(MATTE_WIDTH * MATTE_HEIGHT);
      let queueStart = 0;
      let queueEnd = 0;

      for (let index = 0; index < connected.length; index += 1) {
        const pixel = index * 4;
        if (isWhiteHotCore(data[pixel], data[pixel + 1], data[pixel + 2])) {
          connected[index] = 1;
          queue[queueEnd] = index;
          queueEnd += 1;
        }
      }

      while (queueStart < queueEnd) {
        const current = queue[queueStart];
        queueStart += 1;
        const x = current % MATTE_WIDTH;
        const y = Math.floor(current / MATTE_WIDTH);
        for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
          for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
            if (xOffset === 0 && yOffset === 0) continue;
            const neighborX = x + xOffset;
            const neighborY = y + yOffset;
            if (
              neighborX < 0 ||
              neighborX >= MATTE_WIDTH ||
              neighborY < 0 ||
              neighborY >= MATTE_HEIGHT
            ) {
              continue;
            }
            const neighbor = neighborY * MATTE_WIDTH + neighborX;
            if (connected[neighbor]) continue;
            const offset = neighbor * 4;
            if (
              isConnectedWarmFlame(
                data[offset],
                data[offset + 1],
                data[offset + 2]
              ) &&
              !isDarkCompressionBridge(
                data[offset],
                data[offset + 1],
                data[offset + 2]
              )
            ) {
              connected[neighbor] = 1;
              queue[queueEnd] = neighbor;
              queueEnd += 1;
            }
          }
        }
      }

      let visiblePixels = 0;
      for (let index = 0; index < connected.length; index += 1) {
        const offset = index * 4;
        if (!connected[index]) {
          data[offset] = 0;
          data[offset + 1] = 0;
          data[offset + 2] = 0;
          data[offset + 3] = 0;
          continue;
        }
        const y = Math.floor(index / MATTE_WIDTH) / (MATTE_HEIGHT - 1);
        const bodyFade = 1 - smoothstep(BODY_FADE_START, BODY_FADE_END, y);
        const brightness = Math.max(
          data[offset],
          data[offset + 1],
          data[offset + 2]
        );
        // Dark compression pixels cannot be crossed during the flood fill;
        // once a real flame pixel is connected, retain its full colour so a
        // rightward sway never appears as a front-half black cutout.
        const edgeAlpha = 0.44 + (brightness / 255) * 0.56;
        const alpha = Math.round(255 * edgeAlpha * bodyFade);
        if (alpha < 3) {
          data[offset] = 0;
          data[offset + 1] = 0;
          data[offset + 2] = 0;
          data[offset + 3] = 0;
          continue;
        }
        data[offset + 3] = alpha;
        visiblePixels += 1;
      }
      cleanedContext.putImageData(image, 0, 0);
      canvas.dataset.flameVisiblePixels = String(visiblePixels);
    };

    const render = () => {
      const cssWidth = canvas.width / pixelRatio;
      const cssHeight = canvas.height / pixelRatio;
      outputContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      outputContext.clearRect(0, 0, cssWidth, cssHeight);
      if (
        sourceReady &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        applyConnectedFlameMatte();
        const outputHeight = cssHeight * OUTPUT_HEIGHT_SCALE;
        const outputWidth =
          outputHeight * (MATTE_WIDTH / MATTE_HEIGHT) * OUTPUT_WIDTH_SCALE;
        outputContext.drawImage(
          cleanedCanvas,
          0,
          0,
          MATTE_WIDTH,
          MATTE_HEIGHT,
          (cssWidth - outputWidth) / 2 + OUTPUT_X_OFFSET,
          cssHeight - outputHeight + OUTPUT_Y_OFFSET,
          outputWidth,
          outputHeight
        );
      }
      frameId = window.requestAnimationFrame(render);
    };

    const beginPlayback = () => {
      sourceReady = true;
      canvas.dataset.flameVideoState = "ready";
	  canvas.dataset.flameVideoSource = video.src;
	  canvas.dataset.flameVideoFallback = String(usingFallbackSource);
      void video.play().catch(() => {
        canvas.dataset.flameVideoState = "ready-muted";
      });
    };
    const handleVideoError = () => {
	  if (!usingFallbackSource) {
		usingFallbackSource = true;
		video.src = REAL_FLAME_IOS_VIDEO;
		video.load();
		return;
	  }
      canvas.dataset.flameVideoState = "failed";
    };
    video.addEventListener("canplay", beginPlayback, { once: true });
    video.addEventListener("error", handleVideoError);
    video.load();
    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      video.pause();
      video.removeEventListener("canplay", beginPlayback);
      video.removeEventListener("error", handleVideoError);
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  return (
    <canvas
      {...canvasProps}
      ref={canvasRef}
      className={className}
      data-flame-renderer="connected-real-video"
    />
  );
});
