import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  getFrontBranchId,
  isBranchVisible,
  setFrontBranchId,
} from "@/lib/branch";

const STORE_SELECT_BACKGROUND =
  "/manus-storage/store-select-background_908cfe33.png";
const STORE_SELECT_COMPOSITE_LOGO_VIDEO =
  "/manus-storage/lv_0_20260905022220_acf9827f.mp4";
const STORE_SELECT_COMPOSITE_LOGO_POSTER =
  "/manus-storage/store-select-composite-logo-poster_78b701b2.png";

const STORE_SELECT_SOCIAL_LINKS = [
  {
    name: "LINE",
    href: "https://line.me/R/ti/p/@426jaurn",
    icon: "/manus-storage/line-social-icon_3b092264.png",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/tankabinggui_bistro?igsh=MWgwMjV1OWUwOGhvZw==",
    icon: "/manus-storage/instagram-social-icon_68b4650c.png",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@ajdoll0612?_r=1&_t=ZS-98dKVTKmnUi",
    icon: "/manus-storage/tiktok-social-icon_19c48f3f.png",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/tankabinggui",
    icon: "/manus-storage/facebook-social-icon_421b6ea5.png",
  },
];
const FLAME_COLOR_CYCLE = [
  "orange",
  "pink",
  "blue",
  "cyan",
  "purple",
  "rainbow",
] as const;
type FlameColor = (typeof FLAME_COLOR_CYCLE)[number];
export default function StoreSelectPage() {
  const [, navigate] = useLocation();
  const { data: branches = [], isLoading: branchesLoading } =
    trpc.branch.list.useQuery();
  const { data: storeSelectSettings } = trpc.system.settings.get.useQuery({
    branchId: getFrontBranchId(),
  });
  const flameEffectEnabled =
    storeSelectSettings?.storeSelectFlameEffect !== false;
  const storeSelectSocialIconsVisible =
    storeSelectSettings?.storeSelectSocialIconsVisible !== false;
  const configuredFlameColor = storeSelectSettings?.storeSelectFlameColor;
  const configuredFlameColorValue = FLAME_COLOR_CYCLE.includes(
    configuredFlameColor as FlameColor
  )
    ? (configuredFlameColor as FlameColor)
    : "orange";
  const [selectedFlameColor, setSelectedFlameColor] =
    useState<FlameColor | null>(null);
  const [fusionFlameVisible, setFusionFlameVisible] = useState(true);
  const [birthdayCopyEnabled, setBirthdayCopyEnabled] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const flameLongPressTimer = useRef<number | null>(null);
  const flameQuickTapResetTimer = useRef<number | null>(null);
  const flameQuickTapCount = useRef(0);
  const flameLongPressTriggered = useRef(false);
  const flamePointerOwnsPress = useRef(false);
  const flameColor = selectedFlameColor ?? configuredFlameColorValue;
  const compositeLogoVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = compositeLogoVideoRef.current;
    if (!video) return;
    video.controls = false;
    video.muted = true;
    video.defaultPlaybackRate = 1;
    video.playbackRate = 1;
    const keepNativePlaybackRate = () => {
      if (video.playbackRate !== 1) video.playbackRate = 1;
    };
    const ensurePlayback = () => {
      if (!video.paused) return;
      void video.play().catch(() => {
        // Muted inline autoplay is allowed on iOS; if a browser still delays it,
        // the poster keeps the first frame visible without a native play overlay.
      });
    };
    video.addEventListener("ratechange", keepNativePlaybackRate);
    video.addEventListener("loadedmetadata", ensurePlayback, { once: true });
    ensurePlayback();
    return () => {
      video.removeEventListener("ratechange", keepNativePlaybackRate);
      video.removeEventListener("loadedmetadata", ensurePlayback);
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const syncReducedMotion = () => setPrefersReducedMotion(query.matches);
    syncReducedMotion();
    query.addEventListener?.("change", syncReducedMotion);
    return () => query.removeEventListener?.("change", syncReducedMotion);
  }, []);

  const flameColorClass = `store-select-flame-color-${flameColor}`;
  const compositeLogoStyle = {
    opacity: fusionFlameVisible ? 1 : 0,
  } as CSSProperties;

  const handleFlameColorCycle = () => {
    setSelectedFlameColor(currentColor => {
      const activeColor = currentColor ?? configuredFlameColorValue;
      return FLAME_COLOR_CYCLE[
        (FLAME_COLOR_CYCLE.indexOf(activeColor) + 1) % FLAME_COLOR_CYCLE.length
      ];
    });
  };

  const handleFlameQuickTap = () => {
    flameQuickTapCount.current += 1;
    if (flameQuickTapCount.current === 2) {
      if (flameQuickTapResetTimer.current) {
        window.clearTimeout(flameQuickTapResetTimer.current);
        flameQuickTapResetTimer.current = null;
      }
      flameQuickTapCount.current = 0;
      setBirthdayCopyEnabled(visible => !visible);
      return;
    }
    flameQuickTapResetTimer.current = window.setTimeout(() => {
      flameQuickTapCount.current = 0;
      flameQuickTapResetTimer.current = null;
      handleFlameColorCycle();
    }, 280);
  };

  const handleFlamePointerDown = (
    event: ReactPointerEvent<HTMLElement>
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    flamePointerOwnsPress.current = true;
    flameLongPressTriggered.current = false;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // A browser may have already released a touch pointer; color handling
      // below remains local to this canvas in that case.
    }
    if (flameLongPressTimer.current)
      window.clearTimeout(flameLongPressTimer.current);
    flameLongPressTimer.current = window.setTimeout(() => {
      flameLongPressTriggered.current = true;
      setFusionFlameVisible(visible => !visible);
      flameLongPressTimer.current = null;
    }, 520);
  };

  const handleFlamePointerUp = (
    event: ReactPointerEvent<HTMLElement>
  ) => {
    if (!flamePointerOwnsPress.current) return;
    event.preventDefault();
    event.stopPropagation();
    flamePointerOwnsPress.current = false;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      } catch {
        // Safari can release a captured touch pointer before pointerup.
      }
    }
    cancelFlameLongPress();
    if (flameLongPressTriggered.current) {
      flameQuickTapCount.current = 0;
      return;
    }
    handleFlameQuickTap();
  };

  const cancelFlameLongPress = () => {
    if (flameLongPressTimer.current) {
      window.clearTimeout(flameLongPressTimer.current);
      flameLongPressTimer.current = null;
    }
  };

  const handleFlamePointerCancel = (
    event: ReactPointerEvent<HTMLElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    flamePointerOwnsPress.current = false;
    flameLongPressTriggered.current = false;
    flameQuickTapCount.current = 0;
    cancelFlameLongPress();
  };

  const handleSelect = (branch: any) => {
    setFrontBranchId(branch.id);
    navigate("/main");
  };

  const visibleBranches = (branches as any[]).filter(isBranchVisible);

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <style>{`
        .store-select-logo-stage {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          isolation: isolate;
          pointer-events: none;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }

        /* The uploaded 1440×1080 composition is rendered in one shared design
           frame. The frame scales with the page's existing container, not with
           browser/device-specific child rules. */
        .store-select-composite-logo-frame {
          position: absolute;
          left: -40.25%;
          top: 15.5%;
          width: 130%;
          aspect-ratio: 4 / 3;
          overflow: visible;
          pointer-events: auto;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
        }

        .store-select-composite-logo-video {
          position: absolute;
          inset: 0;
          display: block;
          width: 100%;
          height: 100%;
          object-fit: fill;
          object-position: center;
          border: 0;
          outline: none;
          user-select: none;
          -webkit-user-drag: none;
          mix-blend-mode: screen;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          will-change: transform, opacity;
          filter: brightness(1.04) saturate(1.08) contrast(1.04);
          -webkit-filter: brightness(1.04) saturate(1.08) contrast(1.04);
        }

        .store-select-composite-logo-video:focus-visible {
          outline: .14rem solid rgba(255, 214, 139, .92);
          outline-offset: .18rem;
        }

        .store-select-real-flame {
		  --store-select-flame-hue: 0deg;
		  --store-select-butterfly-near-opacity: .98;
		  --store-select-butterfly-far-opacity: .46;
          position: absolute;
          z-index: 6;
	          left: 3.1%;
	          top: -29.5%;
          width: 116%;
          height: 64%;
          object-fit: contain;
          object-position: center;
          pointer-events: auto;
          cursor: pointer;
          mix-blend-mode: screen;
          filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.12) saturate(1.16);
          opacity: 0;
          transform: translate3d(-2.2%, 0, 0) rotate(-1.4deg) scale(1.38, .84);
          transform-origin: 50% 100%;
	          animation: store-select-real-flame-appear 3.6s cubic-bezier(.22, .8, .28, 1) forwards, store-select-real-flame-resting 2.36s linear 3.6s infinite;
	        }

	        .store-select-real-flame:focus-visible {
          outline: .14rem solid rgba(255, 214, 139, .92);
          outline-offset: .18rem;
        }

.store-select-circular-flame-halo {
  position: absolute;
  z-index: 7;
  left: 34.3%;
  top: 7%;
  width: 34%;
  height: auto;
  aspect-ratio: 1 / 1;
  pointer-events: none;
  isolation: isolate;
  opacity: 0;
  transform: translate3d(0, 0, 0) scale(.14);
  transform-origin: 50% 50%;
  /* The two lights behind the flame need a feathered alpha falloff. A hard
     circular clip removes square paint bounds but leaves a visible rim on
     WebKit; this mask fades the light naturally to transparent instead. */
  mask-image: radial-gradient(circle at 50% 50%, #000 0 52%, rgba(0, 0, 0, .92) 64%, rgba(0, 0, 0, .58) 78%, transparent 100%);
  -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 0 52%, rgba(0, 0, 0, .92) 64%, rgba(0, 0, 0, .58) 78%, transparent 100%);
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-size: 100% 100%;
  -webkit-mask-size: 100% 100%;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 230, 0) 0 16%, rgba(255, 235, 170, .08) 28%, rgba(255, 190, 82, .18) 46%, rgba(255, 132, 37, .13) 62%, rgba(245, 90, 23, .045) 78%, rgba(230, 72, 18, 0) 100%);
  mix-blend-mode: normal;
  filter: hue-rotate(var(--store-select-flame-hue)) saturate(1.06) blur(.28rem);
  animation: store-select-circular-flame-halo-cycle 16.311s linear 3.6s infinite;
}

.store-select-flame-side-halo {
  position: absolute;
  z-index: 5;
  left: 27.4%;
  top: -7%;
  width: 48%;
  height: auto;
  aspect-ratio: 1 / 1;
  pointer-events: none;
  isolation: isolate;
  opacity: 0;
  transform: translate3d(0, 0, 0) scale(.86);
  transform-origin: 50% 50%;
  mask-image: radial-gradient(circle at 50% 50%, #000 0 52%, rgba(0, 0, 0, .92) 64%, rgba(0, 0, 0, .58) 78%, transparent 100%);
  -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 0 52%, rgba(0, 0, 0, .92) 64%, rgba(0, 0, 0, .58) 78%, transparent 100%);
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-size: 100% 100%;
  -webkit-mask-size: 100% 100%;
  background: radial-gradient(circle at 50% 50%, rgba(255, 248, 222, .06) 0 20%, rgba(255, 236, 175, .18) 34%, rgba(255, 192, 88, .36) 52%, rgba(255, 132, 39, .22) 68%, rgba(238, 87, 22, .065) 84%, rgba(238, 87, 22, 0) 100%);
  mix-blend-mode: normal;
  filter: hue-rotate(var(--store-select-flame-hue)) saturate(1.04) blur(.28rem);
  animation: store-select-flame-side-halo-cycle 16.311s linear 3.6s infinite;
}

.store-select-flame-smoke {
  position: absolute;
  z-index: 5;
  left: 50%;
  top: -2%;
  width: 126%;
  height: 48%;
  overflow: visible;
  pointer-events: none;
  opacity: 0;
  transform: translate3d(0, 0, 0) scaleX(.04) scaleY(.30);
  transform-origin: 0% 50%;
  filter: blur(.16rem) saturate(.72);
  animation: store-select-flame-smoke-cycle 16.311s linear 3.6s infinite;
}

.store-select-flame-smoke::before,
.store-select-flame-smoke::after {
  position: absolute;
  content: "";
  pointer-events: none;
  transform-origin: 1% 50%;
}

.store-select-flame-smoke::before {
  left: 0;
  top: 22%;
  width: 100%;
  height: 48%;
  border-radius: 10% 74% 64% 30% / 44% 66% 58% 40%;
  background:
    radial-gradient(ellipse 18% 42% at 8% 54%, rgba(255, 236, 218, .88) 0 18%, rgba(188, 163, 151, .66) 43%, transparent 78%),
    radial-gradient(ellipse 25% 47% at 29% 45%, rgba(220, 195, 181, .66) 0 19%, rgba(142, 119, 110, .34) 51%, transparent 81%),
    radial-gradient(ellipse 23% 44% at 51% 58%, rgba(190, 164, 151, .54) 0 17%, rgba(117, 98, 92, .22) 54%, transparent 84%),
    radial-gradient(ellipse 27% 52% at 75% 39%, rgba(172, 146, 137, .38) 0 15%, rgba(103, 85, 81, .14) 52%, transparent 84%);
  box-shadow: 0 .14rem .34rem rgba(96, 68, 60, .18);
  transform: translate3d(0, 0, 0);
}

.store-select-flame-smoke::after {
  left: 1%;
  top: 7%;
  width: 92%;
  height: 38%;
  border-radius: 16% 70% 40% 34% / 52% 58% 42% 46%;
  background:
    radial-gradient(ellipse 20% 40% at 15% 54%, rgba(255, 239, 225, .52) 0 20%, rgba(161, 137, 128, .28) 49%, transparent 78%),
    radial-gradient(ellipse 28% 44% at 39% 38%, rgba(190, 164, 151, .38) 0 17%, rgba(121, 100, 93, .18) 52%, transparent 84%),
    radial-gradient(ellipse 25% 40% at 67% 48%, rgba(157, 132, 124, .26) 0 18%, rgba(102, 84, 79, .10) 54%, transparent 86%);
  opacity: .72;
  transform: translate3d(2%, 0, 0);
}

/* Batch 377 restores the existing batch-375 right-smoke output while keeping
   the user-uploaded rotated smoke as its separate, later display layer. */
.store-select-flame-smoke-replaced { display: block; }

.store-select-uploaded-right-smoke-gif {
  position: absolute;
  z-index: 5;
  left: 49%;
  top: -41%;
  width: 126%;
  height: 126%;
  pointer-events: none;
  opacity: 0;
  transform-origin: 0% 50%;
  animation: store-select-uploaded-right-smoke-cycle 16.311s linear 3.6s infinite;
}

.store-select-uploaded-right-smoke-gif img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  mix-blend-mode: screen;
  transform: rotate(90deg);
  transform-origin: 50% 50%;
  filter: url(#store-select-overlay-luminance-key) brightness(3.10) saturate(.90) contrast(.98) drop-shadow(0 .10rem .56rem rgba(222, 229, 239, .62));
}

.store-select-flame-wick-light {
  position: absolute;
  z-index: 8;
  left: 34.3%;
  top: 7%;
  width: 34%;
  height: auto;
  aspect-ratio: 1 / 1;
  pointer-events: none;
  isolation: isolate;
  opacity: 0;
  transform: translate3d(0, 0, 0) scale(.16);
  transform-origin: 50% 50%;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 232, 1) 0 14%, rgba(255, 224, 137, .94) 24%, rgba(255, 167, 61, .66) 43%, rgba(238, 98, 28, .34) 60%, rgba(203, 57, 15, .12) 78%, rgba(188, 45, 12, 0) 100%);
  mix-blend-mode: normal;
  filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.08) saturate(1.12) blur(.18rem);
  animation: store-select-flame-wick-light-cycle 16.311s linear 3.6s infinite;
}

	.store-select-flame-connection-light {
	  position: absolute;
	  z-index: 10;
	  left: 46.3%;
		  top: 16.2%;
	  width: 10%;
  height: auto;
  aspect-ratio: 1 / 1;
  pointer-events: none;
  isolation: isolate;
	  opacity: 0;
	  transform: translate3d(0, 0, 0) scale(.72);
	  transform-origin: 50% 50%;
	  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 236, .98) 0 16%, rgba(255, 224, 133, .84) 31%, rgba(255, 155, 48, .46) 54%, rgba(224, 78, 18, .14) 72%, rgba(224, 78, 18, 0) 100%);
  mix-blend-mode: normal;
  filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.08) saturate(1.16) blur(.09rem);
  animation: store-select-flame-connection-light-cycle 16.311s linear 3.6s infinite;
}

.store-select-wick-sparks {
  position: absolute;
  z-index: 9;
  left: 34.3%;
  top: 7%;
  width: 34%;
  height: auto;
  aspect-ratio: 1 / 1;
  pointer-events: none;
  opacity: 0;
  transform: translate3d(0, 0, 0);
  transform-origin: 50% 50%;
  filter: hue-rotate(var(--store-select-flame-hue)) saturate(1.12) blur(.025rem);
  animation: store-select-wick-spark-cycle 16.311s linear 3.6s infinite;
}

		.store-select-butterfly-cycle-anchor {
		  position: absolute;
		  z-index: 0;
		  left: 34.3%;
	  top: 7%;
	  width: 34%;
	  height: auto;
	  aspect-ratio: 1 / 1;
	  pointer-events: none;
		  opacity: 0;
	  transform: translate3d(0, 0, 0) scale(.12) rotate(-38deg) rotateY(18deg);
	  transform-origin: 50% 50%;
	  perspective: 22rem;
	  transform-style: preserve-3d;
	  filter: none;
			  animation: store-select-original-gif-cycle-clock 16.311s linear 3.6s infinite;
		}

			.store-select-original-gif-at-fire {
			  position: absolute;
			  /* Original butterfly stays between blue glow z11 and logo z5. */
			  z-index: 10;
			  /* The visible subject sits inside the large native GIF stage rather
			     than at this container's center. This compensates only that display
			     offset so the butterfly's visible return point aligns with the flame. */
			  left: 118%;
			  top: -1%;
			  width: 34%;
		  height: auto;
		  aspect-ratio: 1 / 1;
			  pointer-events: none;
			  opacity: 0;
			  visibility: hidden;
			  isolation: isolate;
			  will-change: opacity, visibility;
			  backface-visibility: hidden;
			  -webkit-backface-visibility: hidden;
			  transform: none;
			  animation: store-select-original-gif-fire-cycle 16.311s linear 3.6s infinite;
			}

			.store-select-uploaded-wick-spark-gif {
			  position: absolute;
			  /* Blue disappearance glow stays above butterfly and Logo. */
			  z-index: 11;
		  /* The uploaded 500×500 GIF is centred on the wick light and enlarged
		     symmetrically, so its native burst completes around the light rather
		     than appearing as an imperceptible point behind the flame layers. */
			  /* 160% square: centre on the existing Logo match-head / wick light. */
			  left: -28.7%;
			  top: -44.18%;
			  width: 160%;
		  height: auto;
		  aspect-ratio: 1 / 1;
		  pointer-events: none;
		  opacity: 0;
		  transform: none;
		  animation: store-select-uploaded-wick-spark-cycle 16.311s linear 3.6s infinite;
		}

			.store-select-uploaded-wick-spark-gif img {
		  position: absolute;
		  inset: 0;
		  display: block;
		  width: 100%;
		  height: 100%;
		  object-fit: contain;
		  pointer-events: none;
		  /* The SVG filter outputs the source colours with a luminance-derived
		     alpha. It removes only the near-black GIF stage at display time;
		     brightness and shadows make the user-uploaded particles visible. */
		  mix-blend-mode: normal;
			  filter: url(#store-select-butterfly-luminance-key) hue-rotate(var(--store-select-wick-spark-hue)) brightness(1.22) saturate(1.16) drop-shadow(0 0 .14rem rgba(229, 246, 255, .88)) drop-shadow(0 0 .48rem rgba(100, 181, 255, .48));
			}

			.store-select-uploaded-wick-spark-gif.store-select-flame-color-rainbow {
			  animation: store-select-uploaded-wick-spark-cycle 16.311s linear 3.6s infinite, store-select-wick-spark-rainbow-hue 4.8s linear 3.6s infinite;
			}

				.store-select-uploaded-top-smoke-video {
			  position: absolute;
			  /* The original 128×136 video remains unmodified. Its display output
			     is moved right to the match-head and enlarged without changing the MP4. */
			  z-index: 9;
					  left: 46%;
			  top: -76%;
  width: 114%;
			  height: auto;
			  aspect-ratio: 128 / 136;
			  pointer-events: none;
			  opacity: 0;
			  /* Batch 382: double only the display container, keeping the lower
			     match-head anchor fixed and the original MP4 / matte untouched. */
			  transform: scale(2);
			  transform-origin: 50% 100%;
			  animation: store-select-uploaded-top-smoke-cycle 16.311s linear 3.6s infinite;
			}

			.store-select-uploaded-top-smoke-video video {
			  position: absolute;
			  inset: 0;
			  display: block;
			  width: 100%;
			  height: 100%;
			  object-fit: contain;
			  pointer-events: none;
			  mix-blend-mode: screen;
			  /* Batch 383: under the two-times display scale, hide the returned upper
			     detached plume while retaining the lower smoke that rises from the wick. */
			  mask-image: linear-gradient(to bottom, transparent 0 60%, rgba(0, 0, 0, .10) 68%, #000 76%, #000 100%);
			  -webkit-mask-image: linear-gradient(to bottom, transparent 0 60%, rgba(0, 0, 0, .10) 68%, #000 76%, #000 100%);
			  filter: url(#store-select-top-smoke-luminance-key) brightness(1.14) saturate(.72) contrast(1.06) drop-shadow(0 -.08rem .20rem rgba(220, 224, 232, .28));
			}

			.store-select-uploaded-match-head-light-video {
			  position: absolute;
			  z-index: 18;
			  left: 43.3%;
			  top: 13.3%;
			  width: 16%;
			  height: auto;
			  aspect-ratio: 1 / 1;
			  pointer-events: none;
			  opacity: 0;
			  transform: none;
			  animation: store-select-uploaded-match-head-light-cycle 16.311s linear 3.6s infinite;
			}

			.store-select-uploaded-match-head-light-video video {
			  position: absolute;
			  inset: 0;
			  display: block;
			  width: 100%;
			  height: 100%;
			  object-fit: contain;
			  pointer-events: none;
  mix-blend-mode: screen;
				  filter: url(#store-select-match-head-light-luminance-key) hue-rotate(var(--store-select-flame-hue)) brightness(3.10) saturate(1.42) contrast(1.02) drop-shadow(0 0 .24rem rgba(255, 248, 216, .99)) drop-shadow(0 0 .76rem rgba(255, 172, 62, .84));
}

/* The uploaded source remains the moving light detail. This small display-only
   point keeps its match-head center perceptible when the keyed source frame is
   intentionally dim, without changing the source video or the Logo artwork. */
.store-select-uploaded-match-head-light-video::after {
  position: absolute;
  content: "";
  left: 50%;
  top: 50%;
	  width: 48%;
	  height: 48%;
  border-radius: 999px;
  pointer-events: none;
  transform: translate3d(-50%, -50%, 0);
  background: radial-gradient(circle, rgba(255, 255, 242, .98) 0 18%, rgba(255, 228, 151, .86) 32%, rgba(255, 169, 57, .44) 57%, rgba(255, 133, 36, 0) 78%);
  mix-blend-mode: screen;
  filter: hue-rotate(var(--store-select-flame-hue)) drop-shadow(0 0 .16rem rgba(255, 249, 218, .96)) drop-shadow(0 0 .44rem rgba(255, 163, 51, .68));
}

						.store-select-uploaded-new-flame-extinguish-video {
						  position: absolute;
						  /* The untouched original MP4 uses the same display-only luminance
						     matte route as the existing uploaded effects. */
						  z-index: 7;
					  left: 3.9%;
					  top: -30.2%;
					  width: 116%;
					  height: 64%;
					  pointer-events: none;
					  opacity: 0;
							  transform: translate3d(-2.2%, 0, 0) rotate(-1.4deg) scale(1.38, .84);
							  transform-origin: 50% 100%;
							  /* The child's clip/mask bounds previously cut off its own shadows.
							     Cast the existing fire-palette light from this unclipped wrapper
							     so the keyed flame edge carries a visible, restrained glow. */
							  filter: drop-shadow(0 0 .16rem var(--store-select-extinguish-core, var(--store-select-text-core))) drop-shadow(0 0 .54rem var(--store-select-extinguish-warm, var(--store-select-text-glow))) drop-shadow(0 0 .96rem var(--store-select-extinguish-glow, var(--store-select-text-glow)));
							  -webkit-filter: drop-shadow(0 0 .16rem var(--store-select-extinguish-core, var(--store-select-text-core))) drop-shadow(0 0 .54rem var(--store-select-extinguish-warm, var(--store-select-text-glow))) drop-shadow(0 0 .96rem var(--store-select-extinguish-glow, var(--store-select-text-glow)));
							  animation: store-select-uploaded-new-flame-extinguish-video-cycle 16.311s linear 3.6s infinite;
					}

							.store-select-uploaded-new-flame-extinguish-video video {
							  position: absolute;
								  /* The untouched source's full connected flame is x318–406/y567–916.
								     Map that original 88×349 subject as one uniformly scaled image to
								     the real flame's measured CSS-pixel subject. Make only the requested
								     smaller, right display adjustment while keeping the prior vertical
								     position fixed. This is only
								     display geometry: browser-native MP4 frames stay unmodified. */
								  left: 17.8%;
								  top: -25.3%;
								  width: 53.6%;
							  height: auto;
							  aspect-ratio: 3 / 4;
							  display: block;
							  object-fit: contain;
							  pointer-events: none;
							  mix-blend-mode: screen;
							  /* Keep the entire connected source flame and exclude unrelated stage,
							     cup and igniter. This alters no source frame or playback cadence. */
							  clip-path: inset(59.1% 43.7% 4.6% 44.2%);
							  -webkit-clip-path: inset(59.1% 43.7% 4.6% 44.2%);
							  mask-image: linear-gradient(to bottom, transparent 0 59%, #000 59.1% 95.4%, transparent 95.5% 100%);
							  -webkit-mask-image: linear-gradient(to bottom, transparent 0 59%, #000 59.1% 95.4%, transparent 95.5% 100%);
								  /* Preserve the original native-video display route. Its edge light is
								     rendered by the unclipped wrapper above, so this subject mask can
								     remain exact without changing a source pixel or its playback. */
								  filter: url(#store-select-overlay-luminance-key) sepia(1) saturate(1.55) hue-rotate(var(--store-select-flame-hue)) brightness(3.20) contrast(1.18);
							}

			.store-select-uploaded-new-flame-extinguish-video.store-select-flame-color-rainbow {
			  animation: store-select-uploaded-new-flame-extinguish-video-cycle 16.311s linear 3.6s infinite, store-select-text-rainbow 4.8s linear 3.6s infinite;
			}

			.store-select-uploaded-new-flame-extinguish-video.store-select-flame-color-rainbow video,
							.store-select-uploaded-water-gif.store-select-flame-color-rainbow img {
				          animation: store-select-rainbow-hue 4.8s linear 3.6s infinite;
			        }

            .store-select-uploaded-fireworks-video {
              position: absolute;
              z-index: 17;
              /* The output centre is approximately two Logo heights above the Logo. */
							  /* Preserve the existing output centre while scaling the same display frame. */
							  left: -40.5%;
							  top: -182%;
							  width: 180%;
              height: auto;
              aspect-ratio: 240 / 424;
              pointer-events: none;
              opacity: 0;
              animation: store-select-uploaded-fireworks-cycle 16.311s linear 3.6s infinite;
            }

            .store-select-uploaded-fireworks-video video {
              position: absolute;
              inset: 0;
              display: block;
              width: 100%;
              height: 100%;
              object-fit: contain;
              pointer-events: none;
              mix-blend-mode: screen;
              filter: url(#store-select-fireworks-luminance-key) brightness(1.16) saturate(1.12) contrast(1.04);
            }

            .store-select-uploaded-fireworks-video:not(.store-select-flame-color-orange) {
              opacity: 0 !important;
            }

			.store-select-birthday-countdown,
.store-select-birthday-message {
  position: absolute;
  z-index: 12;
  pointer-events: none;
  user-select: none;
  color: rgba(247, 251, 255, .94);
  text-shadow: 0 0 .28rem rgba(180, 231, 255, .45), 0 0 1rem rgba(126, 167, 245, .18);
  opacity: 0;
}

.store-select-birthday-copy-hidden {
  animation: none !important;
  opacity: 0 !important;
}

			.store-select-birthday-countdown {
			  left: 18%;
			  top: -24%;
			  width: 62%;
			  height: 18%;
			  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
			  font-size: clamp(.68rem, 2.45cqw, 1.32rem);
			  font-weight: 300;
			  letter-spacing: .015em;
			  animation: store-select-countdown-window 16.311s linear 3.6s infinite;
			}

			.store-select-birthday-countdown-value {
			  position: absolute;
			  inset: 0;
			  display: grid;
			  place-items: center;
			  opacity: 0;
			}

			.store-select-birthday-countdown-value[data-countdown="23:59:58"] { animation: store-select-countdown-first 16.311s linear 3.6s infinite; }
			.store-select-birthday-countdown-value[data-countdown="23:59:59"] { animation: store-select-countdown-second 16.311s linear 3.6s infinite; }
			.store-select-birthday-countdown-value[data-countdown="00:00:00"] { animation: store-select-countdown-zero 16.311s linear 3.6s infinite; }

			.store-select-birthday-message {
			  left: 91%;
			  top: -18%;
			  width: 92%;
			  text-align: center;
			  font-family: Georgia, "Times New Roman", serif;
			  letter-spacing: .035em;
			  animation: store-select-birthday-copy-window 16.311s linear 3.6s infinite;
			}

			.store-select-birthday-message small,
			.store-select-birthday-message strong {
			  display: block;
			  white-space: nowrap;
			}

.store-select-birthday-message small { font-size: clamp(.34rem, .86cqw, .50rem); font-weight: 400; }
.store-select-birthday-message strong { margin-top: .04rem; font-size: clamp(.58rem, 1.48cqw, .82rem); font-weight: 400; }

.store-select-uploaded-water-gif,
.store-select-uploaded-butterfly-gold-dust-gif {
  position: absolute;
  display: block;
  left: 118%;
  top: 2.5%;
  width: 34%;
  max-width: none;
  height: auto;
  aspect-ratio: 1 / 1;
  pointer-events: none;
  opacity: 0;
  animation: store-select-uploaded-butterfly-overlay-cycle 16.311s linear 3.6s infinite;
}

.store-select-uploaded-water-gif {
	  /* Batch 382: water now paints outside / in front of Logo z5 only. */
	  z-index: 6;
  left: 3.3%;
  top: -14%;
  width: 96%;
  transform: none;
  aspect-ratio: 16 / 9;
  animation: store-select-uploaded-water-transition-cycle 16.311s linear 3.6s infinite;
}

.store-select-uploaded-butterfly-gold-dust-gif {
  z-index: 15;
  left: 1%;
  top: 10%;
  width: 100%;
  transform: none;
  aspect-ratio: 4 / 3;
}

.store-select-uploaded-water-gif img,
.store-select-uploaded-butterfly-gold-dust-gif img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  mix-blend-mode: screen;
	  /* The original water has a cool native colour. Convert its keyed light to
	     the common warm neutral before applying the very same flame hue variable,
	     so every selected flame colour is visibly reflected in the water. */
						  filter: url(#store-select-overlay-luminance-key) sepia(1) saturate(3.25) hue-rotate(var(--store-select-flame-hue)) brightness(1.22) contrast(1.10);
						}

						/* Only purple fire preserves the keyed water asset's original colour.
						   Its source, playback, timing, geometry and stacking do not change. */
						.store-select-uploaded-water-gif.store-select-flame-color-purple img {
						  filter: url(#store-select-overlay-luminance-key) brightness(1.22) contrast(1.10);
						}

						/* The water remains the untouched native GIF but its output is shown
						   only for the requested purple fire state. Its source, timing,
						   geometry, z-index and native playback are unchanged. */
						.store-select-uploaded-water-gif:not(.store-select-flame-color-purple) {
						  opacity: 0 !important;
						}

.store-select-uploaded-butterfly-gold-dust-gif img {
  filter: url(#store-select-overlay-luminance-key) brightness(3.20) saturate(1.52) contrast(1.02) drop-shadow(0 0 .20rem rgba(255, 216, 118, .82));
}

			.store-select-uploaded-coin-embers-gif {
			  position: absolute;
			  /* Same z-index as coin canvas but mounted after it: embers paint in
			     front of coins and remain behind Logo z5. */
			  z-index: 4;
			  /* 300% × 168.6% output: centre on the existing Logo match-head / wick light. */
			  left: -98.7%;
			  top: -51.68%;
			  width: 300%;
			  height: auto;
			  aspect-ratio: 500 / 281;
			  pointer-events: none;
			  opacity: 0;
			  transform: none;
			  animation: store-select-uploaded-coin-embers-cycle 16.311s linear 3.6s infinite;
			}

			.store-select-uploaded-coin-embers-gif img {
			  position: absolute;
			  inset: 0;
			  display: block;
			  width: 100%;
			  height: 100%;
			  object-fit: contain;
			  pointer-events: none;
			  mix-blend-mode: normal;
			  filter: url(#store-select-butterfly-luminance-key) brightness(1.26) saturate(1.20) drop-shadow(0 0 .13rem rgba(255, 166, 88, .88)) drop-shadow(0 0 .44rem rgba(236, 67, 20, .50));
			}

		.store-select-webgl-butterfly-canvas {
		  display: block;
		  width: 100%;
		  height: 100%;
		  pointer-events: none;
		  mix-blend-mode: screen;
		  filter: drop-shadow(0 0 .055rem rgba(255, 255, 236, .92)) drop-shadow(0 0 .20rem rgba(255, 220, 141, .82)) drop-shadow(0 0 .46rem rgba(255, 136, 43, .56)) drop-shadow(0 0 .78rem rgba(237, 68, 18, .24)) hue-rotate(var(--store-select-flame-hue)) saturate(1.28) brightness(1.06);
		}

					.store-select-uploaded-butterfly-gif {
					  position: absolute;
					  display: block;
				  /* The original uploaded GIF is displayed directly. Screen compositing is
				     a display-only matte: near-black GIF pixels contribute no visible light,
				     so the original black stage is not shown while no source frame is altered. */
					  left: -406%;
					  top: -87.0625%;
				  width: 690%;
				  max-width: none;
				  height: auto;
				  /* The user requested the visible flight direction to run left-to-right.
				     This mirrors only the browser's output around the unchanged image center;
				     the uploaded GIF bytes, native frame cadence and fire placement stay intact. */
					  transform: scaleX(-1);
					  transform-origin: 50% 50%;
					  /* Preserve the oversized native stage and only isolate its keyed
					     display output, avoiding a stale first-frame composite. */
					  isolation: isolate;
					  will-change: filter;
					  backface-visibility: hidden;
					  -webkit-backface-visibility: hidden;
					  z-index: 1;
				  pointer-events: none;
			  background: transparent !important;
			  mix-blend-mode: screen;
				  /* A display-only alpha threshold removes the dark compressed haze around
				     the source stage. The GIF URL and browser playback remain native;
				     no image pixels or frames are decoded, regenerated, cropped, or
				     replaced by application code. */
				  mask-image: radial-gradient(ellipse 30% 38% at 50% 50%, #000 0 58%, rgba(0, 0, 0, .96) 66%, rgba(0, 0, 0, .42) 76%, transparent 86%);
				  -webkit-mask-image: radial-gradient(ellipse 30% 38% at 50% 50%, #000 0 58%, rgba(0, 0, 0, .96) 66%, rgba(0, 0, 0, .42) 76%, transparent 86%);
				  mask-repeat: no-repeat;
				  -webkit-mask-repeat: no-repeat;
				  mask-size: 100% 100%;
				  -webkit-mask-size: 100% 100%;
					  /* The GIF is the only butterfly content. Its luminance is used solely as
				     an alpha threshold at display time, so near-black compression haze is
				     transparent without generating or rewriting a single source frame. */
				  clip-path: none;
				  -webkit-clip-path: none;
				  mask-image: none;
				  -webkit-mask-image: none;
				  /* The same keyed GIF casts its own alpha-shaped light. This is not a
				     separate round sprite: the glow follows every butterfly frame,
				     position, and return movement exactly. */
				  filter: url(#store-select-butterfly-luminance-key) hue-rotate(var(--store-select-butterfly-hue-shift, 50deg)) saturate(1.45) brightness(1.04) contrast(1.18) drop-shadow(0 0 .10rem var(--store-select-butterfly-glow, rgba(255, 137, 38, .76))) drop-shadow(0 0 .30rem var(--store-select-butterfly-glow-soft, rgba(255, 222, 132, .42)));
					  /* The outer container itself now uses the existing 25.6–66.7%
					     window as a visibility gate. Keep this native inner GIF output
					     untouched so its original visible start, frames and colors stay intact. */
					  animation: none;
					  -webkit-animation: none;
					}

			.store-select-flame-color-rainbow .store-select-uploaded-butterfly-gif {
			          animation: store-select-butterfly-rainbow-color 4.8s linear infinite;
			        }

		.store-select-butterfly-cycle-anchor.store-select-flame-color-rainbow .store-select-webgl-butterfly-canvas {
	  animation: store-select-rainbow-hue 4.8s linear 3.6s infinite;
	}

	.store-select-webgl-butterfly-tail-anchor {
	  position: absolute;
	  z-index: 1;
	  left: 35.6%;
	  top: 50.4%;
	  width: 2.6%;
	  aspect-ratio: 1 / 1;
	  opacity: 0;
	  pointer-events: none;
	}

		.store-select-flame-butterfly .store-select-butterfly-wing {
		  position: absolute;
		  display: block;
		  pointer-events: none;
		  isolation: isolate;
		  background: radial-gradient(ellipse at 61% 63%, rgba(255, 255, 245, 1) 0 8%, rgba(255, 229, 148, 1) 29%, rgba(255, 166, 59, .94) 57%, rgba(239, 74, 18, .66) 77%, rgba(220, 56, 15, .14) 92%, rgba(220, 56, 15, 0) 100%);
		  border: .035rem solid rgba(255, 229, 152, .24);
		  box-shadow: inset 0 0 .12rem rgba(255, 249, 221, .38), 0 0 .12rem rgba(255, 183, 66, .48);
		  filter: hue-rotate(var(--store-select-flame-hue)) saturate(1.14) brightness(1.10) blur(.014rem);
		  backface-visibility: visible;
		  transform-style: preserve-3d;
		  will-change: transform, opacity;
		}

.store-select-butterfly-left-large {
  --store-select-wing-turn: -18deg;
  --store-select-wing-y-open: -18deg;
  --store-select-wing-y-closed: -82deg;
  --store-select-wing-x-open: 10deg;
  --store-select-wing-x-closed: 78deg;
	  --store-select-wing-scale-x-open: .91;
	  --store-select-wing-scale-x-closed: .30;
	  --store-select-wing-scale-y-open: 1.02;
	  --store-select-wing-scale-y-closed: .62;
  z-index: 4;
	  left: -7%;
	  top: -5%;
	  width: 78%;
	  height: 76%;
	  border-radius: 88% 40% 82% 46% / 86% 38% 78% 50%;
	  transform-origin: 92% 79%;
  opacity: .94;
  filter: hue-rotate(var(--store-select-flame-hue)) saturate(1.04) brightness(1.02) blur(.018rem);
  animation: store-select-flame-butterfly-synchronous-wingbeat 1.08s linear 3.6s infinite;
}

.store-select-butterfly-left-small {
  --store-select-wing-turn: 18deg;
  --store-select-wing-y-open: -16deg;
  --store-select-wing-y-closed: -76deg;
  --store-select-wing-x-open: 8deg;
  --store-select-wing-x-closed: 70deg;
	  --store-select-wing-scale-x-open: .86;
	  --store-select-wing-scale-x-closed: .31;
	  --store-select-wing-scale-y-open: .98;
	  --store-select-wing-scale-y-closed: .64;
  z-index: 3;
	  left: 7%;
	  top: 42%;
	  width: 54%;
	  height: 49%;
	  border-radius: 78% 42% 74% 48% / 76% 40% 72% 52%;
	  transform-origin: 92% 30%;
  opacity: .94;
  filter: hue-rotate(var(--store-select-flame-hue)) saturate(1.04) brightness(1.02) blur(.018rem);
  animation: store-select-flame-butterfly-synchronous-wingbeat 1.08s linear 3.6s infinite;
}

.store-select-butterfly-right-large {
  --store-select-wing-turn: 18deg;
  --store-select-wing-y-open: 18deg;
  --store-select-wing-y-closed: 82deg;
  --store-select-wing-x-open: 10deg;
  --store-select-wing-x-closed: 78deg;
	  --store-select-wing-scale-x-open: .91;
	  --store-select-wing-scale-x-closed: .30;
	  --store-select-wing-scale-y-open: 1.02;
	  --store-select-wing-scale-y-closed: .62;
  z-index: 4;
	  left: 30%;
	  top: -5%;
	  width: 78%;
	  height: 76%;
	  border-radius: 40% 88% 46% 82% / 38% 86% 50% 78%;
	  transform-origin: 8% 79%;
  opacity: .94;
  filter: hue-rotate(var(--store-select-flame-hue)) saturate(1.04) brightness(1.02) blur(.018rem);
  animation: store-select-flame-butterfly-synchronous-wingbeat 1.08s linear 3.6s infinite;
}

.store-select-butterfly-right-small {
  --store-select-wing-turn: -18deg;
  --store-select-wing-y-open: 16deg;
  --store-select-wing-y-closed: 76deg;
  --store-select-wing-x-open: 8deg;
  --store-select-wing-x-closed: 70deg;
	  --store-select-wing-scale-x-open: .86;
	  --store-select-wing-scale-x-closed: .31;
	  --store-select-wing-scale-y-open: .98;
	  --store-select-wing-scale-y-closed: .64;
  z-index: 3;
	  left: 40%;
	  top: 42%;
	  width: 54%;
	  height: 49%;
	  border-radius: 42% 78% 48% 74% / 40% 76% 52% 72%;
	  transform-origin: 8% 30%;
  opacity: .94;
  filter: hue-rotate(var(--store-select-flame-hue)) saturate(1.04) brightness(1.02) blur(.018rem);
  animation: store-select-flame-butterfly-synchronous-wingbeat 1.08s linear 3.6s infinite;
}

.store-select-butterfly-left-large { --store-select-wing-up-gap-x: -52%; --store-select-wing-up-depth: -.10rem; --store-select-wing-y-closed: -56deg; --store-select-wing-x-closed: 50deg; }
.store-select-butterfly-left-small { --store-select-wing-up-gap-x: -26%; --store-select-wing-up-depth: -.06rem; --store-select-wing-y-closed: -50deg; --store-select-wing-x-closed: 44deg; }
.store-select-butterfly-right-large { --store-select-wing-up-gap-x: 52%; --store-select-wing-up-depth: .10rem; --store-select-wing-y-closed: 56deg; --store-select-wing-x-closed: 50deg; }
.store-select-butterfly-right-small { --store-select-wing-up-gap-x: 26%; --store-select-wing-up-depth: .06rem; --store-select-wing-y-closed: 50deg; --store-select-wing-x-closed: 44deg; }

		.store-select-butterfly-body-light {
		  position: absolute;
		  z-index: 12;
		  display: block;
		  left: 37.5%;
		  top: 44.5%;
		  width: 32%;
		  height: 14%;
		  pointer-events: none;
		  isolation: isolate;
		  mix-blend-mode: screen;
		  border-radius: 74% 42% 42% 74%;
		  background: radial-gradient(ellipse at 84% 50%, rgba(255, 255, 238, 1) 0 7%, rgba(255, 219, 116, .94) 20%, rgba(245, 137, 35, .68) 54%, rgba(239, 74, 18, 0) 100%);
		  box-shadow: 0 0 .075rem rgba(255, 192, 80, .52);
		  transform: translate3d(0, 0, .12rem) rotate(-3deg);
		  -webkit-transform: translate3d(0, 0, .12rem) rotate(-3deg);
		  -webkit-backface-visibility: visible;
		  backface-visibility: visible;
		  -webkit-transform-style: preserve-3d;
		  transform-style: preserve-3d;
		  will-change: opacity, transform;
		  animation: store-select-flame-butterfly-body-occlusion 1.18s cubic-bezier(.42, 0, .58, 1) 3.6s infinite;
		}

.store-select-butterfly-body-light::after {
		  position: absolute;
		  content: "";
		  right: -8%;
		  top: 10%;
		  width: 17%;
		  aspect-ratio: 1 / 1;
		  border-radius: 50%;
		  background: radial-gradient(circle at 38% 38%, rgba(255, 255, 245, 1) 0 14%, rgba(255, 219, 115, .94) 35%, rgba(242, 122, 28, .56) 70%, rgba(235, 72, 18, 0) 100%);
		  box-shadow: 0 0 .08rem rgba(255, 210, 120, .54);
		}

		.store-select-butterfly-tail-anchor {
		  position: absolute;
		  z-index: 1;
		  left: 35.6%;
		  top: 50.4%;
		  width: 2.6%;
		  aspect-ratio: 1 / 1;
		  opacity: 0;
		  pointer-events: none;
		}

.store-select-flame-gold-dust {
  position: absolute;
  z-index: 11;
  left: 34.3%;
  top: 7%;
  width: 34%;
  height: auto;
  aspect-ratio: 1 / 1;
  pointer-events: none;
  opacity: 1;
  transform: translate3d(0, 0, 0);
  transform-origin: 50% 50%;
}

		.store-select-flame-coin-fountain {
		  position: absolute;
		  z-index: 4;
	  left: 34.3%;
  top: 7%;
  width: 34%;
  height: auto;
  aspect-ratio: 1 / 1;
  pointer-events: none;
  overflow: visible;
  opacity: 1;
  transform: translate3d(0, 0, 0);
	  transform-origin: 50% 50%;
}

			/* Non-yellow flame variants use the original butterfly-start output. Yellow
			   is scheduled by the renderer at the existing return-to-flame stage. Purple
			   remains excluded because it is not among the requested coin variants. */
				.store-select-flame-coin-fountain.store-select-flame-color-purple {
				  opacity: 0 !important;
				}

				/* Yellow coins start only when the protected real flame becomes visible.
				   Keep the existing 3-second native coin playback inside that output
				   window, while the butterfly-time canvas remains fully hidden. */
				.store-select-flame-coin-fountain.store-select-flame-color-orange {
				  opacity: 0;
				}

.store-select-webgl-coin-fountain-canvas {
  position: absolute;
  left: -350%;
  top: -450%;
  display: block;
  width: 1000%;
  height: 900%;
  pointer-events: none;
  border: 0;
  outline: 0;
  background: transparent !important;
  mix-blend-mode: normal;
  isolation: auto;
  transform: none;
  -webkit-transform: none;
}

	.store-select-webgl-gold-dust-canvas {
	  position: absolute;
	  left: -230%;
	  top: -160%;
	  display: block;
	  width: 680%;
	  height: 700%;
	  pointer-events: none;
	  mix-blend-mode: normal;
	}

	.store-select-flame-gold-dust i {
  --store-select-dust-start-x: 0%;
  --store-select-dust-start-y: 0%;
  --store-select-dust-drift-x: 0%;
  --store-select-dust-drift-y: 0%;
  --store-select-dust-fall-x: 0%;
  --store-select-dust-fall-y: 0%;
  --store-select-dust-deep-x: 0%;
  --store-select-dust-deep-y: 0%;
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6.3%;
  aspect-ratio: 1 / 1;
  pointer-events: none;
  border-radius: 50%;
  opacity: 0;
	  background: radial-gradient(circle, rgba(255, 255, 245, 1) 0 12%, rgba(255, 229, 146, .96) 32%, rgba(235, 174, 61, .42) 56%, rgba(235, 174, 61, 0) 76%);
  box-shadow: 0 0 .11rem rgba(255, 217, 123, .94);
  mix-blend-mode: screen;
  filter: brightness(1);
  transform: translate(-50%, -50%) scale(.3);
}

.store-select-gold-dust-outbound { animation: store-select-flame-gold-dust-outbound 7.166s linear 3.6s infinite, store-select-flame-gold-dust-twinkle .54s steps(2, end) var(--store-select-dust-twinkle-delay, 0s) infinite; }
.store-select-gold-dust-return { animation: store-select-flame-gold-dust-return 7.166s linear calc(3.6s + var(--store-select-dust-return-delay, 0s)) infinite, store-select-flame-gold-dust-twinkle .54s steps(2, end) var(--store-select-dust-twinkle-delay, 0s) infinite; }
.store-select-gold-dust-return-fine { box-shadow: 0 0 .055rem rgba(255, 220, 132, .72); filter: brightness(.94); animation: store-select-flame-gold-dust-return-fine 7.166s linear calc(3.6s + var(--store-select-dust-return-delay, 0s)) infinite, store-select-flame-gold-dust-twinkle .68s steps(2, end) var(--store-select-dust-twinkle-delay, 0s) infinite; }
.store-select-gold-dust-return-glint { box-shadow: 0 0 .16rem rgba(255, 222, 136, 1); filter: brightness(1.20); animation: store-select-flame-gold-dust-return-glint 7.166s linear calc(3.6s + var(--store-select-dust-return-delay, 0s)) infinite, store-select-flame-gold-dust-twinkle .42s steps(2, end) var(--store-select-dust-twinkle-delay, 0s) infinite; }
.store-select-gold-dust-return-micro { box-shadow: 0 0 .022rem rgba(255, 224, 152, .52); filter: brightness(.72) blur(.012rem); animation: store-select-flame-gold-dust-return-micro 7.166s linear calc(3.6s + var(--store-select-dust-return-delay, 0s)) infinite, store-select-flame-gold-dust-twinkle .82s steps(2, end) var(--store-select-dust-twinkle-delay, 0s) infinite; }
.store-select-gold-dust-return-ultrafine { box-shadow: 0 0 .016rem rgba(255, 228, 168, .38); filter: brightness(.58) blur(.028rem); animation: store-select-flame-gold-dust-return-ultrafine 7.166s linear calc(3.6s + var(--store-select-dust-return-delay, 0s)) infinite, store-select-flame-gold-dust-twinkle .96s steps(2, end) var(--store-select-dust-twinkle-delay, 0s) infinite; }
.store-select-gold-dust-live-tail { --store-select-dust-emission-x: 0%; --store-select-dust-emission-y: 0%; --store-select-dust-emission-delay: 0s; --store-select-dust-drift-x: -3%; --store-select-dust-drift-y: 4%; --store-select-dust-fall-x: -7%; --store-select-dust-fall-y: 17%; box-shadow: 0 0 .045rem rgba(255, 224, 151, .66); filter: brightness(.84) blur(.01rem); animation: store-select-flame-gold-dust-live-tail 7.166s linear calc(3.6s + var(--store-select-dust-emission-delay)) infinite, store-select-flame-gold-dust-twinkle .74s steps(2, end) var(--store-select-dust-twinkle-delay, 0s) infinite; }
		.store-select-gold-dust-tail-follow { left: 50%; top: 50%; width: var(--store-select-tail-size, 1.1px) !important; aspect-ratio: 1 / 1; background: radial-gradient(circle, rgba(255, 255, 246, 1) 0 17%, rgba(255, 229, 151, 1) 39%, rgba(245, 180, 63, .58) 64%, rgba(245, 180, 63, 0) 100%); box-shadow: 0 0 .08rem rgba(255, 228, 160, .82), 0 0 .20rem rgba(255, 176, 61, .22); filter: brightness(1.18) saturate(1.08) blur(.004rem); will-change: transform, opacity; }
.store-select-gold-dust-tail-layer-0 { --store-select-tail-peak-opacity: .98; --store-select-tail-mid-opacity: .44; box-shadow: 0 0 .14rem rgba(255, 232, 171, 1), 0 0 .32rem rgba(255, 180, 65, .48); filter: brightness(1.34) saturate(1.16) blur(.003rem); }
.store-select-gold-dust-tail-layer-1 { --store-select-tail-peak-opacity: .90; --store-select-tail-mid-opacity: .38; }
.store-select-gold-dust-tail-layer-2 { --store-select-tail-peak-opacity: .72; --store-select-tail-mid-opacity: .30; box-shadow: 0 0 .05rem rgba(255, 229, 166, .56); filter: brightness(.98) saturate(1.02) blur(.008rem); }
.store-select-gold-dust-tail-layer-3 { --store-select-tail-peak-opacity: .54; --store-select-tail-mid-opacity: .22; box-shadow: 0 0 .025rem rgba(255, 230, 174, .34); filter: brightness(.80) saturate(.94) blur(.018rem); }
.store-select-gold-dust-tail-layer-4 { --store-select-tail-peak-opacity: .38; --store-select-tail-mid-opacity: .14; box-shadow: 0 0 .018rem rgba(255, 230, 174, .28); filter: brightness(.70) saturate(.90) blur(.022rem); }
.store-select-gold-dust-tail-layer-5 { --store-select-tail-peak-opacity: .24; --store-select-tail-mid-opacity: .08; box-shadow: 0 0 .012rem rgba(255, 230, 174, .20); filter: brightness(.58) saturate(.84) blur(.028rem); }
.store-select-gold-dust-tail-layer-0 { --store-select-tail-peak-opacity: 1; --store-select-tail-mid-opacity: .60; box-shadow: 0 0 .16rem rgba(255, 232, 171, 1), 0 0 .36rem rgba(255, 180, 65, .54); filter: brightness(1.42) saturate(1.18) blur(.003rem); }
.store-select-gold-dust-tail-layer-1 { --store-select-tail-peak-opacity: .92; --store-select-tail-mid-opacity: .48; }
.store-select-gold-dust-tail-layer-2 { --store-select-tail-peak-opacity: .76; --store-select-tail-mid-opacity: .36; box-shadow: 0 0 .065rem rgba(255, 229, 166, .64); filter: brightness(1.06) saturate(1.04) blur(.007rem); }
.store-select-gold-dust-tail-layer-3 { --store-select-tail-peak-opacity: .58; --store-select-tail-mid-opacity: .24; box-shadow: 0 0 .032rem rgba(255, 230, 174, .42); filter: brightness(.86) saturate(.96) blur(.014rem); }
.store-select-gold-dust-tail-layer-4 { --store-select-tail-peak-opacity: .42; --store-select-tail-mid-opacity: .16; box-shadow: 0 0 .020rem rgba(255, 230, 174, .30); filter: brightness(.72) saturate(.90) blur(.020rem); }
.store-select-gold-dust-tail-layer-5 { --store-select-tail-peak-opacity: .28; --store-select-tail-mid-opacity: .10; box-shadow: 0 0 .014rem rgba(255, 230, 174, .22); filter: brightness(.60) saturate(.84) blur(.026rem); }
.store-select-gold-dust-tail-layer-6 { --store-select-tail-peak-opacity: .16; --store-select-tail-mid-opacity: .06; box-shadow: 0 0 .010rem rgba(255, 230, 174, .16); filter: brightness(.50) saturate(.80) blur(.030rem); }
.store-select-gold-dust-outbound,
.store-select-gold-dust-return,
.store-select-gold-dust-return-fine,
.store-select-gold-dust-return-glint,
.store-select-gold-dust-return-micro,
.store-select-gold-dust-return-ultrafine,
.store-select-gold-dust-live-tail { display: none; }
.store-select-flame-gold-dust i:nth-child(1) { --store-select-dust-start-x: 2%; --store-select-dust-start-y: 7%; --store-select-dust-drift-x: 62%; --store-select-dust-drift-y: -6%; --store-select-dust-fall-x: 142%; --store-select-dust-fall-y: 74%; --store-select-dust-deep-x: 132%; --store-select-dust-deep-y: 160%; --store-select-dust-twinkle-delay: .03s; width: 7.2%; }
.store-select-flame-gold-dust i:nth-child(2) { --store-select-dust-start-x: -5%; --store-select-dust-start-y: -4%; --store-select-dust-drift-x: 88%; --store-select-dust-drift-y: -17%; --store-select-dust-fall-x: 164%; --store-select-dust-fall-y: 62%; --store-select-dust-deep-x: 151%; --store-select-dust-deep-y: 151%; --store-select-dust-twinkle-delay: .12s; width: 3.8%; }
.store-select-flame-gold-dust i:nth-child(3) { --store-select-dust-start-x: 6%; --store-select-dust-start-y: 5%; --store-select-dust-drift-x: 121%; --store-select-dust-drift-y: -20%; --store-select-dust-fall-x: 196%; --store-select-dust-fall-y: 55%; --store-select-dust-deep-x: 181%; --store-select-dust-deep-y: 146%; --store-select-dust-twinkle-delay: .25s; width: 5.9%; }
.store-select-flame-gold-dust i:nth-child(4) { --store-select-dust-start-x: -8%; --store-select-dust-start-y: 8%; --store-select-dust-drift-x: 148%; --store-select-dust-drift-y: -11%; --store-select-dust-fall-x: 222%; --store-select-dust-fall-y: 72%; --store-select-dust-deep-x: 209%; --store-select-dust-deep-y: 166%; --store-select-dust-twinkle-delay: .38s; width: 8.1%; }
.store-select-flame-gold-dust i:nth-child(5) { --store-select-dust-start-x: 11%; --store-select-dust-start-y: -7%; --store-select-dust-drift-x: 181%; --store-select-dust-drift-y: -18%; --store-select-dust-fall-x: 249%; --store-select-dust-fall-y: 63%; --store-select-dust-deep-x: 235%; --store-select-dust-deep-y: 158%; --store-select-dust-twinkle-delay: .07s; width: 4.1%; }
.store-select-flame-gold-dust i:nth-child(6) { --store-select-dust-start-x: -10%; --store-select-dust-start-y: 1%; --store-select-dust-drift-x: 208%; --store-select-dust-drift-y: -5%; --store-select-dust-fall-x: 278%; --store-select-dust-fall-y: 80%; --store-select-dust-deep-x: 262%; --store-select-dust-deep-y: 177%; --store-select-dust-twinkle-delay: .31s; width: 6.8%; }
.store-select-flame-gold-dust i:nth-child(7) { --store-select-dust-start-x: 4%; --store-select-dust-start-y: 10%; --store-select-dust-drift-x: 238%; --store-select-dust-drift-y: 12%; --store-select-dust-fall-x: 307%; --store-select-dust-fall-y: 102%; --store-select-dust-deep-x: 289%; --store-select-dust-deep-y: 201%; --store-select-dust-twinkle-delay: .18s; width: 3.6%; }
.store-select-flame-gold-dust i:nth-child(8) { --store-select-dust-start-x: -14%; --store-select-dust-start-y: -7%; --store-select-dust-drift-x: 267%; --store-select-dust-drift-y: 26%; --store-select-dust-fall-x: 335%; --store-select-dust-fall-y: 120%; --store-select-dust-deep-x: 316%; --store-select-dust-deep-y: 219%; --store-select-dust-twinkle-delay: .44s; width: 7.6%; }
.store-select-flame-gold-dust i:nth-child(9) { --store-select-dust-start-x: 216%; --store-select-dust-start-y: 220%; --store-select-dust-drift-x: 247%; --store-select-dust-drift-y: 238%; --store-select-dust-fall-x: 237%; --store-select-dust-fall-y: 315%; --store-select-dust-deep-x: 226%; --store-select-dust-deep-y: 398%; --store-select-dust-return-delay: 0s; --store-select-dust-twinkle-delay: .08s; width: 4.4%; }
.store-select-flame-gold-dust i:nth-child(10) { --store-select-dust-start-x: 119%; --store-select-dust-start-y: 241%; --store-select-dust-drift-x: 151%; --store-select-dust-drift-y: 259%; --store-select-dust-fall-x: 143%; --store-select-dust-fall-y: 337%; --store-select-dust-deep-x: 131%; --store-select-dust-deep-y: 420%; --store-select-dust-return-delay: .18s; --store-select-dust-twinkle-delay: .21s; width: 7.9%; }
.store-select-flame-gold-dust i:nth-child(11) { --store-select-dust-start-x: -7%; --store-select-dust-start-y: 208%; --store-select-dust-drift-x: 27%; --store-select-dust-drift-y: 229%; --store-select-dust-fall-x: 18%; --store-select-dust-fall-y: 310%; --store-select-dust-deep-x: 5%; --store-select-dust-deep-y: 398%; --store-select-dust-return-delay: .36s; --store-select-dust-twinkle-delay: .34s; width: 3.9%; }
.store-select-flame-gold-dust i:nth-child(12) { --store-select-dust-start-x: -104%; --store-select-dust-start-y: 123%; --store-select-dust-drift-x: -68%; --store-select-dust-drift-y: 145%; --store-select-dust-fall-x: -76%; --store-select-dust-fall-y: 231%; --store-select-dust-deep-x: -89%; --store-select-dust-deep-y: 323%; --store-select-dust-return-delay: .54s; --store-select-dust-twinkle-delay: .48s; width: 6.7%; }
.store-select-flame-gold-dust i:nth-child(13) { --store-select-dust-start-x: 180%; --store-select-dust-start-y: 229%; --store-select-dust-drift-x: 209%; --store-select-dust-drift-y: 247%; --store-select-dust-fall-x: 200%; --store-select-dust-fall-y: 326%; --store-select-dust-deep-x: 187%; --store-select-dust-deep-y: 410%; --store-select-dust-return-delay: 0s; --store-select-dust-twinkle-delay: .14s; width: 3.4%; }
.store-select-flame-gold-dust i:nth-child(14) { --store-select-dust-start-x: 71%; --store-select-dust-start-y: 236%; --store-select-dust-drift-x: 103%; --store-select-dust-drift-y: 256%; --store-select-dust-fall-x: 95%; --store-select-dust-fall-y: 337%; --store-select-dust-deep-x: 82%; --store-select-dust-deep-y: 421%; --store-select-dust-return-delay: .18s; --store-select-dust-twinkle-delay: .40s; width: 7.1%; }
.store-select-flame-gold-dust i:nth-child(15) { --store-select-dust-start-x: -45%; --store-select-dust-start-y: 187%; --store-select-dust-drift-x: -10%; --store-select-dust-drift-y: 208%; --store-select-dust-fall-x: -18%; --store-select-dust-fall-y: 290%; --store-select-dust-deep-x: -31%; --store-select-dust-deep-y: 379%; --store-select-dust-return-delay: .36s; --store-select-dust-twinkle-delay: .28s; width: 3.7%; }
	.store-select-flame-gold-dust i:nth-child(16) { --store-select-dust-start-x: -142%; --store-select-dust-start-y: 74%; --store-select-dust-drift-x: -107%; --store-select-dust-drift-y: 96%; --store-select-dust-fall-x: -116%; --store-select-dust-fall-y: 181%; --store-select-dust-deep-x: -130%; --store-select-dust-deep-y: 274%; --store-select-dust-return-delay: .54s; --store-select-dust-twinkle-delay: .52s; width: 8.3%; }
	.store-select-flame-gold-dust i:nth-child(17) { --store-select-dust-start-x: 213%; --store-select-dust-start-y: 218%; --store-select-dust-drift-x: 242%; --store-select-dust-drift-y: 251%; --store-select-dust-fall-x: 235%; --store-select-dust-fall-y: 339%; --store-select-dust-deep-x: 222%; --store-select-dust-deep-y: 431%; --store-select-dust-return-delay: .03s; --store-select-dust-twinkle-delay: .04s; width: 2.0%; }
	.store-select-flame-gold-dust i:nth-child(18) { --store-select-dust-start-x: 156%; --store-select-dust-start-y: 231%; --store-select-dust-drift-x: 187%; --store-select-dust-drift-y: 259%; --store-select-dust-fall-x: 177%; --store-select-dust-fall-y: 347%; --store-select-dust-deep-x: 163%; --store-select-dust-deep-y: 440%; --store-select-dust-return-delay: .10s; --store-select-dust-twinkle-delay: .16s; width: 2.7%; }
	.store-select-flame-gold-dust i:nth-child(19) { --store-select-dust-start-x: 88%; --store-select-dust-start-y: 236%; --store-select-dust-drift-x: 118%; --store-select-dust-drift-y: 265%; --store-select-dust-fall-x: 109%; --store-select-dust-fall-y: 351%; --store-select-dust-deep-x: 95%; --store-select-dust-deep-y: 445%; --store-select-dust-return-delay: .17s; --store-select-dust-twinkle-delay: .29s; width: 1.8%; }
	.store-select-flame-gold-dust i:nth-child(20) { --store-select-dust-start-x: 14%; --store-select-dust-start-y: 215%; --store-select-dust-drift-x: 44%; --store-select-dust-drift-y: 245%; --store-select-dust-fall-x: 35%; --store-select-dust-fall-y: 334%; --store-select-dust-deep-x: 21%; --store-select-dust-deep-y: 427%; --store-select-dust-return-delay: .24s; --store-select-dust-twinkle-delay: .38s; width: 2.4%; }
	.store-select-flame-gold-dust i:nth-child(21) { --store-select-dust-start-x: -55%; --store-select-dust-start-y: 182%; --store-select-dust-drift-x: -23%; --store-select-dust-drift-y: 215%; --store-select-dust-fall-x: -32%; --store-select-dust-fall-y: 300%; --store-select-dust-deep-x: -47%; --store-select-dust-deep-y: 393%; --store-select-dust-return-delay: .31s; --store-select-dust-twinkle-delay: .49s; width: 1.9%; }
	.store-select-flame-gold-dust i:nth-child(22) { --store-select-dust-start-x: -116%; --store-select-dust-start-y: 118%; --store-select-dust-drift-x: -82%; --store-select-dust-drift-y: 151%; --store-select-dust-fall-x: -92%; --store-select-dust-fall-y: 238%; --store-select-dust-deep-x: -106%; --store-select-dust-deep-y: 333%; --store-select-dust-return-delay: .38s; --store-select-dust-twinkle-delay: .57s; width: 2.8%; }
	.store-select-flame-gold-dust i:nth-child(23) { --store-select-dust-start-x: -151%; --store-select-dust-start-y: 57%; --store-select-dust-drift-x: -119%; --store-select-dust-drift-y: 89%; --store-select-dust-fall-x: -128%; --store-select-dust-fall-y: 176%; --store-select-dust-deep-x: -143%; --store-select-dust-deep-y: 269%; --store-select-dust-return-delay: .45s; --store-select-dust-twinkle-delay: .64s; width: 1.7%; }
	.store-select-flame-gold-dust i:nth-child(24) { --store-select-dust-start-x: -109%; --store-select-dust-start-y: 19%; --store-select-dust-drift-x: -78%; --store-select-dust-drift-y: 51%; --store-select-dust-fall-x: -88%; --store-select-dust-fall-y: 138%; --store-select-dust-deep-x: -102%; --store-select-dust-deep-y: 229%; --store-select-dust-return-delay: .50s; --store-select-dust-twinkle-delay: .73s; width: 2.3%; }
	.store-select-flame-gold-dust i:nth-child(25) { --store-select-dust-start-x: 194%; --store-select-dust-start-y: 228%; --store-select-dust-drift-x: 224%; --store-select-dust-drift-y: 258%; --store-select-dust-fall-x: 211%; --store-select-dust-fall-y: 350%; --store-select-dust-deep-x: 196%; --store-select-dust-deep-y: 448%; --store-select-dust-return-delay: .06s; --store-select-dust-twinkle-delay: .08s; width: 7.1%; }
	.store-select-flame-gold-dust i:nth-child(26) { --store-select-dust-start-x: 98%; --store-select-dust-start-y: 235%; --store-select-dust-drift-x: 130%; --store-select-dust-drift-y: 269%; --store-select-dust-fall-x: 117%; --store-select-dust-fall-y: 360%; --store-select-dust-deep-x: 103%; --store-select-dust-deep-y: 456%; --store-select-dust-return-delay: .15s; --store-select-dust-twinkle-delay: .19s; width: 5.8%; }
	.store-select-flame-gold-dust i:nth-child(27) { --store-select-dust-start-x: -4%; --store-select-dust-start-y: 207%; --store-select-dust-drift-x: 29%; --store-select-dust-drift-y: 240%; --store-select-dust-fall-x: 15%; --store-select-dust-fall-y: 332%; --store-select-dust-deep-x: 1%; --store-select-dust-deep-y: 427%; --store-select-dust-return-delay: .25s; --store-select-dust-twinkle-delay: .31s; width: 8.4%; }
	.store-select-flame-gold-dust i:nth-child(28) { --store-select-dust-start-x: -102%; --store-select-dust-start-y: 134%; --store-select-dust-drift-x: -68%; --store-select-dust-drift-y: 169%; --store-select-dust-fall-x: -84%; --store-select-dust-fall-y: 258%; --store-select-dust-deep-x: -98%; --store-select-dust-deep-y: 353%; --store-select-dust-return-delay: .34s; --store-select-dust-twinkle-delay: .43s; width: 6.4%; }
	.store-select-flame-gold-dust i:nth-child(29) { --store-select-dust-start-x: -148%; --store-select-dust-start-y: 59%; --store-select-dust-drift-x: -115%; --store-select-dust-drift-y: 93%; --store-select-dust-fall-x: -130%; --store-select-dust-fall-y: 183%; --store-select-dust-deep-x: -145%; --store-select-dust-deep-y: 278%; --store-select-dust-return-delay: .43s; --store-select-dust-twinkle-delay: .55s; width: 7.8%; }
	.store-select-flame-gold-dust i:nth-child(30) { --store-select-dust-start-x: -126%; --store-select-dust-start-y: 10%; --store-select-dust-drift-x: -92%; --store-select-dust-drift-y: 44%; --store-select-dust-fall-x: -107%; --store-select-dust-fall-y: 134%; --store-select-dust-deep-x: -122%; --store-select-dust-deep-y: 228%; --store-select-dust-return-delay: .49s; --store-select-dust-twinkle-delay: .61s; width: 5.6%; }
	.store-select-flame-gold-dust i:nth-child(31) { --store-select-dust-start-x: -72%; --store-select-dust-start-y: -19%; --store-select-dust-drift-x: -39%; --store-select-dust-drift-y: 17%; --store-select-dust-fall-x: -54%; --store-select-dust-fall-y: 104%; --store-select-dust-deep-x: -68%; --store-select-dust-deep-y: 198%; --store-select-dust-return-delay: .54s; --store-select-dust-twinkle-delay: .70s; width: 8.7%; }
	.store-select-flame-gold-dust i:nth-child(32) { --store-select-dust-start-x: -23%; --store-select-dust-start-y: -8%; --store-select-dust-drift-x: 11%; --store-select-dust-drift-y: 27%; --store-select-dust-fall-x: -4%; --store-select-dust-fall-y: 114%; --store-select-dust-deep-x: -18%; --store-select-dust-deep-y: 207%; --store-select-dust-return-delay: .58s; --store-select-dust-twinkle-delay: .79s; width: 6.2%; }
	.store-select-flame-gold-dust i:nth-child(33) { --store-select-dust-start-x: 174%; --store-select-dust-start-y: 226%; --store-select-dust-drift-x: 204%; --store-select-dust-drift-y: 252%; --store-select-dust-fall-x: 193%; --store-select-dust-fall-y: 349%; --store-select-dust-deep-x: 178%; --store-select-dust-deep-y: 454%; --store-select-dust-return-delay: .02s; --store-select-dust-twinkle-delay: .11s; width: 1.15%; }
	.store-select-flame-gold-dust i:nth-child(34) { --store-select-dust-start-x: 132%; --store-select-dust-start-y: 235%; --store-select-dust-drift-x: 164%; --store-select-dust-drift-y: 264%; --store-select-dust-fall-x: 151%; --store-select-dust-fall-y: 358%; --store-select-dust-deep-x: 136%; --store-select-dust-deep-y: 462%; --store-select-dust-return-delay: .08s; --store-select-dust-twinkle-delay: .24s; width: .85%; }
	.store-select-flame-gold-dust i:nth-child(35) { --store-select-dust-start-x: 82%; --store-select-dust-start-y: 236%; --store-select-dust-drift-x: 114%; --store-select-dust-drift-y: 267%; --store-select-dust-fall-x: 100%; --store-select-dust-fall-y: 363%; --store-select-dust-deep-x: 86%; --store-select-dust-deep-y: 469%; --store-select-dust-return-delay: .15s; --store-select-dust-twinkle-delay: .37s; width: 1.05%; }
	.store-select-flame-gold-dust i:nth-child(36) { --store-select-dust-start-x: 30%; --store-select-dust-start-y: 219%; --store-select-dust-drift-x: 61%; --store-select-dust-drift-y: 249%; --store-select-dust-fall-x: 47%; --store-select-dust-fall-y: 342%; --store-select-dust-deep-x: 33%; --store-select-dust-deep-y: 446%; --store-select-dust-return-delay: .21s; --store-select-dust-twinkle-delay: .50s; width: .78%; }
	.store-select-flame-gold-dust i:nth-child(37) { --store-select-dust-start-x: -27%; --store-select-dust-start-y: 198%; --store-select-dust-drift-x: 4%; --store-select-dust-drift-y: 229%; --store-select-dust-fall-x: -10%; --store-select-dust-fall-y: 320%; --store-select-dust-deep-x: -25%; --store-select-dust-deep-y: 426%; --store-select-dust-return-delay: .28s; --store-select-dust-twinkle-delay: .63s; width: .96%; }
	.store-select-flame-gold-dust i:nth-child(38) { --store-select-dust-start-x: -82%; --store-select-dust-start-y: 151%; --store-select-dust-drift-x: -51%; --store-select-dust-drift-y: 182%; --store-select-dust-fall-x: -65%; --store-select-dust-fall-y: 274%; --store-select-dust-deep-x: -80%; --store-select-dust-deep-y: 382%; --store-select-dust-return-delay: .35s; --store-select-dust-twinkle-delay: .76s; width: 1.08%; }
	.store-select-flame-gold-dust i:nth-child(39) { --store-select-dust-start-x: -128%; --store-select-dust-start-y: 93%; --store-select-dust-drift-x: -96%; --store-select-dust-drift-y: 124%; --store-select-dust-fall-x: -110%; --store-select-dust-fall-y: 217%; --store-select-dust-deep-x: -125%; --store-select-dust-deep-y: 324%; --store-select-dust-return-delay: .42s; --store-select-dust-twinkle-delay: .05s; width: .82%; }
	.store-select-flame-gold-dust i:nth-child(40) { --store-select-dust-start-x: -152%; --store-select-dust-start-y: 46%; --store-select-dust-drift-x: -120%; --store-select-dust-drift-y: 77%; --store-select-dust-fall-x: -134%; --store-select-dust-fall-y: 169%; --store-select-dust-deep-x: -149%; --store-select-dust-deep-y: 276%; --store-select-dust-return-delay: .49s; --store-select-dust-twinkle-delay: .18s; width: .92%; }
	.store-select-flame-gold-dust i:nth-child(41) { --store-select-dust-start-x: -118%; --store-select-dust-start-y: 9%; --store-select-dust-drift-x: -86%; --store-select-dust-drift-y: 40%; --store-select-dust-fall-x: -101%; --store-select-dust-fall-y: 132%; --store-select-dust-deep-x: -115%; --store-select-dust-deep-y: 239%; --store-select-dust-return-delay: .54s; --store-select-dust-twinkle-delay: .31s; width: .72%; }
	.store-select-flame-gold-dust i:nth-child(42) { --store-select-dust-start-x: -76%; --store-select-dust-start-y: -17%; --store-select-dust-drift-x: -44%; --store-select-dust-drift-y: 15%; --store-select-dust-fall-x: -58%; --store-select-dust-fall-y: 107%; --store-select-dust-deep-x: -73%; --store-select-dust-deep-y: 214%; --store-select-dust-return-delay: .59s; --store-select-dust-twinkle-delay: .44s; width: 1.12%; }
	.store-select-flame-gold-dust i:nth-child(43) { --store-select-dust-start-x: -35%; --store-select-dust-start-y: -15%; --store-select-dust-drift-x: -2%; --store-select-dust-drift-y: 17%; --store-select-dust-fall-x: -16%; --store-select-dust-fall-y: 109%; --store-select-dust-deep-x: -31%; --store-select-dust-deep-y: 216%; --store-select-dust-return-delay: .64s; --store-select-dust-twinkle-delay: .57s; width: .88%; }
	.store-select-flame-gold-dust i:nth-child(44) { --store-select-dust-start-x: 6%; --store-select-dust-start-y: 4%; --store-select-dust-drift-x: 39%; --store-select-dust-drift-y: 36%; --store-select-dust-fall-x: 25%; --store-select-dust-fall-y: 128%; --store-select-dust-deep-x: 10%; --store-select-dust-deep-y: 235%; --store-select-dust-return-delay: .69s; --store-select-dust-twinkle-delay: .70s; width: 1%; }
	.store-select-flame-gold-dust i:nth-child(45) { --store-select-dust-start-x: 196%; --store-select-dust-start-y: 224%; --store-select-dust-drift-x: 228%; --store-select-dust-drift-y: 262%; --store-select-dust-fall-x: 213%; --store-select-dust-fall-y: 358%; --store-select-dust-deep-x: 196%; --store-select-dust-deep-y: 462%; --store-select-dust-return-delay: .02s; --store-select-dust-twinkle-delay: .06s; width: .95%; }
	.store-select-flame-gold-dust i:nth-child(46) { --store-select-dust-start-x: 145%; --store-select-dust-start-y: 235%; --store-select-dust-drift-x: 177%; --store-select-dust-drift-y: 269%; --store-select-dust-fall-x: 162%; --store-select-dust-fall-y: 365%; --store-select-dust-deep-x: 147%; --store-select-dust-deep-y: 470%; --store-select-dust-return-delay: .10s; --store-select-dust-twinkle-delay: .17s; width: 1.25%; }
	.store-select-flame-gold-dust i:nth-child(47) { --store-select-dust-start-x: 92%; --store-select-dust-start-y: 241%; --store-select-dust-drift-x: 123%; --store-select-dust-drift-y: 274%; --store-select-dust-fall-x: 108%; --store-select-dust-fall-y: 370%; --store-select-dust-deep-x: 94%; --store-select-dust-deep-y: 478%; --store-select-dust-return-delay: .18s; --store-select-dust-twinkle-delay: .28s; width: .82%; }
	.store-select-flame-gold-dust i:nth-child(48) { --store-select-dust-start-x: 35%; --store-select-dust-start-y: 220%; --store-select-dust-drift-x: 66%; --store-select-dust-drift-y: 253%; --store-select-dust-fall-x: 51%; --store-select-dust-fall-y: 347%; --store-select-dust-deep-x: 37%; --store-select-dust-deep-y: 452%; --store-select-dust-return-delay: .26s; --store-select-dust-twinkle-delay: .39s; width: 1.08%; }
	.store-select-flame-gold-dust i:nth-child(49) { --store-select-dust-start-x: -28%; --store-select-dust-start-y: 199%; --store-select-dust-drift-x: 4%; --store-select-dust-drift-y: 232%; --store-select-dust-fall-x: -10%; --store-select-dust-fall-y: 326%; --store-select-dust-deep-x: -24%; --store-select-dust-deep-y: 429%; --store-select-dust-return-delay: .34s; --store-select-dust-twinkle-delay: .50s; width: .88%; }
	.store-select-flame-gold-dust i:nth-child(50) { --store-select-dust-start-x: -88%; --store-select-dust-start-y: 151%; --store-select-dust-drift-x: -56%; --store-select-dust-drift-y: 184%; --store-select-dust-fall-x: -70%; --store-select-dust-fall-y: 278%; --store-select-dust-deep-x: -84%; --store-select-dust-deep-y: 380%; --store-select-dust-return-delay: .42s; --store-select-dust-twinkle-delay: .61s; width: 1.18%; }
		.store-select-flame-gold-dust i:nth-child(51) { --store-select-dust-start-x: -136%; --store-select-dust-start-y: 91%; --store-select-dust-drift-x: -104%; --store-select-dust-drift-y: 124%; --store-select-dust-fall-x: -118%; --store-select-dust-fall-y: 218%; --store-select-dust-deep-x: -132%; --store-select-dust-deep-y: 319%; --store-select-dust-return-delay: .50s; --store-select-dust-twinkle-delay: .72s; width: .76%; }
		.store-select-flame-gold-dust i:nth-child(52) { --store-select-dust-start-x: -118%; --store-select-dust-start-y: 31%; --store-select-dust-drift-x: -86%; --store-select-dust-drift-y: 64%; --store-select-dust-fall-x: -100%; --store-select-dust-fall-y: 158%; --store-select-dust-deep-x: -114%; --store-select-dust-deep-y: 258%; --store-select-dust-return-delay: .58s; --store-select-dust-twinkle-delay: .83s; width: 1.02%; }
			.store-select-flame-gold-dust i:nth-child(53) { --store-select-dust-emission-x: 326%; --store-select-dust-emission-y: 150%; --store-select-dust-emission-delay: 2.83s; --store-select-dust-drift-x: 7%; --store-select-dust-drift-y: 7%; --store-select-dust-fall-x: 4%; --store-select-dust-fall-y: 23%; --store-select-dust-twinkle-delay: .04s; width: 1.12%; }
			.store-select-flame-gold-dust i:nth-child(54) { --store-select-dust-emission-x: 286%; --store-select-dust-emission-y: 185%; --store-select-dust-emission-delay: 2.94s; --store-select-dust-drift-x: 4%; --store-select-dust-drift-y: 8%; --store-select-dust-fall-x: -2%; --store-select-dust-fall-y: 24%; --store-select-dust-twinkle-delay: .18s; width: .82%; }
			.store-select-flame-gold-dust i:nth-child(55) { --store-select-dust-emission-x: 216%; --store-select-dust-emission-y: 218%; --store-select-dust-emission-delay: 3.10s; --store-select-dust-drift-x: -2%; --store-select-dust-drift-y: 9%; --store-select-dust-fall-x: -9%; --store-select-dust-fall-y: 26%; --store-select-dust-twinkle-delay: .33s; width: 1.04%; }
			.store-select-flame-gold-dust i:nth-child(56) { --store-select-dust-emission-x: 153%; --store-select-dust-emission-y: 238%; --store-select-dust-emission-delay: 3.22s; --store-select-dust-drift-x: -5%; --store-select-dust-drift-y: 7%; --store-select-dust-fall-x: -13%; --store-select-dust-fall-y: 24%; --store-select-dust-twinkle-delay: .46s; width: .74%; }
			.store-select-flame-gold-dust i:nth-child(57) { --store-select-dust-emission-x: 72%; --store-select-dust-emission-y: 236%; --store-select-dust-emission-delay: 3.38s; --store-select-dust-drift-x: -7%; --store-select-dust-drift-y: 8%; --store-select-dust-fall-x: -15%; --store-select-dust-fall-y: 26%; --store-select-dust-twinkle-delay: .61s; width: 1.18%; }
			.store-select-flame-gold-dust i:nth-child(58) { --store-select-dust-emission-x: -10%; --store-select-dust-emission-y: 208%; --store-select-dust-emission-delay: 3.53s; --store-select-dust-drift-x: -8%; --store-select-dust-drift-y: 9%; --store-select-dust-fall-x: -18%; --store-select-dust-fall-y: 28%; --store-select-dust-twinkle-delay: .09s; width: .88%; }
			.store-select-flame-gold-dust i:nth-child(59) { --store-select-dust-emission-x: -78%; --store-select-dust-emission-y: 158%; --store-select-dust-emission-delay: 3.65s; --store-select-dust-drift-x: -7%; --store-select-dust-drift-y: 7%; --store-select-dust-fall-x: -17%; --store-select-dust-fall-y: 25%; --store-select-dust-twinkle-delay: .25s; width: 1.06%; }
			.store-select-flame-gold-dust i:nth-child(60) { --store-select-dust-emission-x: -128%; --store-select-dust-emission-y: 94%; --store-select-dust-emission-delay: 3.75s; --store-select-dust-drift-x: -5%; --store-select-dust-drift-y: 7%; --store-select-dust-fall-x: -15%; --store-select-dust-fall-y: 24%; --store-select-dust-twinkle-delay: .42s; width: .79%; }
			.store-select-flame-gold-dust i:nth-child(61) { --store-select-dust-emission-x: -150%; --store-select-dust-emission-y: 52%; --store-select-dust-emission-delay: 3.84s; --store-select-dust-drift-x: -3%; --store-select-dust-drift-y: 6%; --store-select-dust-fall-x: -12%; --store-select-dust-fall-y: 22%; --store-select-dust-twinkle-delay: .58s; width: 1%; }
			.store-select-flame-gold-dust i:nth-child(62) { --store-select-dust-emission-x: -115%; --store-select-dust-emission-y: 34%; --store-select-dust-emission-delay: 3.89s; --store-select-dust-drift-x: -3%; --store-select-dust-drift-y: 6%; --store-select-dust-fall-x: -10%; --store-select-dust-fall-y: 21%; --store-select-dust-twinkle-delay: .15s; width: .76%; }
			.store-select-flame-gold-dust i:nth-child(63) { --store-select-dust-emission-x: -64%; --store-select-dust-emission-y: 15%; --store-select-dust-emission-delay: 3.96s; --store-select-dust-drift-x: -2%; --store-select-dust-drift-y: 5%; --store-select-dust-fall-x: -8%; --store-select-dust-fall-y: 19%; --store-select-dust-twinkle-delay: .31s; width: 1.02%; }
			.store-select-flame-gold-dust i:nth-child(64) { --store-select-dust-emission-x: -27%; --store-select-dust-emission-y: 5%; --store-select-dust-emission-delay: 4.03s; --store-select-dust-drift-x: -2%; --store-select-dust-drift-y: 4%; --store-select-dust-fall-x: -6%; --store-select-dust-fall-y: 17%; --store-select-dust-twinkle-delay: .47s; width: .68%; }
			.store-select-flame-gold-dust i:nth-child(65) { --store-select-dust-emission-x: -5%; --store-select-dust-emission-y: .7%; --store-select-dust-emission-delay: 4.14s; --store-select-dust-drift-x: -1%; --store-select-dust-drift-y: 4%; --store-select-dust-fall-x: -4%; --store-select-dust-fall-y: 15%; --store-select-dust-twinkle-delay: .64s; width: .92%; }

        .store-select-flame-color-orange { --store-select-flame-hue: 0deg; --store-select-text-core: rgba(255, 226, 159, .46); --store-select-text-glow: rgba(255, 156, 52, .28); }
        .store-select-flame-color-pink { --store-select-flame-hue: 292deg; --store-select-text-core: rgba(255, 184, 225, .60); --store-select-text-glow: rgba(255, 92, 190, .40); }
        .store-select-flame-color-blue { --store-select-flame-hue: 180deg; --store-select-text-core: rgba(185, 225, 255, .58); --store-select-text-glow: rgba(74, 166, 255, .38); }
        .store-select-flame-color-cyan { --store-select-flame-hue: 120deg; --store-select-text-core: rgba(181, 255, 239, .58); --store-select-text-glow: rgba(40, 226, 190, .38); }
        .store-select-flame-color-purple { --store-select-flame-hue: 230deg; --store-select-text-core: rgba(218, 193, 255, .60); --store-select-text-glow: rgba(142, 83, 255, .40); }
        .store-select-flame-color-rainbow { --store-select-text-core: rgba(255, 210, 224, .58); --store-select-text-glow: rgba(180, 120, 255, .38); }

		@property --store-select-flame-hue {
		  syntax: "<angle>";
		  inherits: true;
		  initial-value: 0deg;
		}

		@property --store-select-wick-spark-hue {
		  syntax: "<angle>";
		  inherits: true;
		  initial-value: 200deg;
		}

		@property --store-select-butterfly-near-opacity {
		  syntax: "<number>";
		  inherits: true;
		  initial-value: .98;
		}

		@property --store-select-butterfly-far-opacity {
		  syntax: "<number>";
		  inherits: true;
		  initial-value: .46;
		}

        @property --store-select-text-core {
          syntax: "<color>";
          inherits: true;
          initial-value: rgba(255, 226, 159, .46);
        }

        @property --store-select-text-glow {
          syntax: "<color>";
          inherits: true;
          initial-value: rgba(255, 156, 52, .28);
        }

        @property --store-select-text-cast-strength {
          syntax: "<number>";
          inherits: true;
          initial-value: .32;
        }

        @property --store-select-text-cast-reach {
          syntax: "<percentage>";
          inherits: true;
          initial-value: 44%;
        }

        .store-select-real-flame.store-select-flame-color-rainbow {
          animation: store-select-real-flame-appear 3.6s cubic-bezier(.22, .8, .28, 1) forwards, store-select-real-flame-resting 2.36s linear 3.6s infinite, store-select-rainbow-hue 4.8s linear 3.6s infinite;
        }

.store-select-real-flame.store-select-real-flame-cycle-enabled {
animation: store-select-real-flame-appear 3.6s cubic-bezier(.22, .8, .28, 1) forwards, store-select-real-flame-gif-cycle 16.311s linear 3.6s infinite;
}

.store-select-real-flame.store-select-real-flame-cycle-enabled.store-select-flame-color-rainbow {
animation: store-select-real-flame-appear 3.6s cubic-bezier(.22, .8, .28, 1) forwards, store-select-real-flame-gif-cycle 16.311s linear 3.6s infinite, store-select-rainbow-hue 4.8s linear 3.6s infinite;
}

.store-select-circular-flame-halo.store-select-flame-color-rainbow {
animation: store-select-circular-flame-halo-cycle 16.311s linear 3.6s infinite, store-select-rainbow-hue 4.8s linear 3.6s infinite;
}

.store-select-flame-side-halo.store-select-flame-color-rainbow {
animation: store-select-flame-side-halo-cycle 16.311s linear 3.6s infinite, store-select-rainbow-hue 4.8s linear 3.6s infinite;
}

.store-select-flame-smoke.store-select-flame-color-rainbow {
animation: store-select-flame-smoke-cycle 16.311s linear 3.6s infinite, store-select-rainbow-hue 4.8s linear 3.6s infinite;
}

.store-select-flame-wick-light.store-select-flame-color-rainbow {
animation: store-select-flame-wick-light-cycle 16.311s linear 3.6s infinite, store-select-rainbow-hue 4.8s linear 3.6s infinite;
}

.store-select-flame-connection-light.store-select-flame-color-rainbow {
animation: store-select-flame-connection-light-cycle 16.311s linear 3.6s infinite, store-select-rainbow-hue 4.8s linear 3.6s infinite;
}

.store-select-wick-sparks.store-select-flame-color-rainbow {
animation: store-select-wick-spark-cycle 16.311s linear 3.6s infinite, store-select-rainbow-hue 4.8s linear 3.6s infinite;
}

	        .store-select-warmth.store-select-flame-color-rainbow {
          animation: store-select-warmth-cast 2.64s ease-in-out 3.6s infinite, store-select-rainbow-hue 4.8s linear 3.6s infinite;
        }

        .store-select-warmth {
          position: absolute;
          z-index: 4;
          left: 3.25%;
          top: 21.5%;
          width: 53%;
          height: 25.3%;
          pointer-events: none;
          border-radius: 50%;
          opacity: 0;
          mix-blend-mode: screen;
          background: radial-gradient(circle at 35% 48%, rgba(255, 231, 166, .62) 0%, rgba(255, 190, 88, .34) 16%, rgba(255, 143, 43, .14) 42%, rgba(255, 111, 29, .035) 70%, rgba(255, 102, 22, 0) 100%), radial-gradient(circle at 35% 48%, rgba(255, 156, 52, .20) 0%, rgba(255, 111, 29, .065) 48%, rgba(255, 102, 22, .018) 78%, rgba(255, 102, 22, 0) 100%);
          filter: hue-rotate(var(--store-select-flame-hue)) blur(1.92rem);
          transform: translate3d(0, 0, 0) scale(.94);
          transform-origin: 35% 48%;
          animation: store-select-warmth-cast 2.64s ease-in-out 3.6s infinite;
        }

        .store-select-warm-text {
          position: relative;
          display: inline-block;
          isolation: isolate;
          animation: store-select-warm-text-warmth-sync 2.64s ease-in-out 3.6s infinite;
        }

        .store-select-warm-text::after {
          position: absolute;
          inset: 0;
          content: attr(data-warm-title);
          pointer-events: none;
          white-space: nowrap;
          color: transparent;
          opacity: var(--store-select-text-cast-strength);
          background: linear-gradient(90deg, color-mix(in srgb, var(--store-select-text-core) 94%, transparent) 0%, color-mix(in srgb, var(--store-select-text-glow) 78%, transparent) 18%, color-mix(in srgb, var(--store-select-text-glow) 48%, transparent) var(--store-select-text-cast-reach), color-mix(in srgb, var(--store-select-text-glow) 15%, transparent) 68%, transparent 86%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 .32rem var(--store-select-text-glow));
        }

        .store-select-warm-text.store-select-flame-color-rainbow {
          animation: store-select-warm-text-warmth-sync 2.64s ease-in-out 3.6s infinite, store-select-text-rainbow 4.8s linear 3.6s infinite;
        }

        @keyframes store-select-logo-reveal {
          0%, 6% { opacity: 0; transform: translate3d(-1.2%, .8%, 0) scale(.955); }
          13% { opacity: .12; transform: translate3d(.9%, .5%, 0) scale(.97); }
          21% { opacity: .33; transform: translate3d(-.55%, .35%, 0) scale(.976); }
          31% { opacity: .22; transform: translate3d(.35%, .15%, 0) scale(.984); }
          43% { opacity: .57; transform: translate3d(-.2%, .1%, 0) scale(.99); }
          58% { opacity: .72; transform: translate3d(.12%, 0, 0) scale(.996); }
          76% { opacity: .91; transform: translate3d(0, 0, 0) scale(1); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }

        @keyframes store-select-glitch-a {
          0%, 8%, 26%, 62%, 100% { opacity: 0; clip-path: inset(0 0 100% 0); transform: translate3d(0, 0, 0); }
          14% { opacity: .35; clip-path: inset(12% 0 73% 0); transform: translate3d(-2.1%, 0, 0); }
          20% { opacity: .18; clip-path: inset(52% 0 27% 0); transform: translate3d(1.6%, 0, 0); }
          34% { opacity: .27; clip-path: inset(75% 0 11% 0); transform: translate3d(-1.1%, 0, 0); }
          48% { opacity: .16; clip-path: inset(34% 0 48% 0); transform: translate3d(.8%, 0, 0); }
        }

        @keyframes store-select-glitch-b {
          0%, 10%, 31%, 65%, 100% { opacity: 0; clip-path: inset(100% 0 0 0); transform: translate3d(0, 0, 0); }
          17% { opacity: .28; clip-path: inset(67% 0 17% 0); transform: translate3d(1.8%, 0, 0); }
          25% { opacity: .22; clip-path: inset(22% 0 59% 0); transform: translate3d(-1.45%, 0, 0); }
          39% { opacity: .32; clip-path: inset(36% 0 42% 0); transform: translate3d(1%, 0, 0); }
          53% { opacity: .12; clip-path: inset(7% 0 80% 0); transform: translate3d(-.65%, 0, 0); }
        }

        @keyframes store-select-glitch-c {
          0%, 12%, 28%, 68%, 100% { opacity: 0; clip-path: inset(0 100% 0 0); transform: translate3d(0, 0, 0); }
          19% { opacity: .15; clip-path: inset(0 18% 0 58%); transform: translate3d(1.55%, 0, 0); }
          35% { opacity: .13; clip-path: inset(0 61% 0 23%); transform: translate3d(-1.15%, 0, 0); }
          51% { opacity: .18; clip-path: inset(0 36% 0 51%); transform: translate3d(.75%, 0, 0); }
        }

        @keyframes store-select-real-flame-appear {
          0%, 12% { opacity: 0; }
          24% { opacity: .26; }
          39% { opacity: .72; }
          54% { opacity: .5; }
          72% { opacity: .92; }
          100% { opacity: 1; }
        }

@keyframes store-select-real-flame-cycle {
  0% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.18) saturate(1.22); opacity: .99; transform: translate3d(-2.2%, 0, 0) rotate(2deg) scale(1.32, .92); }
  7% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.21) saturate(1.25); opacity: 1; transform: translate3d(-2.3%, -.1%, 0) rotate(-2.4deg) scale(1.38, .98); }
  14% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.16) saturate(1.19); opacity: .97; transform: translate3d(-2.1%, .1%, 0) rotate(3.4deg) scale(1.29, .86); }
	  19% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.18) saturate(1.20); opacity: .96; transform: translate3d(-2.3%, 0, 0) rotate(-1.3deg) scale(1.35, .95); }
	  20.9% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.18) saturate(1.22); opacity: .99; transform: translate3d(-2.2%, 0, 0) rotate(2deg) scale(1.32, .92); }
	  21.7% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.18) saturate(1.21); opacity: .82; transform: translate3d(-2.5%, .1%, 0) rotate(-4deg) scale(1.38, .96); }
	  22.6% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.10) saturate(1.04); opacity: .60; transform: translate3d(-2%, -.1%, 0) rotate(5deg) scale(1.44, .78); }
	  23.5% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.00) saturate(.74); opacity: .36; transform: translate3d(-2.3%, -.2%, 0) rotate(-3deg) scale(1.38, .72); }
	  24.4% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(.90) saturate(.42) blur(.025rem); opacity: .15; transform: translate3d(-2.1%, -.1%, 0) rotate(2deg) scale(1.18, .54); }
	  25.1% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(.78) saturate(.16) blur(.055rem); opacity: .04; transform: translate3d(-2.2%, 0, 0) rotate(0deg) scale(.72, .28); }
	  25.6%, 42.3% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(.66) saturate(.04) blur(.08rem); opacity: 0; transform: translate3d(-2.2%, 0, 0) rotate(0deg) scale(.44, .12); }
	  43.0%, 45.0%, 47.0% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(.86) saturate(.34); opacity: 0; transform: translate3d(-2.2%, 0, 0) rotate(0deg) scale(.66, .66); }
		  48.8%, 66.8% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(.84) saturate(.30); opacity: 0; transform: translate3d(-2.2%, 0, 0) rotate(0deg) scale(.66, .48); }
	  67.4% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(.92) saturate(.42); opacity: 0; transform: translate3d(-2.2%, 0, 0) rotate(.1deg) scale(.80, .54); }
	  68.2% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.02) saturate(.72); opacity: .12; transform: translate3d(-2.1%, 0, 0) rotate(.2deg) scale(.98, .68); }
	  69.2% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.14) saturate(1.04); opacity: .52; transform: translate3d(-2%, 0, 0) rotate(.4deg) scale(1.14, .82); }
	  70.2% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.26) saturate(1.24); opacity: .99; transform: translate3d(-1.4%, 0, 0) rotate(1deg) scale(1.25, .94); }
  70% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.17) saturate(1.20); opacity: .97; transform: translate3d(-2.2%, 0, 0) rotate(5deg) scale(1.33, .86); }
  86% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.21) saturate(1.25); opacity: .99; transform: translate3d(-2.2%, 0, 0) rotate(1deg) scale(1.36, .96); }
  100% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.18) saturate(1.22); opacity: .99; transform: translate3d(-2.2%, 0, 0) rotate(2deg) scale(1.32, .92); }
}

@keyframes store-select-real-flame-gif-cycle {
	  /* Keep the final real-flame frame through 00:00:00, then hand visible
	     output to the uploaded extinguish video's first native frame. */
	  0%, 19.0% { opacity: .99; }
	  19.1% { opacity: .99; animation-timing-function: steps(1, end); }
	  19.2%, 78.6% { opacity: 0; animation-timing-function: steps(1, end); }
	  78.7%, 100% { opacity: .99; }
}

@keyframes store-select-original-gif-fire-cycle {
  0%, 25.1%, 66.8%, 100% { opacity: 0; visibility: hidden; transform: none; animation-timing-function: steps(1, end); }
  25.6%, 66.7% { opacity: 1; visibility: visible; transform: none; animation-timing-function: steps(1, end); }
}

@keyframes store-select-uploaded-wick-spark-cycle {
  0%, 66.7%, 78.65%, 100% { opacity: 0; transform: none; animation-timing-function: steps(1, end); }
  66.8% { opacity: 1; transform: none; animation-timing-function: steps(1, end); }
  67.4% { opacity: 1; transform: none; }
  78.5% { opacity: 1; transform: none; animation-timing-function: steps(1, end); }
}

@keyframes store-select-uploaded-coin-embers-cycle {
  0%, 80.1%, 88.35%, 100% { opacity: 0; transform: none; animation-timing-function: steps(1, end); }
  80.2%, 88.3% { opacity: 1; transform: none; animation-timing-function: steps(1, end); }
}

@keyframes store-select-uploaded-top-smoke-cycle {
  0%, 42.3%, 55.2%, 100% { opacity: 0; transform: scale(2); animation-timing-function: steps(1, end); }
  42.4% { opacity: .74; transform: scale(2); animation-timing-function: steps(1, end); }
  55.1% { opacity: .74; transform: scale(2); animation-timing-function: steps(1, end); }
}

@keyframes store-select-uploaded-match-head-light-cycle {
		  /* Use the same 00:00:00 output window as the original extinguish MP4. */
		  0%, 19.0%, 26.52%, 100% { opacity: 0; transform: none; animation-timing-function: steps(1, end); }
		  19.1%, 26.51% { opacity: .98; transform: none; animation-timing-function: steps(1, end); }
}

@keyframes store-select-uploaded-right-smoke-cycle {
  0%, 25.1%, 42.4%, 100% { opacity: 0; transform: translate3d(0, 0, 0) scaleX(.04) scaleY(.30); animation-timing-function: steps(1, end); }
  25.6% { opacity: .82; transform: translate3d(1%, 0, 0) scaleX(.10) scaleY(.36); animation-timing-function: steps(1, end); }
  34% { opacity: .68; transform: translate3d(10%, -3%, 0) scaleX(.74) scaleY(.82); }
  42.3% { opacity: 0; transform: translate3d(22%, -5%, 0) scaleX(1.08) scaleY(1.06); animation-timing-function: steps(1, end); }
}

@keyframes store-select-uploaded-butterfly-overlay-cycle {
  0%, 25.1%, 66.8%, 100% { opacity: 0; animation-timing-function: steps(1, end); }
  25.6%, 66.7% { opacity: 1; animation-timing-function: steps(1, end); }
}

@keyframes store-select-uploaded-water-transition-cycle {
  /* 25.2% + (1.90s / 16.311s × 100) = 36.85%: no CSS fast-forward or truncation. */
  0%, 25.1%, 36.86%, 100% { opacity: 0; animation-timing-function: steps(1, end); }
  25.2%, 36.85% { opacity: .96; animation-timing-function: steps(1, end); }
}

@keyframes store-select-uploaded-new-flame-extinguish-video-cycle {
			  /* 00:00:00 begins at 19.1%. The untouched 1.208s native MP4 ends at 26.51%,
			     while its first native frame overlaps the final real-flame output. */
			  0%, 19.0%, 26.52%, 100% { opacity: 0; transform: translate3d(-2.2%, 0, 0) rotate(-1.4deg) scale(1.38, .84); animation-timing-function: steps(1, end); }
			  19.1%, 26.51% { opacity: .94; transform: translate3d(-2.2%, 0, 0) rotate(-1.4deg) scale(1.38, .84); animation-timing-function: steps(1, end); }
}

@keyframes store-select-uploaded-fireworks-cycle {
  /* 25.6% + 2000ms / 16311ms = 37.86%: one native playback with the butterfly. */
  0%, 25.5%, 37.87%, 100% { opacity: 0; animation-timing-function: steps(1, end); }
  25.6%, 37.86% { opacity: 1; animation-timing-function: steps(1, end); }
}

@keyframes store-select-birthday-copy-window {
  0%, 25.1%, 66.8%, 100% { opacity: 0; animation-timing-function: steps(1, end); }
  25.6%, 66.7% { opacity: 1; animation-timing-function: steps(1, end); }
}

@keyframes store-select-countdown-window {
  0%, 6.6%, 25.2%, 100% { opacity: 0; animation-timing-function: steps(1, end); }
  6.7%, 25.1% { opacity: 1; animation-timing-function: steps(1, end); }
}

@keyframes store-select-countdown-first {
  0%, 6.6%, 12.8%, 100% { opacity: 0; animation-timing-function: steps(1, end); }
  6.7%, 12.7% { opacity: 1; animation-timing-function: steps(1, end); }
}

@keyframes store-select-countdown-second {
  0%, 12.8%, 19.0%, 100% { opacity: 0; animation-timing-function: steps(1, end); }
  12.9%, 18.9% { opacity: 1; animation-timing-function: steps(1, end); }
}

@keyframes store-select-countdown-zero {
  0%, 19.0%, 25.2%, 100% { opacity: 0; animation-timing-function: steps(1, end); }
  19.1%, 25.1% { opacity: 1; animation-timing-function: steps(1, end); }
}

@keyframes store-select-circular-flame-halo-cycle {
	  0%, 19.0% { opacity: .72; transform: translate3d(0, 0, 0) scale(1.04); }
	  19.1% { opacity: .72; transform: translate3d(0, 0, 0) scale(1.04); animation-timing-function: steps(1, end); }
	  19.2%, 78.6% { opacity: 0; transform: translate3d(0, 0, 0) scale(.14); animation-timing-function: steps(1, end); }
	  78.7%, 100% { opacity: .72; transform: translate3d(0, 0, 0) scale(1.04); animation-timing-function: steps(1, end); }
}

@keyframes store-select-flame-side-halo-cycle {
	  0%, 19.0% { opacity: .50; transform: translate3d(0, 0, 0) scale(.86); }
	  19.1% { opacity: .50; transform: translate3d(0, 0, 0) scale(.86); animation-timing-function: steps(1, end); }
	  19.2%, 78.6% { opacity: 0; transform: translate3d(18%, 0, 0) scale(1.16); animation-timing-function: steps(1, end); }
	  78.7%, 100% { opacity: .50; transform: translate3d(0, 0, 0) scale(.86); animation-timing-function: steps(1, end); }
}

@keyframes store-select-flame-smoke-cycle {
  0%, 25.1% { opacity: 0; transform: translate3d(0, 0, 0) scaleX(.04) scaleY(.30); }
  25.6% { opacity: .18; transform: translate3d(1%, 0, 0) scaleX(.10) scaleY(.36); }
  27% { opacity: .24; transform: translate3d(3%, 0, 0) scaleX(.18) scaleY(.42); }
  30% { opacity: .70; transform: translate3d(9%, 0, 0) scaleX(.72) scaleY(.74); }
  35% { opacity: .58; transform: translate3d(22%, 0, 0) scaleX(1.34) scaleY(.54); }
  40% { opacity: .26; transform: translate3d(38%, 0, 0) scaleX(1.82) scaleY(.34); }
  42.3%, 100% { opacity: 0; transform: translate3d(48%, 0, 0) scaleX(2.04) scaleY(.22); }
}

@keyframes store-select-flame-wick-light-cycle {
  0%, 66.7% { opacity: 0; transform: translate3d(0, 0, 0) scale(.16); animation-timing-function: steps(1, end); }
  66.8% { opacity: 1; transform: translate3d(0, 0, 0) scale(1.86); }
  67.6% { opacity: .72; transform: translate3d(0, 0, 0) scale(1.12); }
  68.4% { opacity: .30; transform: translate3d(0, 0, 0) scale(.58); }
		  69.2%, 100% { opacity: 0; transform: translate3d(0, 0, 0) scale(.28); }
}

@keyframes store-select-flame-connection-light-cycle {
  0% { opacity: .62; transform: translate3d(0, 0, 0) scale(.72); }
  7% { opacity: .74; transform: translate3d(0, 0, 0) scale(.84); }
  14% { opacity: .50; transform: translate3d(0, 0, 0) scale(.68); }
  19% { opacity: .66; transform: translate3d(0, 0, 0) scale(.78); }
  25.6%, 67% { opacity: 0; transform: translate3d(0, 0, 0) scale(.54); }
  68% { opacity: .18; transform: translate3d(0, 0, 0) scale(.58); }
  70% { opacity: .68; transform: translate3d(0, 0, 0) scale(.78); }
  86% { opacity: .76; transform: translate3d(0, 0, 0) scale(.88); }
  100% { opacity: .62; transform: translate3d(0, 0, 0) scale(.72); }
}

@keyframes store-select-wick-spark-cycle {
  0%, 66.7%, 69.3%, 100% { opacity: 0; transform: translate3d(0, 0, 0) scale(.18); }
  66.8% { opacity: .28; transform: translate3d(0, 0, 0) scale(.48); }
  67.4% { opacity: .76; transform: translate3d(0, 0, 0) scale(.86); }
  68.2% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
  68.8% { opacity: .38; transform: translate3d(0, 0, 0) scale(.54); }
}

@keyframes store-select-original-gif-cycle-clock {
  0%, 100% { opacity: 0; transform: none; }
}

@keyframes store-select-butterfly-rainbow-color {
  0% { filter: url(#store-select-butterfly-luminance-key) hue-rotate(50deg) saturate(1.45) brightness(1.04) contrast(1.18) drop-shadow(0 0 .10rem rgba(255, 250, 255, .92)) drop-shadow(0 0 .30rem rgba(255, 137, 38, .76)) drop-shadow(0 0 .48rem rgba(255, 222, 132, .42)); }
  33% { filter: url(#store-select-butterfly-luminance-key) hue-rotate(170deg) saturate(1.45) brightness(1.04) contrast(1.18) drop-shadow(0 0 .10rem rgba(246, 255, 255, .92)) drop-shadow(0 0 .30rem rgba(30, 211, 181, .76)) drop-shadow(0 0 .48rem rgba(144, 255, 225, .42)); }
  66% { filter: url(#store-select-butterfly-luminance-key) hue-rotate(280deg) saturate(1.45) brightness(1.04) contrast(1.18) drop-shadow(0 0 .10rem rgba(250, 244, 255, .92)) drop-shadow(0 0 .30rem rgba(142, 83, 255, .76)) drop-shadow(0 0 .48rem rgba(212, 169, 255, .42)); }
  100% { filter: url(#store-select-butterfly-luminance-key) hue-rotate(410deg) saturate(1.45) brightness(1.04) contrast(1.18) drop-shadow(0 0 .10rem rgba(255, 250, 255, .92)) drop-shadow(0 0 .30rem rgba(255, 137, 38, .76)) drop-shadow(0 0 .48rem rgba(255, 222, 132, .42)); }
}

@keyframes store-select-flame-butterfly-left-large-wing {
  0%, 100% { transform: rotate(-18deg) rotateY(-18deg) rotateX(10deg) scaleX(.91) scaleY(1.02); }
  24% { transform: rotate(-18deg) rotateY(-48deg) rotateX(44deg) scaleX(.66) scaleY(.87); }
  50% { transform: rotate(-18deg) rotateY(-82deg) rotateX(78deg) scaleX(.30) scaleY(.62); }
  74% { transform: rotate(-18deg) rotateY(-49deg) rotateX(45deg) scaleX(.64) scaleY(.86); }
}

@keyframes store-select-flame-butterfly-left-small-wing {
  0%, 100% { transform: rotate(18deg) rotateY(-16deg) rotateX(8deg) scaleX(.86) scaleY(.98); }
  24% { transform: rotate(18deg) rotateY(-44deg) rotateX(38deg) scaleX(.64) scaleY(.84); }
  50% { transform: rotate(18deg) rotateY(-76deg) rotateX(70deg) scaleX(.31) scaleY(.64); }
  74% { transform: rotate(18deg) rotateY(-45deg) rotateX(39deg) scaleX(.62) scaleY(.83); }
}

@keyframes store-select-flame-butterfly-right-large-wing {
  0%, 100% { transform: rotate(18deg) rotateY(18deg) rotateX(10deg) scaleX(.91) scaleY(1.02); }
  24% { transform: rotate(18deg) rotateY(48deg) rotateX(44deg) scaleX(.66) scaleY(.87); }
  50% { transform: rotate(18deg) rotateY(82deg) rotateX(78deg) scaleX(.30) scaleY(.62); }
  74% { transform: rotate(18deg) rotateY(49deg) rotateX(45deg) scaleX(.64) scaleY(.86); }
}

@keyframes store-select-flame-butterfly-right-small-wing {
  0%, 100% { transform: rotate(-18deg) rotateY(16deg) rotateX(8deg) scaleX(.86) scaleY(.98); }
  24% { transform: rotate(-18deg) rotateY(44deg) rotateX(38deg) scaleX(.64) scaleY(.84); }
  50% { transform: rotate(-18deg) rotateY(76deg) rotateX(70deg) scaleX(.31) scaleY(.64); }
  74% { transform: rotate(-18deg) rotateY(45deg) rotateX(39deg) scaleX(.62) scaleY(.83); }
}

@keyframes store-select-flame-butterfly-synchronous-wingbeat {
  0%, 100% { transform: rotate(var(--store-select-wing-turn)) rotateY(var(--store-select-wing-y-open)) rotateX(var(--store-select-wing-x-open)) scaleX(var(--store-select-wing-scale-x-open)) scaleY(var(--store-select-wing-scale-y-open)); }
  12.5% { transform: rotate(var(--store-select-wing-turn)) rotateY(calc((var(--store-select-wing-y-open) + var(--store-select-wing-y-closed)) / 2.5)) rotateX(calc((var(--store-select-wing-x-open) + var(--store-select-wing-x-closed)) / 2.5)) scaleX(calc((var(--store-select-wing-scale-x-open) + var(--store-select-wing-scale-x-closed)) / 1.55)) scaleY(calc((var(--store-select-wing-scale-y-open) + var(--store-select-wing-scale-y-closed)) / 1.55)); }
  25% { transform: rotate(var(--store-select-wing-turn)) rotateY(calc((var(--store-select-wing-y-open) + var(--store-select-wing-y-closed)) / 1.55)) rotateX(calc((var(--store-select-wing-x-open) + var(--store-select-wing-x-closed)) / 1.55)) scaleX(calc((var(--store-select-wing-scale-x-open) + var(--store-select-wing-scale-x-closed)) / 2.15)) scaleY(calc((var(--store-select-wing-scale-y-open) + var(--store-select-wing-scale-y-closed)) / 2.15)); }
  37.5% { transform: rotate(var(--store-select-wing-turn)) rotateY(calc((var(--store-select-wing-y-open) + var(--store-select-wing-y-closed)) / 1.18)) rotateX(calc((var(--store-select-wing-x-open) + var(--store-select-wing-x-closed)) / 1.18)) scaleX(calc((var(--store-select-wing-scale-x-open) + var(--store-select-wing-scale-x-closed)) / 2.70)) scaleY(calc((var(--store-select-wing-scale-y-open) + var(--store-select-wing-scale-y-closed)) / 2.70)); }
  50% { transform: translate3d(var(--store-select-wing-up-gap-x), 0, var(--store-select-wing-up-depth)) rotate(var(--store-select-wing-turn)) rotateY(var(--store-select-wing-y-closed)) rotateX(var(--store-select-wing-x-closed)) scaleX(var(--store-select-wing-scale-x-closed)) scaleY(var(--store-select-wing-scale-y-closed)); }
  62.5% { transform: rotate(var(--store-select-wing-turn)) rotateY(calc((var(--store-select-wing-y-open) + var(--store-select-wing-y-closed)) / 1.18)) rotateX(calc((var(--store-select-wing-x-open) + var(--store-select-wing-x-closed)) / 1.18)) scaleX(calc((var(--store-select-wing-scale-x-open) + var(--store-select-wing-scale-x-closed)) / 2.70)) scaleY(calc((var(--store-select-wing-scale-y-open) + var(--store-select-wing-scale-y-closed)) / 2.70)); }
  75% { transform: rotate(var(--store-select-wing-turn)) rotateY(calc((var(--store-select-wing-y-open) + var(--store-select-wing-y-closed)) / 1.55)) rotateX(calc((var(--store-select-wing-x-open) + var(--store-select-wing-x-closed)) / 1.55)) scaleX(calc((var(--store-select-wing-scale-x-open) + var(--store-select-wing-scale-x-closed)) / 2.15)) scaleY(calc((var(--store-select-wing-scale-y-open) + var(--store-select-wing-scale-y-closed)) / 2.15)); }
  87.5% { transform: rotate(var(--store-select-wing-turn)) rotateY(calc((var(--store-select-wing-y-open) + var(--store-select-wing-y-closed)) / 2.5)) rotateX(calc((var(--store-select-wing-x-open) + var(--store-select-wing-x-closed)) / 2.5)) scaleX(calc((var(--store-select-wing-scale-x-open) + var(--store-select-wing-scale-x-closed)) / 1.55)) scaleY(calc((var(--store-select-wing-scale-y-open) + var(--store-select-wing-scale-y-closed)) / 1.55)); }
}

@keyframes store-select-flame-butterfly-body-occlusion {
  0%, 100% { opacity: .94; transform: rotate(-3deg) translateZ(.06rem) scaleX(1); }
  24% { opacity: .78; transform: rotate(-3deg) translateZ(.01rem) scaleX(.91); }
  42% { opacity: .26; transform: rotate(-3deg) translateZ(-.08rem) scaleX(.72); }
  50% { opacity: .02; transform: rotate(-3deg) translateZ(-.12rem) scaleX(.58); }
  58% { opacity: .18; transform: rotate(-3deg) translateZ(-.08rem) scaleX(.68); }
  74% { opacity: .76; transform: rotate(-3deg) translateZ(.01rem) scaleX(.90); }
}

@keyframes store-select-flame-gold-dust-outbound {
  0%, 24.0%, 42.4%, 100% { left: 50%; top: 50%; opacity: 0; transform: translate(-50%, -50%) scale(.28); }
  25.0% { left: calc(50% + var(--store-select-dust-start-x)); top: calc(50% + var(--store-select-dust-start-y)); opacity: .42; transform: translate(-50%, -50%) scale(.72); }
  26.5% { left: calc(50% + var(--store-select-dust-start-x)); top: calc(51% + var(--store-select-dust-start-y)); opacity: .92; transform: translate(-50%, -50%) scale(1.10); }
  29.0% { left: calc(50% + var(--store-select-dust-drift-x)); top: calc(50% + var(--store-select-dust-drift-y)); opacity: .88; transform: translate(-50%, -50%) scale(1.14); }
  33.5% { left: calc(50% + var(--store-select-dust-fall-x)); top: calc(50% + var(--store-select-dust-fall-y)); opacity: .72; transform: translate(-50%, -50%) scale(1.02); }
  39.5% { left: calc(50% + var(--store-select-dust-deep-x)); top: calc(50% + var(--store-select-dust-deep-y)); opacity: .38; transform: translate(-50%, -50%) scale(.74); }
  42.0% { left: calc(50% + var(--store-select-dust-deep-x)); top: calc(54% + var(--store-select-dust-deep-y)); opacity: .08; transform: translate(-50%, -50%) scale(.46); }
}

@keyframes store-select-flame-gold-dust-return {
  0%, 39.2%, 50.6%, 100% { left: 50%; top: 50%; opacity: 0; transform: translate(-50%, -50%) scale(.28); }
  39.8% { left: calc(50% + var(--store-select-dust-start-x)); top: calc(50% + var(--store-select-dust-start-y)); opacity: .48; transform: translate(-50%, -50%) scale(.76); }
  41.1% { left: calc(50% + var(--store-select-dust-drift-x)); top: calc(50% + var(--store-select-dust-drift-y)); opacity: .96; transform: translate(-50%, -50%) scale(1.14); }
  44.5% { left: calc(50% + var(--store-select-dust-fall-x)); top: calc(50% + var(--store-select-dust-fall-y)); opacity: .88; transform: translate(-50%, -50%) scale(1.08); }
  48.3% { left: calc(50% + var(--store-select-dust-deep-x)); top: calc(50% + var(--store-select-dust-deep-y)); opacity: .68; transform: translate(-50%, -50%) scale(.92); }
  50.2% { left: calc(50% + var(--store-select-dust-deep-x)); top: calc(54% + var(--store-select-dust-deep-y)); opacity: .26; transform: translate(-50%, -50%) scale(.64); }
}

@keyframes store-select-flame-gold-dust-live-tail {
  0% { left: calc(50% + var(--store-select-dust-emission-x)); top: calc(50% + var(--store-select-dust-emission-y)); opacity: 0; transform: translate(-50%, -50%) scale(.20); }
  .9% { left: calc(50% + var(--store-select-dust-emission-x)); top: calc(50% + var(--store-select-dust-emission-y)); opacity: .88; transform: translate(-50%, -50%) scale(.92); }
  5.8% { left: calc(50% + var(--store-select-dust-emission-x) + var(--store-select-dust-drift-x)); top: calc(50% + var(--store-select-dust-emission-y) + var(--store-select-dust-drift-y)); opacity: .64; transform: translate(-50%, -50%) scale(.76); }
  11.6% { left: calc(50% + var(--store-select-dust-emission-x) + var(--store-select-dust-fall-x)); top: calc(50% + var(--store-select-dust-emission-y) + var(--store-select-dust-fall-y)); opacity: .18; transform: translate(-50%, -50%) scale(.48); }
  14%, 100% { left: calc(50% + var(--store-select-dust-emission-x) + var(--store-select-dust-fall-x)); top: calc(50% + var(--store-select-dust-emission-y) + var(--store-select-dust-fall-y)); opacity: 0; transform: translate(-50%, -50%) scale(.30); }
}

@keyframes store-select-flame-gold-dust-tail-follow {
  0% { opacity: 0; transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(.26); }
  6% { opacity: var(--store-select-tail-peak-opacity, .86); transform: translate(-50%, -50%) translate3d(calc(var(--store-select-tail-drift-x) * .10), 1px, 0) scale(1); }
  32% { opacity: var(--store-select-tail-mid-opacity, .54); transform: translate(-50%, -50%) translate3d(calc(var(--store-select-tail-drift-x) * .40), calc(var(--store-select-tail-fall-y) * .28), 0) scale(.76); }
  70% { opacity: calc(var(--store-select-tail-mid-opacity, .54) * .24); transform: translate(-50%, -50%) translate3d(calc(var(--store-select-tail-drift-x) * .76), calc(var(--store-select-tail-fall-y) * .72), 0) scale(.56); }
  100% { opacity: 0; transform: translate(-50%, -50%) translate3d(var(--store-select-tail-drift-x), var(--store-select-tail-fall-y), 0) scale(.42); }
}

@keyframes store-select-flame-gold-dust-tail-twinkle {
  0%, 100% { filter: brightness(.78) saturate(.90); }
  48% { filter: brightness(1.86) saturate(1.24); }
}

@keyframes store-select-flame-gold-dust-return-fine {
  0%, 39.0%, 52.0%, 100% { left: 50%; top: 50%; opacity: 0; transform: translate(-50%, -50%) scale(.22); }
  39.6% { left: calc(50% + var(--store-select-dust-start-x)); top: calc(50% + var(--store-select-dust-start-y)); opacity: .30; transform: translate(-50%, -50%) scale(.52); }
  41.0% { left: calc(50% + var(--store-select-dust-drift-x)); top: calc(50% + var(--store-select-dust-drift-y)); opacity: .88; transform: translate(-50%, -50%) scale(.88); }
  44.4% { left: calc(50% + var(--store-select-dust-fall-x)); top: calc(50% + var(--store-select-dust-fall-y)); opacity: .68; transform: translate(-50%, -50%) scale(.74); }
  48.8% { left: calc(50% + var(--store-select-dust-deep-x)); top: calc(50% + var(--store-select-dust-deep-y)); opacity: .42; transform: translate(-50%, -50%) scale(.56); }
  51.5% { left: calc(50% + var(--store-select-dust-deep-x)); top: calc(56% + var(--store-select-dust-deep-y)); opacity: .08; transform: translate(-50%, -50%) scale(.34); }
}

@keyframes store-select-flame-gold-dust-return-micro {
  0%, 39.2%, 52.8%, 100% { left: 50%; top: 50%; opacity: 0; transform: translate(-50%, -50%) scale(.18); }
  39.8% { left: calc(50% + var(--store-select-dust-start-x)); top: calc(50% + var(--store-select-dust-start-y)); opacity: .18; transform: translate(-50%, -50%) scale(.46); }
  41.4% { left: calc(50% + var(--store-select-dust-drift-x)); top: calc(50% + var(--store-select-dust-drift-y)); opacity: .58; transform: translate(-50%, -50%) scale(.76); }
  45.2% { left: calc(50% + var(--store-select-dust-fall-x)); top: calc(50% + var(--store-select-dust-fall-y)); opacity: .42; transform: translate(-50%, -50%) scale(.62); }
  49.4% { left: calc(50% + var(--store-select-dust-deep-x)); top: calc(50% + var(--store-select-dust-deep-y)); opacity: .24; transform: translate(-50%, -50%) scale(.46); }
  52.4% { left: calc(50% + var(--store-select-dust-deep-x)); top: calc(57% + var(--store-select-dust-deep-y)); opacity: .04; transform: translate(-50%, -50%) scale(.26); }
}

@keyframes store-select-flame-gold-dust-return-ultrafine {
  0%, 39.0%, 59.1%, 100% { left: 50%; top: 50%; opacity: 0; transform: translate(-50%, -50%) scale(.14); }
  39.5% { left: calc(50% + var(--store-select-dust-start-x)); top: calc(50% + var(--store-select-dust-start-y)); opacity: .12; transform: translate(-50%, -50%) scale(.34); }
  41.2% { left: calc(50% + var(--store-select-dust-drift-x)); top: calc(50% + var(--store-select-dust-drift-y)); opacity: .42; transform: translate(-50%, -50%) scale(.62); }
  46.0% { left: calc(50% + var(--store-select-dust-fall-x)); top: calc(50% + var(--store-select-dust-fall-y)); opacity: .30; transform: translate(-50%, -50%) scale(.48); }
  52.2% { left: calc(50% + var(--store-select-dust-deep-x)); top: calc(50% + var(--store-select-dust-deep-y)); opacity: .17; transform: translate(-50%, -50%) scale(.34); }
  58.6% { left: calc(50% + var(--store-select-dust-deep-x)); top: calc(58% + var(--store-select-dust-deep-y)); opacity: .03; transform: translate(-50%, -50%) scale(.20); }
}

@keyframes store-select-flame-gold-dust-return-glint {
  0%, 39.1%, 51.4%, 100% { left: 50%; top: 50%; opacity: 0; transform: translate(-50%, -50%) scale(.28); }
  39.8% { left: calc(50% + var(--store-select-dust-start-x)); top: calc(50% + var(--store-select-dust-start-y)); opacity: .46; transform: translate(-50%, -50%) scale(.70); }
  41.5% { left: calc(50% + var(--store-select-dust-drift-x)); top: calc(50% + var(--store-select-dust-drift-y)); opacity: .98; transform: translate(-50%, -50%) scale(1.16); }
  44.9% { left: calc(50% + var(--store-select-dust-fall-x)); top: calc(50% + var(--store-select-dust-fall-y)); opacity: .72; transform: translate(-50%, -50%) scale(.94); }
  49.2% { left: calc(50% + var(--store-select-dust-deep-x)); top: calc(50% + var(--store-select-dust-deep-y)); opacity: .38; transform: translate(-50%, -50%) scale(.62); }
  50.9% { left: calc(50% + var(--store-select-dust-deep-x)); top: calc(55% + var(--store-select-dust-deep-y)); opacity: .06; transform: translate(-50%, -50%) scale(.40); }
}

@keyframes store-select-flame-gold-dust-twinkle {
  0%, 100% { filter: brightness(.72) saturate(.92); }
  45% { filter: brightness(1.75) saturate(1.20); }
}

        @keyframes store-select-real-flame-resting {
          0%, 100% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.12) saturate(1.16); opacity: .95; transform: translate3d(-2.2%, 0, 0) rotate(6.2deg) scale(1.25, .78); }
          30% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.21) saturate(1.25); opacity: .99; transform: translate3d(-2.2%, 0, 0) rotate(1.2deg) scale(1.36, .96); }
          58% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.17) saturate(1.21); opacity: .96; transform: translate3d(-2.2%, 0, 0) rotate(-1.6deg) scale(1.4, .89); }
          78% { filter: hue-rotate(var(--store-select-flame-hue)) brightness(1.19) saturate(1.23); opacity: .97; transform: translate3d(-2.2%, 0, 0) rotate(2.2deg) scale(1.35, .85); }
        }

        @keyframes store-select-rainbow-hue {
          0% { --store-select-flame-hue: 0deg; }
          20% { --store-select-flame-hue: 292deg; }
          40% { --store-select-flame-hue: 180deg; }
          60% { --store-select-flame-hue: 120deg; }
          80% { --store-select-flame-hue: 230deg; }
          100% { --store-select-flame-hue: 360deg; }
        }

        @keyframes store-select-wick-spark-rainbow-hue {
          0% { --store-select-wick-spark-hue: 200deg; }
          20% { --store-select-wick-spark-hue: 135deg; }
          40% { --store-select-wick-spark-hue: 40deg; }
          60% { --store-select-wick-spark-hue: -10deg; }
          80% { --store-select-wick-spark-hue: 70deg; }
          100% { --store-select-wick-spark-hue: 200deg; }
        }

        @keyframes store-select-warmth-cast {
          0%, 100% { opacity: .28; transform: translate3d(0, 0, 0) scale(.94); filter: hue-rotate(var(--store-select-flame-hue)) blur(2.08rem); }
          23% { opacity: .56; transform: translate3d(1.2%, .4%, 0) scale(1.04); filter: hue-rotate(var(--store-select-flame-hue)) blur(1.64rem); }
          52% { opacity: .40; transform: translate3d(-.8%, -.3%, 0) scale(1); filter: hue-rotate(var(--store-select-flame-hue)) blur(2.22rem); }
          78% { opacity: .52; transform: translate3d(.8%, .2%, 0) scale(1.02); filter: hue-rotate(var(--store-select-flame-hue)) blur(1.78rem); }
        }

        @keyframes store-select-warm-text-warmth-sync {
          0%, 100% { --store-select-text-cast-strength: .32; --store-select-text-cast-reach: 44%; }
          23% { --store-select-text-cast-strength: .56; --store-select-text-cast-reach: 60%; }
          52% { --store-select-text-cast-strength: .40; --store-select-text-cast-reach: 51%; }
          78% { --store-select-text-cast-strength: .52; --store-select-text-cast-reach: 57%; }
        }

        @keyframes store-select-text-rainbow {
          0% { --store-select-text-core: rgba(255, 226, 159, .56); --store-select-text-glow: rgba(255, 156, 52, .34); }
          20% { --store-select-text-core: rgba(255, 184, 225, .60); --store-select-text-glow: rgba(255, 92, 190, .40); }
          40% { --store-select-text-core: rgba(185, 225, 255, .58); --store-select-text-glow: rgba(74, 166, 255, .38); }
          60% { --store-select-text-core: rgba(181, 255, 239, .58); --store-select-text-glow: rgba(40, 226, 190, .38); }
          80% { --store-select-text-core: rgba(218, 193, 255, .60); --store-select-text-glow: rgba(142, 83, 255, .40); }
          100% { --store-select-text-core: rgba(255, 226, 159, .56); --store-select-text-glow: rgba(255, 156, 52, .34); }
        }

        @media (prefers-reduced-motion: reduce) {
          .store-select-logo,
          .store-select-logo-glitch,
          .store-select-real-flame,
          .store-select-circular-flame-halo,
          .store-select-flame-side-halo,
	          .store-select-flame-smoke,
	          .store-select-flame-wick-light,
	          .store-select-wick-sparks,
	          .store-select-uploaded-wick-spark-gif,
	          .store-select-uploaded-top-smoke-video,
	          .store-select-uploaded-coin-embers-gif,
	          .store-select-flame-butterfly,
	          .store-select-flame-gold-dust,
          .store-select-warmth,
          .store-select-warm-text {
            animation: none;
          }

          .store-select-logo {
            opacity: 1;
            transform: none;
          }

          .store-select-real-flame {
            opacity: 1;
            transform: none;
          }


          /* iPad users with the iOS "Reduce Motion" preference still need
             a static, directly-coloured flame halo and body glow. Hiding
             these layers made the colour action appear non-functional. */
          .store-select-circular-flame-halo {
            display: block;
            opacity: .72 !important;
            transform: translate3d(0, 0, 0) scale(1.04) !important;
          }

          .store-select-flame-side-halo {
            display: block;
            opacity: .52 !important;
            transform: translate3d(0, 0, 0) scale(.90) !important;
          }

          .store-select-flame-wick-light {
            display: block;
            opacity: .70 !important;
            transform: translate3d(0, 0, 0) scale(.82) !important;
          }

          .store-select-flame-butterfly {
            display: block;
            opacity: 1 !important;
            transform: translate3d(0, 0, 0) scale(1) rotate(-12deg) rotateY(14deg) !important;
          }

	          .store-select-flame-smoke,
	          .store-select-wick-sparks,
		          .store-select-flame-gold-dust,
		          .store-select-uploaded-wick-spark-gif,
			          .store-select-uploaded-top-smoke-video,
			          .store-select-uploaded-match-head-light-video,
				          .store-select-uploaded-new-flame-extinguish-video,
			          .store-select-uploaded-right-smoke-gif,
			          .store-select-uploaded-water-gif,
			          .store-select-uploaded-butterfly-gold-dust-gif,
			          .store-select-uploaded-coin-embers-gif {
		            display: none;
		          }

		          .store-select-birthday-countdown,
		          .store-select-birthday-message {
		            display: none;
		          }

          .store-select-warmth {
            opacity: .78;
            transform: none;
          }

          .store-select-warm-text {
            animation: none;
          }
        }
      `}</style>
      <svg
        aria-hidden="true"
        width="0"
        height="0"
        focusable="false"
        style={{ position: "absolute", overflow: "hidden" }}
              >
        <defs>
          <filter

            id="store-select-butterfly-luminance-key"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .2126 .7152 .0722 0 -.17"
              result="luminanceAlpha"
            />
            <feComposite in="SourceGraphic" in2="luminanceAlpha" operator="in" />
          </filter>
          <filter
            id="store-select-top-smoke-luminance-key"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .2126 .7152 .0722 0 -.17"
              result="topSmokeLuminance"
            />
            <feComponentTransfer in="topSmokeLuminance" result="topSmokeAlpha">
              <feFuncA type="linear" slope="3.8" intercept="-.70" />
            </feComponentTransfer>
		    <feComposite in="SourceGraphic" in2="topSmokeAlpha" operator="in" />
		  </filter>
			  <filter
			    id="store-select-match-head-light-luminance-key"
			    x="-20%"
			    y="-20%"
			    width="140%"
			    height="140%"
			    colorInterpolationFilters="sRGB"
			  >
			    <feColorMatrix
			      in="SourceGraphic"
			      type="matrix"
			      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .2126 .7152 .0722 0 -.17"
			      result="matchHeadLightLuminance"
			    />
			    <feComponentTransfer in="matchHeadLightLuminance" result="matchHeadLightAlpha">
			      <feFuncA type="linear" slope="1.7" intercept="-.06" />
			    </feComponentTransfer>
			    <feComposite in="SourceGraphic" in2="matchHeadLightAlpha" operator="in" />
			  </filter>
			  <filter
			    id="store-select-overlay-luminance-key"
			    x="-12%"
			    y="-12%"
			    width="124%"
			    height="124%"
			    colorInterpolationFilters="sRGB"
			  >
			    <feColorMatrix
			      in="SourceGraphic"
			      type="matrix"
			      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .2126 .7152 .0722 0 -.17"
			      result="overlayLuminance"
			    />
			    <feComponentTransfer in="overlayLuminance" result="overlayAlpha">
			      <feFuncA type="linear" slope="1.7" intercept="-.06" />
			    </feComponentTransfer>
			    <feComposite in="SourceGraphic" in2="overlayAlpha" operator="in" />
			  </filter>
			  <filter
			    id="store-select-fireworks-luminance-key"
			    x="-12%"
			    y="-12%"
			    width="124%"
			    height="124%"
			    colorInterpolationFilters="sRGB"
			  >
			    <feColorMatrix
			      in="SourceGraphic"
			      type="matrix"
			      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .2126 .7152 .0722 0 -.17"
			      result="fireworksLuminance"
			    />
			    <feComponentTransfer in="fireworksLuminance" result="fireworksAlpha">
			      <feFuncA type="linear" slope="2.1" intercept="-.13" />
			    </feComponentTransfer>
			    <feComposite in="SourceGraphic" in2="fireworksAlpha" operator="in" />
			  </filter>
			</defs>
      </svg>
      <main
        className="w-full"
        data-store-select-reduced-motion={prefersReducedMotion ? "true" : "false"}
      >
        <div
          className="bistro-portrait-shell bg-black"
        >
          <img
            src={STORE_SELECT_BACKGROUND}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full select-none object-fill"
          />

				<div
					className="store-select-logo-stage absolute inset-0 z-[5]"
          >
            {flameEffectEnabled && (
              <div
                className="store-select-composite-logo-frame"
                data-composite-logo-renderer="uploaded-original-video-native-screen-output"
                data-composite-logo-source={STORE_SELECT_COMPOSITE_LOGO_VIDEO}
                data-composite-logo-frame-count="472"
                data-composite-logo-frame-rate="30"
                data-composite-logo-duration-ms="15733.333"
                data-composite-logo-sha256="e546bdfa77e57ef188b2ab6f174be7d572e8790be6b12368b02af98cac3ccfd4"
                data-composite-logo-matte="screen-blend-black-background"
              >
                <video
                  ref={compositeLogoVideoRef}
                  className="store-select-composite-logo-video"
                  style={compositeLogoStyle}
                  src={STORE_SELECT_COMPOSITE_LOGO_VIDEO}
                  poster={STORE_SELECT_COMPOSITE_LOGO_POSTER}
                  controls={false}
                  disablePictureInPicture
                  data-composite-logo-playback="native-original-speed-loop"
                  data-composite-logo-color-mode="original-video-no-colour-mask"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  role="button"
                  tabIndex={0}
                  aria-label="切換火焰顏色"
                  title="點選切換火焰顏色；連續點選兩次切換生日文字狀態"
                  onPointerDown={handleFlamePointerDown}
                  onPointerUp={handleFlamePointerUp}
                  onPointerCancel={handleFlamePointerCancel}
                  onPointerLeave={cancelFlameLongPress}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      handleFlameColorCycle();
                    }
                  }}
                />
              </div>
            )}
          </div>


          <div className="absolute left-[45.4%] top-[33.9%] z-10 w-[60%] text-left">
            <h1
              data-warm-title="一起玩・一起瘋・一起賺錢"
              className={`${flameEffectEnabled ? `store-select-warm-text ${flameColorClass} ` : ""}text-[3.25cqw] font-bold leading-tight tracking-wide text-white`}
            >
              一起玩・一起瘋・一起賺錢
            </h1>
            <div className="mt-2 space-y-0.5 text-[5.45cqw] font-bold leading-tight">
              {visibleBranches.map((branch: any, index: number) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleSelect(branch)}
                  data-visual-editor-dynamic={`branch-${branch.id}`}
                  className={`block w-full border-0 p-0 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 ${index === 0 ? "text-fuchsia-300 hover:text-fuchsia-100" : "text-white hover:text-slate-300"}`}
                >
                  {branch.city}
                  {branch.district}
                </button>
              ))}
              {branchesLoading && (
                <p className="p-0 text-[4.2cqw] font-semibold text-white/70">
                  載入門店中…
                </p>
              )}
              {!branchesLoading && visibleBranches.length === 0 && (
                <p className="p-0 text-[4.2cqw] font-semibold text-white/70">
                  暫無可選門店
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label="返回首頁"
            onClick={() => navigate("/")}
            className="absolute left-[34%] top-[86.4%] z-10 w-[32%] translate-y-[1.5rem] text-center text-[4.3cqw] font-bold text-white transition-colors hover:text-fuchsia-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
          >
            返回首頁
          </button>

          {storeSelectSocialIconsVisible && (
            <nav
              aria-label="官方社群"
              className="absolute bottom-[3.6%] left-1/2 z-10 flex -translate-x-1/2 translate-y-[1.5rem] items-center gap-[2.1cqw]"
            >
              {STORE_SELECT_SOCIAL_LINKS.map(social => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.name}
                  className="flex h-[10cqw] w-[10cqw] items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                >
                  <img
                    src={social.icon}
                    alt={social.name}
                    className="h-full w-full object-contain"
                  />
                </a>
              ))}
            </nav>
          )}
        </div>
      </main>
    </div>
  );
}
