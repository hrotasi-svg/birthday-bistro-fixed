import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

const storeSource = source("client/src/pages/StoreSelectPage.tsx");
const mainSource = source("client/src/pages/MainFunctionPage.tsx");
const globalCss = source("client/src/index.css");
const homeSource = source("client/src/pages/Home.tsx");
const backgroundSource = source("client/src/components/PageBackgroundApplier.tsx");

const latestLogoPath =
  "/manus-storage/lv_0_20260905022220_acf9827f.mp4";
const legacyLayerIdentifiers = [
  "STORE_SELECT_UPLOADED_BUTTERFLY_GIF",
  "STORE_SELECT_UPLOADED_WICK_SPARK_GIF",
  "STORE_SELECT_UPLOADED_COIN_EMBERS_GIF",
  "STORE_SELECT_UPLOADED_TOP_SMOKE_VIDEO",
  "STORE_SELECT_UPLOADED_MATCH_HEAD_LIGHT_VIDEO",
  "STORE_SELECT_UPLOADED_NEW_FLAME_EXTINGUISH_VIDEO",
  "STORE_SELECT_UPLOADED_FIREWORKS_VIDEO",
  "STORE_SELECT_UPLOADED_WATER_GIF",
  "STORE_SELECT_UPLOADED_GOLD_DUST_GIF",
  "STORE_SELECT_UPLOADED_RIGHT_SMOKE_GIF",
  "StoreSelectRealFlameCanvas",
  "StoreSelectCoinSprayVideo",
  "STORE_SELECT_LOGO",
];

describe("StoreSelect single composite Logo regression", () => {
  it("uses the latest uploaded high-quality video without changing its playback baseline", () => {
    expect(storeSource).toContain(latestLogoPath);
    expect(storeSource).toContain('data-composite-logo-frame-count="472"');
    expect(storeSource).toContain('data-composite-logo-frame-rate="30"');
    expect(storeSource).toContain('data-composite-logo-duration-ms="15733.333"');
    expect(storeSource).toContain(
      'data-composite-logo-sha256="e546bdfa77e57ef188b2ab6f174be7d572e8790be6b12368b02af98cac3ccfd4"'
    );
    expect(storeSource).toContain('data-composite-logo-playback="native-original-speed-loop"');
    expect(storeSource).toContain('data-composite-logo-matte="screen-blend-black-background"');
    expect(storeSource).toContain("controls={false}");
    expect(storeSource).toContain("top: 15.5%;");
    expect(storeSource).toContain("video.playbackRate = 1;");
    expect(storeSource).toContain('data-composite-logo-color-mode="original-video-no-colour-mask"');
    expect(storeSource).not.toContain("STORE_SELECT_COMPOSITE_COLOUR_MASK");
    expect(storeSource).not.toContain("store-select-composite-colour-mask-v2_1748d111.svg");
    expect(storeSource).toContain("STORE_SELECT_COMPOSITE_LOGO_POSTER");
    expect(storeSource).toContain("autoPlay");
    expect(storeSource).toContain("loop");
    expect(storeSource).toContain("muted");
    expect(storeSource).toContain("playsInline");
  });

  it("renders exactly one composite media node and no former layer sources", () => {
    expect(storeSource).toContain('data-composite-logo-renderer="uploaded-original-video-native-screen-output"');
    expect(storeSource).toContain("STORE_SELECT_COMPOSITE_LOGO_VIDEO");
    expect(storeSource).not.toContain("<img src={STORE_SELECT_LOGO}");
    for (const identifier of legacyLayerIdentifiers) {
      expect(storeSource).not.toContain(identifier);
    }
    expect((storeSource.match(/data-composite-logo-renderer=/g) ?? []).length).toBe(1);
    expect((storeSource.match(/<video/g) ?? []).length).toBe(1);
    expect(storeSource).toContain("mix-blend-mode: screen");
  });

  it("keeps the existing flame color cycle and pointer interaction on the single video", () => {
    expect(storeSource).toContain('const FLAME_COLOR_CYCLE = [');
    expect(storeSource).toContain('"orange"');
    expect(storeSource).toContain('"pink"');
    expect(storeSource).toContain('"blue"');
    expect(storeSource).toContain('"cyan"');
    expect(storeSource).toContain('"purple"');
    expect(storeSource).toContain('"rainbow"');
    expect(storeSource).toContain("const handleFlameColorCycle");
    expect(storeSource).toContain("onPointerDown={handleFlamePointerDown}");
    expect(storeSource).toContain("onPointerUp={handleFlamePointerUp}");
    expect(storeSource).toContain("onPointerCancel={handleFlamePointerCancel}");
    expect(storeSource).toContain("const handleFlameColorCycle");
  });
});

