import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { PATH_TO_PAGE_ID } from "@/lib/textOverrides";
import { getVisualEditorRenderBranchId } from "@/lib/branch";

/**
 * 第16批次-2: 前台全域套用「頁面背景圖片」
 * 視覺編輯器「變更背景圖片」儲存於 systemSettings.pageBackgrounds（JSON: {pageId: url}）。
 * 各頁面載入時自動套用為 body 背景，僅變更背景、不影響版面/按鈕/動畫/功能。
 */
export default function PageBackgroundApplier() {
  const [location] = useLocation();
  const pageId = PATH_TO_PAGE_ID[location.split("?")[0]] || null;
  const branchId = getVisualEditorRenderBranchId();
  const utils = trpc.useUtils();
  const [editorBackground, setEditorBackground] = useState<{ pageId: string; branchId: number; url: string } | null>(null);
  const queryBackground = useMemo(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("veditor") !== "1" || query.get("veditorBackgroundPageId") !== pageId) return null;
    return query.get("veditorBackgroundUrl");
  }, [location, pageId]);
  const { data: settings } = trpc.system.settings.get.useQuery({ branchId }, { staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: true });

  // 視覺編輯器保存成功後先立即套用已回讀確認的 URL，再失效設定快取；iframe
  // 重新建立或頁面重新載入時仍以資料庫 pageBackgrounds 為唯一持久化來源。
  useEffect(() => {
    const receiveSavedBackground = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "birthday-bistro-background-saved") return;
      const saved = event.data as { pageId?: string; branchId?: number; url?: string };
      if (!saved.pageId || !saved.url || saved.branchId !== branchId) return;
      setEditorBackground({ pageId: saved.pageId, branchId, url: saved.url });
      void utils.system.settings.invalidate();
    };
    window.addEventListener("message", receiveSavedBackground);
    return () => window.removeEventListener("message", receiveSavedBackground);
  }, [branchId, utils.system.settings]);

  useEffect(() => {
    let bgMap: Record<string, string> = {};
    try { bgMap = JSON.parse((settings as any)?.pageBackgrounds || "{}"); } catch { bgMap = {}; }
    const memoryUrl = editorBackground?.branchId === branchId && editorBackground.pageId === pageId ? editorBackground.url : undefined;
    const url = queryBackground || memoryUrl || (pageId ? bgMap[pageId] : undefined);
    // Toaster is also a direct child of #root, but it is an overlay with its own
    // height. Applying the page background to it creates a second image near the
    // top on landscape screens. Only the routed page roots are presentation hosts.
    const pageRoots = Array.from(document.querySelectorAll("#root > *:not([aria-label='Notifications alt+T'])")) as HTMLElement[];
    const targets = [document.body, ...pageRoots];
    const landscapeMedia = window.matchMedia("(orientation: landscape) and (min-width: 700px)");
    let backgroundImage: HTMLImageElement | null = null;
    const applyBackgroundSizing = (naturalWidth: number, naturalHeight: number) => {
      const useScrollableLandscape = landscapeMedia.matches && naturalWidth > 0 && naturalHeight > 0;
      for (const target of targets) {
        target.style.backgroundImage = `url(${url})`;
        target.style.backgroundPosition = useScrollableLandscape ? "top center" : "center";
        target.style.backgroundSize = useScrollableLandscape ? "100% auto" : "cover";
        target.style.backgroundAttachment = useScrollableLandscape ? "scroll" : "fixed";
        target.style.backgroundRepeat = "no-repeat";
        target.style.minHeight = useScrollableLandscape && target !== document.body
          ? `${Math.ceil(((target.clientWidth || window.innerWidth) * naturalHeight) / naturalWidth)}px`
          : "";
      }
    };
    const onViewportChange = () => {
      if (backgroundImage?.naturalWidth && backgroundImage.naturalHeight) {
        applyBackgroundSizing(backgroundImage.naturalWidth, backgroundImage.naturalHeight);
      }
    };
    if (url) {
      backgroundImage = new Image();
      backgroundImage.onload = () => applyBackgroundSizing(backgroundImage!.naturalWidth, backgroundImage!.naturalHeight);
      backgroundImage.src = url;
      if (backgroundImage.complete && backgroundImage.naturalWidth) onViewportChange();
      window.addEventListener("resize", onViewportChange);
      window.addEventListener("orientationchange", onViewportChange);
    } else {
      for (const target of targets) {
        target.style.backgroundImage = "";
        target.style.backgroundSize = "";
        target.style.backgroundPosition = "";
        target.style.backgroundAttachment = "";
        target.style.backgroundRepeat = "";
        target.style.minHeight = "";
      }
    }
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("orientationchange", onViewportChange);
      if (backgroundImage) backgroundImage.onload = null;
      for (const target of targets) {
        target.style.backgroundImage = "";
        target.style.backgroundSize = "";
        target.style.backgroundPosition = "";
        target.style.backgroundAttachment = "";
        target.style.backgroundRepeat = "";
        target.style.minHeight = "";
      }
    };
  }, [branchId, editorBackground, pageId, queryBackground, settings]);

  return null;
}
