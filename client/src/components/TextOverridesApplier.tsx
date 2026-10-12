import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { applyAllOverrides, PATH_TO_PAGE_ID, type TextOverride } from "@/lib/textOverrides";
import { getVisualEditorRenderBranchId } from "@/lib/branch";
import {
  isVisualEditorRevisionFor,
  VISUAL_EDITOR_REVISION_KEY,
  VISUAL_EDITOR_TEXT_OVERRIDES_READY_EVENT,
} from "@/lib/visualEditorRevision";

/**
 * 第14批次-5: 前台全域套用「頁面文字覆寫」
 * 視覺編輯器儲存的文字修改（修改/放大/縮小/刪除）在每頁載入時自動套用。
 * 在編輯器 iframe 內（?veditor=1）不自動套用，由編輯器主動控制。
 */
export default function TextOverridesApplier() {
  const [location] = useLocation();
  const pageId = PATH_TO_PAGE_ID[location.split("?")[0]] || null;
  const branchId = getVisualEditorRenderBranchId();
  const isEditorFrame = typeof window !== "undefined" && window.location.search.includes("veditor=1");
  const { data: overrides = [] } = trpc.visualEditor.listTextOverrides.useQuery(
    { pageId: pageId || undefined, branchId },
    { enabled: !!pageId && !isEditorFrame, staleTime: 0, refetchOnMount: "always" }
  );
  const trpcUtils = trpc.useUtils();
  const rafRef = useRef<number | null>(null);
  const [applyRevision, setApplyRevision] = useState(0);

  // Native text is saved inside the editor iframe.  The regular /admin page
  // remains mounted beneath that fullscreen iframe, so refresh its query when
  // the successful save signal arrives instead of waiting for a browser reload.
  useEffect(() => {
    if (!pageId || isEditorFrame) return;
    const refresh = (event: StorageEvent) => {
      if (event.key !== VISUAL_EDITOR_REVISION_KEY) return;
      if (isVisualEditorRevisionFor(event.newValue, pageId, branchId)) {
        void trpcUtils.visualEditor.listTextOverrides.invalidate({ pageId, branchId });
        setApplyRevision((current) => current + 1);
      }
    };
    const reapplyAfterPageMount = () => setApplyRevision((current) => current + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener(VISUAL_EDITOR_TEXT_OVERRIDES_READY_EVENT, reapplyAfterPageMount);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(VISUAL_EDITOR_TEXT_OVERRIDES_READY_EVENT, reapplyAfterPageMount);
    };
  }, [branchId, isEditorFrame, pageId, trpcUtils]);

  useEffect(() => {
    if (!pageId || isEditorFrame || overrides.length === 0) return;
    let tries = 0;
    const apply = () => {
      applyAllOverrides(document, overrides as TextOverride[]);
      tries += 1;
      // 頁面內容可能非同步渲染，重試數次確保套用
      if (tries < 10) rafRef.current = window.setTimeout(apply, 300) as unknown as number;
    };
    apply();
    return () => { if (rafRef.current) clearTimeout(rafRef.current); };
  }, [applyRevision, pageId, overrides, isEditorFrame]);

  return null;
}