describe("Shared responsive design frame regression", () => {
  it("uses the same viewport-aware portrait frame for StoreSelect and MainFunction", () => {
    expect(storeSource).toContain('className="bistro-portrait-shell bg-black"');
    expect(mainSource).toContain('className="bistro-portrait-shell bg-black"');
    expect(mainSource).not.toContain("--bistro-design-ratio");
    expect(globalCss).toContain(".bistro-portrait-shell {");
    expect(globalCss).toContain("width: 100%;");
    expect(globalCss).toContain("min-height: 0;");
    expect(globalCss).toContain("aspect-ratio: 1544 / 3262;");
    expect(globalCss).toContain("overflow: hidden;");
    expect(globalCss).toContain("@media (orientation: landscape) and (min-width: 700px)");
    expect(globalCss).toContain("--bistro-design-ratio");
  });

  it("does not add a desktop-only Mobile breakpoint override for the composite stage", () => {
    expect(storeSource).toContain(".store-select-composite-logo-frame");
    expect(storeSource).toContain("aspect-ratio: 4 / 3");
    expect(storeSource).not.toContain("@media (max-width: 699px)");
    expect(storeSource).not.toContain("store-select-original-gif-cycle-stage");
  });

  it("leaves the regular Home flow intact instead of forcing it into the portrait frame", () => {
    expect(homeSource).toContain('className="py-12 px-6"');
    expect(homeSource).toContain("max-w-4xl mx-auto");
    expect(homeSource).not.toContain("bistro-portrait-shell");
  });

  it("keeps the mobile background baseline but makes landscape backgrounds proportional and scrollable", () => {
    expect(backgroundSource).toContain('backgroundSize = useScrollableLandscape ? "100% auto" : "cover"');
    expect(backgroundSource).toContain('backgroundAttachment = useScrollableLandscape ? "scroll" : "fixed"');
    expect(backgroundSource).toContain('(orientation: landscape) and (min-width: 700px)');
    expect(backgroundSource).toContain('backgroundSize = useScrollableLandscape ? "100% auto" : "cover"');
    expect(backgroundSource).toContain('backgroundAttachment = useScrollableLandscape ? "scroll" : "fixed"');
    expect(backgroundSource).toContain("naturalHeight) / naturalWidth");
    expect(backgroundSource).toContain('target !== document.body');
    expect(backgroundSource).toContain('target.clientWidth || window.innerWidth');
    expect(backgroundSource).toContain('window.addEventListener("orientationchange"');
    expect(backgroundSource).toContain("#root > *:not([aria-label='Notifications alt+T'])");
    expect(globalCss).toContain("width: 100%;");
    expect(globalCss).toContain("height: auto;");
  });

  it("publishes saved editor payloads through the shared revision channel", () => {
    const revisionSource = source("client/src/lib/visualEditorRevision.ts");
    expect(revisionSource).toContain("new BroadcastChannel(VISUAL_EDITOR_CHANNEL_NAME)");
    expect(revisionSource).toContain("channel.postMessage(revision)");
    expect(revisionSource).toContain("payload: Record<string, unknown>");
  });
});
