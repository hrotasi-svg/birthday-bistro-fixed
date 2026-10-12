import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getVisualEditorRenderBranchId } from "@/lib/branch";
import { PATH_TO_PAGE_ID } from "@/lib/textOverrides";

/**
 * 前台視覺編輯器新增元素渲染器。
 * 以與後台 iframe 編輯層相同的頁面視窗座標渲染，避免因頁面內局部容器
 * 造成文字位置、尺寸或頁面覆蓋範圍不同步。
 */
export default function VisualEditorElementsRenderer() {
  const [location] = useLocation();
  const pageId = PATH_TO_PAGE_ID[location.split("?")[0]] || null;
  const branchId = getVisualEditorRenderBranchId();
  // 即時預覽以 SPA 導覽時，URL 可能暫時遺失 veditor=1；不能在編輯 iframe
  // 再掛載前台渲染層，否則會和後台覆蓋層競爭並讓首頁內容短暫消失。
  const isEditorFrame = typeof window !== "undefined" && (
    new URLSearchParams(window.location.search).get("veditor") === "1" || window.self !== window.top
  );
  const { data: editorElements = [] } = trpc.visualEditor.list.useQuery(
    { pageId: pageId || "", branchId },
    { enabled: !!pageId && !isEditorFrame, refetchOnMount: "always", staleTime: 0 }
  );

  const trpcUtils = trpc.useUtils();
  useEffect(() => {
    if (!pageId || isEditorFrame) return;
    const refresh = (event: StorageEvent) => {
      if (event.key !== "birthday-bistro-editor-revision") return;
      try {
        const revision = JSON.parse(event.newValue || "{}");
        if (revision.pageId === pageId && Number(revision.branchId) === branchId) {
          void trpcUtils.visualEditor.list.invalidate({ pageId, branchId });
        }
      } catch { /* Ignore invalid storage written by unrelated code. */ }
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [pageId, branchId, isEditorFrame, trpcUtils]);

  const safeElements = Array.isArray(editorElements)
    ? editorElements.filter((el: any) => el && Number.isFinite(Number(el.x)) && Number.isFinite(Number(el.y)) && Number.isFinite(Number(el.width)) && Number.isFinite(Number(el.height)))
    : [];

  if (!pageId || isEditorFrame || safeElements.length === 0) return null;

  return (
    <div data-visual-editor-public-layer="true" className="absolute inset-x-0 top-0 pointer-events-none" style={{ zIndex: 40 }}>
      {safeElements.map((el: any) => (
        <div
          key={el.id}
          className="absolute"
          style={{
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
            zIndex: el.zIndex || 1,
          }}
        >
          {el.type === "text" ? (
            <div
              className="w-full h-full flex items-center px-2 overflow-visible whitespace-pre-wrap"
              style={{ fontSize: el.fontSize || 16, color: el.color || "#ffffff" }}
            >
              {el.content}
            </div>
          ) : (
            <img src={el.content || ""} alt="" className="w-full h-full object-contain" />
          )}
        </div>
      ))}
    </div>
  );
}
