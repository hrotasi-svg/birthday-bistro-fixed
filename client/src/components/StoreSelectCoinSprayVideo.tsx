import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { applyCoinVideoMatte } from "./coinVideoMatte";

const USER_COIN_SPRAY_VIDEO =
  "/manus-storage/user-goldan-coin-batch302_51e563da.mp4";
// Retain the unchanged source, native playback cadence and geometry. The
// caller selects an existing stage window without changing the stage clock.
const BUTTERFLY_START = 0.256;
const BUTTERFLY_START_END = 0.264;
// The protected butterfly gate closes at 66.8%. Its wick-light flash runs
// before the real flame output; the real flame itself becomes visible at the
// existing 78.7% keyframe. Start there so yellow coins join the actual flame
// appearance rather than the hidden butterfly transition or a spark-only cue.
const RETURN_TO_FLAME_START = 0.787;
const RETURN_TO_FLAME_START_END = 0.795;
// Preserve the user's complete 3-second native coin video after its trigger.
// (3.00s / 16.311s) ends at 97.09% of the shared butterfly clock.
const RETURN_TO_FLAME_OUTPUT_END = 0.9709;
const VIDEO_ASPECT = 16 / 9;
// Enlarge only the visible coin effect from the batch-280 reference size.
// The locked flame-center anchor and all placement rules remain unchanged.
// Every coin remains in the same source frame, so increasing this single draw
// width enlarges the complete visible spray uniformly instead of only a subset.
// Batch 313 used 7.5. Apply one modest full-frame increase from that verified
// baseline so every coin in the same source frame scales together.
const VIDEO_WIDTH_FROM_ANCHOR = 8.2;
// Move the complete source frame slightly right while retaining the same
// shared anchor, full-frame scale, and vertical placement.
const COIN_BURST_OFFSET_X = -4;
const COIN_BURST_OFFSET_Y = 14;

type CoinSprayVideoProps = {
  motionSourceRef: RefObject<HTMLSpanElement | null>;
  flameRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  triggerPhase: "butterfly-visible" | "return-to-flame";
};

function getCycleProgress(element: HTMLSpanElement | null) {
  const animation = element
    ?.getAnimations()
    .find(
      item =>
        (item as CSSAnimation).animationName ===
        "store-select-original-gif-cycle-clock"
    );
  const progress = animation?.effect?.getComputedTiming().progress;
  return progress === null || progress === undefined ? null : progress;
}

/**
 * Draws only the user's latest 3-second coin clip. Black source pixels become
 * transparent per frame; no black layer and no synthetic post-video falling
 * coins are retained. The clip's own return completes before the next flight.
 */
export function StoreSelectCoinSprayVideo({
  motionSourceRef,
  flameRef,
  enabled,
  triggerPhase,
}: CoinSprayVideoProps) {
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

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = USER_COIN_SPRAY_VIDEO;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const matte = document.createElement("canvas");
    matte.width = 480;
    matte.height = 270;
    const matteContext = matte.getContext("2d", { willReadFrequently: true });
    if (!matteContext) return;

    let frameId = 0;
    let pixelRatio = 1;
    let playing = false;
    let startRequested = false;
    let burstActive = false;
    let lastStartAt = -Infinity;
    let lastFrameAt = performance.now();

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

    const removeBlackBackdrop = () => {
      matteContext.clearRect(0, 0, matte.width, matte.height);
      matteContext.drawImage(video, 0, 0, matte.width, matte.height);
      const image = matteContext.getImageData(0, 0, matte.width, matte.height);
      const { data } = image;
      let visiblePixels = 0;
      let removedBackdropPixels = 0;
      for (let offset = 0; offset < data.length; offset += 4) {
        if (!applyCoinVideoMatte(data, offset)) {
          removedBackdropPixels += 1;
          continue;
        }
        visiblePixels += 1;
      }
      matteContext.putImageData(image, 0, 0);
      canvas.dataset.coinVisiblePixels = String(visiblePixels);
      canvas.dataset.coinBackdropPixelsRemoved = String(removedBackdropPixels);
    };

    const drawVideo = () => {
      const flame = flameRef.current;
      if (!flame || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      const cssWidth = canvas.width / pixelRatio;
      const cssHeight = canvas.height / pixelRatio;
      const canvasRect = canvas.getBoundingClientRect();
      const flameRect = flame.getBoundingClientRect();
      const anchorRect = canvas.parentElement?.getBoundingClientRect();
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
      const drawWidth = Math.max(
        1,
        (anchorRect?.width ?? flameRect.width) * VIDEO_WIDTH_FROM_ANCHOR
      );
      const drawHeight = drawWidth / VIDEO_ASPECT;
      removeBlackBackdrop();
      context.save();
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      const drawX = sourceX - drawWidth / 2;
      const drawY = sourceY - drawHeight;
      context.drawImage(
        matte,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );
      context.restore();
      canvas.dataset.coinDrawWidth = String(drawWidth);
      canvas.dataset.coinAnchor = "fc0c1455-flame-center";
      canvas.dataset.coinSizeReference =
        "batch319-batch313-reference-7.5-uniformly-enlarged-to-8.2-all-frame-safe-bounds-right-nudge-offset-minus-4-down-offset-14";
      canvas.dataset.coinDrawBounds = JSON.stringify({
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
        canvasWidth: cssWidth,
        canvasHeight: cssHeight,
      });
    };

    const recallToFlame = () => {
      if (!playing && !startRequested) return;
      playing = false;
      startRequested = false;
      canvas.dataset.coinState = "source-video-recalled-flame-visible";
      canvas.dataset.coinExitState = "source-video-recalled";
      canvas.dataset.coinFallingCount = "0";
    };

    const startVideo = (now: number) => {
      if (
        playing ||
        startRequested ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        return;
      }
      startRequested = true;
      video.currentTime = 0;
      video.playbackRate = 1;
      canvas.dataset.coinExitState = "source-video-spraying";
      canvas.dataset.coinFallingCount = "0";
      canvas.dataset.coinCycleState =
        "butterfly-returned-flame-flash-coin-spray";
      lastStartAt = now;
      lastFrameAt = now;
      void video
        .play()
        .then(() => {
          playing = true;
          startRequested = false;
          canvas.dataset.coinState = "playing-user-video";
        })
        .catch(() => {
          startRequested = false;
          canvas.dataset.coinState = "video-playback-blocked";
        });
    };

    const render = (now: number) => {
      const delta = Math.min((now - lastFrameAt) / 1000, 0.05);
      lastFrameAt = now;
      const cssWidth = canvas.width / pixelRatio;
      const cssHeight = canvas.height / pixelRatio;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, cssWidth, cssHeight);

      const progress = getCycleProgress(motionSourceRef.current);
      const inButterflyStartWindow =
        progress !== null &&
        progress >= BUTTERFLY_START &&
        progress <= BUTTERFLY_START_END;
      const inReturnToFlameWindow =
        progress !== null &&
        progress >= RETURN_TO_FLAME_START &&
        progress <= RETURN_TO_FLAME_START_END;
      const inSelectedStartWindow =
        triggerPhase === "return-to-flame"
          ? inReturnToFlameWindow
          : inButterflyStartWindow;
      // The yellow wrapper must read the same original-GIF clock as playback.
      // A separate CSS animation restarts when the colour class changes and can
      // desynchronise from the butterfly. This affects display visibility only;
      // source frames, canvas matte, dimensions and native playback remain intact.
      const returnOutputVisible =
        triggerPhase === "return-to-flame" &&
        enabled &&
        progress !== null &&
        progress >= RETURN_TO_FLAME_START &&
        progress <= RETURN_TO_FLAME_OUTPUT_END;
      if (triggerPhase === "return-to-flame") {
        canvas.parentElement?.style.setProperty(
          "opacity",
          returnOutputVisible ? "1" : "0"
        );
        canvas.dataset.coinOutputGate = returnOutputVisible
          ? "return-flame-native-output-visible"
          : "return-flame-native-output-hidden";
      }
      if (
        enabled &&
        inSelectedStartWindow &&
        !burstActive &&
        now - lastStartAt > 4500
      ) {
        startVideo(now);
      }
      burstActive = inSelectedStartWindow;

      if (enabled && playing && !video.ended) {
        drawVideo();
      } else if (playing && video.ended) {
        recallToFlame();
      }
      canvas.dataset.coinFrameDelta = String(delta);
      frameId = window.requestAnimationFrame(render);
    };

    video.addEventListener("canplay", () => {
      canvas.dataset.coinVideoState = "ready";
    });
    video.addEventListener("ended", recallToFlame);
    video.addEventListener("error", () => {
      canvas.dataset.coinVideoState = "failed";
    });
    canvas.dataset.coinRenderer = "user-uploaded-video-black-matte";
    canvas.dataset.coinMatteMode = "warm-metal-and-highlight-no-black-frame";
    canvas.dataset.coinCompositeMode = "transparent-normal-alpha-no-black-frame";
    canvas.dataset.coinVideoSource = USER_COIN_SPRAY_VIDEO;
    canvas.dataset.coinSizeReference = "fc0c1455-container-unchanged";
    canvas.dataset.coinTriggerPhase = triggerPhase;
    canvas.dataset.coinExitState = "source-video-idle";
    video.load();
    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      canvas.parentElement?.style.removeProperty("opacity");
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [enabled, flameRef, motionSourceRef, triggerPhase]);

  return (
    <canvas
      ref={canvasRef}
      className="store-select-webgl-coin-fountain-canvas"
      aria-hidden="true"
    />
  );
}
