import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  isTextElement, getDirectText, buildSelector,
  applyAllOverrides, findOverrideTarget, applyOverrideToElement,
  type TextOverride,
} from "@/lib/textOverrides";
import {
  VISUAL_EDITOR_LONG_PRESS_MS,
  getVisualEditorDragOffset,
  getVisualEditorPinchScale,
  getVisualEditorTouchDistance,
} from "@/lib/visualEditorGestures";
import { publishVisualEditorRevision } from "@/lib/visualEditorRevision";

type SelectedNativeText = {
  selector: string;
  originalText: string;
  currentText: string;
  overrideId: number | null;
  fontScale: number;
  color: string | null;
  offsetX: number;
  offsetY: number;
};

type Snapshot = SelectedNativeText & { target: HTMLElement; override?: TextOverride };
type DragGesture = Snapshot & { kind: "drag"; pointerId: number; startClientX: number; startClientY: number; moved: boolean };
type PinchGesture = Snapshot & { kind: "pinch"; pointerIds: [number, number]; startDistance: number; previewScale: number };

/**
 * Edits existing text in the iframe without creating a second editor.
 * The transparent surface converts pointer coordinates into iframe elements,
 * then uses the same 400ms press, drag and pinch formulas as ＋文字.
 */
export default function VisualEditorNativeLayer({
  iframeRef,
  pageId,
  branchId,
  enabled,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  pageId: string;
  branchId: number;
  enabled: boolean;
}) {
  const utils = trpc.useUtils();
  const { data: overrides = [], refetch: refetchOverrides } = trpc.visualEditor.listTextOverrides.useQuery(
    { pageId, branchId },
    { staleTime: 0, refetchOnMount: "always" },
  );
  const upsertMut = trpc.visualEditor.upsertTextOverride.useMutation();
  const deleteMut = trpc.visualEditor.deleteTextOverride.useMutation();
  const [selected, setSelected] = useState<SelectedNativeText | null>(null);
  const selectedElRef = useRef<HTMLElement | null>(null);
  const overridesRef = useRef<TextOverride[]>([]);
  const enabledRef = useRef(enabled);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureRef = useRef<DragGesture | PinchGesture | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  overridesRef.current = overrides as TextOverride[];
  enabledRef.current = enabled;

  const clearHighlight = useCallback(() => {
    if (selectedElRef.current) {
      selectedElRef.current.style.outline = "";
      selectedElRef.current.style.outlineOffset = "";
      selectedElRef.current = null;
    }
    setSelected(null);
  }, []);

  const snapshotFor = useCallback((doc: Document, target: HTMLElement): Snapshot => {
    const override = overridesRef.current.find((item) => findOverrideTarget(doc, item) === target);
    const directText = getDirectText(target);
    return {
      target,
      override,
      selector: override?.selector || buildSelector(target),
      originalText: override?.originalText || directText,
      currentText: override?.newText ?? directText,
      overrideId: override?.id ?? null,
      fontScale: override?.fontScale ?? 100,
      color: override?.color ?? null,
      offsetX: override?.offsetX ?? 0,
      offsetY: override?.offsetY ?? 0,
    };
  }, []);

  const applyPreview = useCallback((snapshot: Snapshot, patch: Partial<Pick<Snapshot, "currentText" | "fontScale" | "color" | "offsetX" | "offsetY">>) => {
    applyOverrideToElement(snapshot.target, {
      id: snapshot.overrideId ?? 0,
      pageId,
      selector: snapshot.selector,
      originalText: snapshot.originalText,
      newText: patch.currentText ?? snapshot.currentText,
      fontScale: patch.fontScale ?? snapshot.fontScale,
      color: patch.color ?? snapshot.color,
      hidden: false,
      offsetX: patch.offsetX ?? snapshot.offsetX,
      offsetY: patch.offsetY ?? snapshot.offsetY,
    });
  }, [pageId]);

  const persist = useCallback(async (
    snapshot: Snapshot,
    patch: Partial<Pick<Snapshot, "currentText" | "fontScale" | "color" | "offsetX" | "offsetY">> & { hidden?: boolean },
  ) => {
    const payload = {
      id: snapshot.overrideId ?? undefined,
      pageId,
      branchId,
      selector: snapshot.selector,
      originalText: snapshot.originalText,
      newText: patch.currentText ?? snapshot.currentText,
      fontScale: patch.fontScale ?? snapshot.fontScale,
      color: patch.color ?? snapshot.color,
      offsetX: patch.offsetX ?? snapshot.offsetX,
      offsetY: patch.offsetY ?? snapshot.offsetY,
      hidden: patch.hidden ?? false,
    };
    const response = await upsertMut.mutateAsync(payload);
    applyOverrideToElement(snapshot.target, { ...payload, id: response.id ?? snapshot.overrideId ?? 0 });
    setSelected((current) => current?.selector === snapshot.selector ? {
      ...current,
      overrideId: response.id ?? current.overrideId,
      currentText: payload.newText,
      fontScale: payload.fontScale,
      color: payload.color,
      offsetX: payload.offsetX,
      offsetY: payload.offsetY,
    } : current);
    await refetchOverrides();
    await utils.visualEditor.listTextOverrides.invalidate({ pageId, branchId });
    publishVisualEditorRevision(pageId, branchId, {
      kind: "text-override",
      override: { ...payload, id: response.id ?? snapshot.overrideId ?? 0 },
    });
    return response.id ?? snapshot.overrideId ?? null;
  }, [branchId, pageId, refetchOverrides, upsertMut, utils.visualEditor.listTextOverrides]);

  // The editor iframe suppresses its public applier, so replay saved overrides
  // after each iframe load and after delayed page content renders.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const apply = () => {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      let attempt = 0;
      const replay = () => {
        applyAllOverrides(doc, overridesRef.current);
        attempt += 1;
        if (attempt < 10) timer = setTimeout(replay, 300);
      };
      replay();
    };
    const onLoad = () => { clearHighlight(); setTimeout(apply, 120); };
    iframe.addEventListener("load", onLoad);
    apply();
    return () => {
      iframe.removeEventListener("load", onLoad);
      if (timer) clearTimeout(timer);
    };
  }, [clearHighlight, iframeRef, pageId, branchId, overrides]);

  const elementAtPointer = useCallback((clientX: number, clientY: number) => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) return null;
    const rect = iframe.getBoundingClientRect();
    let element = doc.elementFromPoint(clientX - rect.left, clientY - rect.top) as HTMLElement | null;
    for (let depth = 0; element && depth < 5; depth += 1) {
      if (isTextElement(element, true)) return element;
      element = element.parentElement;
    }
    return null;
  }, [iframeRef]);

  const selectAtPointer = useCallback((clientX: number, clientY: number) => {
    const iframeDoc = iframeRef.current?.contentDocument;
    const target = elementAtPointer(clientX, clientY);
    if (!iframeDoc || !target) {
      clearHighlight();
      return null;
    }
    if (selectedElRef.current && selectedElRef.current !== target) {
      selectedElRef.current.style.outline = "";
      selectedElRef.current.style.outlineOffset = "";
    }
    selectedElRef.current = target;
    target.style.outline = "2px solid #f59e0b";
    target.style.outlineOffset = "2px";
    const snapshot = snapshotFor(iframeDoc, target);
    setSelected(snapshot);
    return snapshot;
  }, [clearHighlight, elementAtPointer, iframeRef, snapshotFor]);

  const clearLongPress = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabledRef.current) return;
    const snapshot = selectAtPointer(event.clientX, event.clientY);
    if (!snapshot) return;
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer capture is optional */ }
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 2) {
      clearLongPress();
      const entries = Array.from(pointersRef.current.entries());
      gestureRef.current = {
        ...snapshot,
        kind: "pinch",
        pointerIds: [entries[0][0], entries[1][0]],
        startDistance: getVisualEditorTouchDistance(entries[0][1], entries[1][1]),
        previewScale: snapshot.fontScale,
      };
      return;
    }

    const beginDrag = () => {
      gestureRef.current = {
        ...snapshot,
        kind: "drag",
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        moved: false,
      };
      longPressTimerRef.current = null;
    };
    if (event.pointerType === "touch") {
      longPressTimerRef.current = setTimeout(beginDrag, VISUAL_EDITOR_LONG_PRESS_MS);
    } else {
      beginDrag();
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const activeGesture = gestureRef.current;
    if (!activeGesture || !enabledRef.current) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activeGesture.kind === "pinch") {
      const first = pointersRef.current.get(activeGesture.pointerIds[0]);
      const second = pointersRef.current.get(activeGesture.pointerIds[1]);
      if (!first || !second) return;
      event.preventDefault();
      const fontScale = getVisualEditorPinchScale({
        baseScale: activeGesture.fontScale,
        startDistance: activeGesture.startDistance,
        currentDistance: getVisualEditorTouchDistance(first, second),
      });
      activeGesture.previewScale = fontScale;
      applyPreview(activeGesture, { fontScale });
      return;
    }
    if (activeGesture.pointerId !== event.pointerId) return;
    event.preventDefault();
    const position = getVisualEditorDragOffset({
      startClientX: activeGesture.startClientX,
      startClientY: activeGesture.startClientY,
      clientX: event.clientX,
      clientY: event.clientY,
      baseX: activeGesture.offsetX,
      baseY: activeGesture.offsetY,
    });
    activeGesture.moved ||= Math.abs(position.x - activeGesture.offsetX) > 1 || Math.abs(position.y - activeGesture.offsetY) > 1;
    applyPreview(activeGesture, { offsetX: position.x, offsetY: position.y });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    clearLongPress();
    const activeGesture = gestureRef.current;
    pointersRef.current.delete(event.pointerId);
    if (!activeGesture) return;
    if (activeGesture.kind === "pinch" && activeGesture.pointerIds.includes(event.pointerId) && pointersRef.current.size < 2) {
      gestureRef.current = null;
      persist(activeGesture, { fontScale: activeGesture.previewScale })
        .then(() => toast.success("已即時儲存"))
        .catch(() => toast.error("儲存失敗"));
      return;
    }
    if (activeGesture.kind !== "drag" || activeGesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    if (!activeGesture.moved) return;
    const position = getVisualEditorDragOffset({
      startClientX: activeGesture.startClientX,
      startClientY: activeGesture.startClientY,
      clientX: event.clientX,
      clientY: event.clientY,
      baseX: activeGesture.offsetX,
      baseY: activeGesture.offsetY,
    });
    persist(activeGesture, { offsetX: position.x, offsetY: position.y })
      .then(() => toast.success("已即時儲存"))
      .catch(() => toast.error("儲存失敗"));
  };

  const saveFromToolbar = async (patch: Partial<Pick<SelectedNativeText, "currentText" | "fontScale" | "color" | "offsetX" | "offsetY">> & { hidden?: boolean }) => {
    const target = selectedElRef.current;
    const doc = iframeRef.current?.contentDocument;
    if (!target || !doc) return;
    try {
      await persist(snapshotFor(doc, target), patch);
      toast.success("已即時儲存");
      if (patch.hidden) clearHighlight();
    } catch {
      toast.error("儲存失敗");
    }
  };

  return (
    <>
      {enabled && (
        <div
          className="absolute inset-0 z-0"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      )}
      {enabled && selected && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-slate-900/95 border border-green-500/50 rounded-lg px-2 py-1.5 shadow-lg flex-wrap max-w-[95%]">
          <span className="text-green-400 text-xs font-semibold max-w-[120px] truncate" title={selected.currentText}>「{selected.currentText || "(空白)"}」</span>
          <button onClick={() => {
            const text = prompt("修改文字內容：", selected.currentText || "");
            if (text !== null) saveFromToolbar({ currentText: text });
          }} className="px-2.5 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">修改文字</button>
          <input type="range" min="30" max="300" value={selected.fontScale}
            onChange={(event) => saveFromToolbar({ fontScale: Number(event.target.value) })}
            className="w-24 h-2 accent-purple-500" title="雙指縮放或滑動調整文字大小" />
          <span className="text-gray-400 text-xs">{selected.fontScale}%</span>
          <input type="color" value={selected.color || "#ffffff"}
            onChange={(event) => saveFromToolbar({ color: event.target.value })}
            className="w-7 h-7 cursor-pointer rounded border-0" title="文字顏色" />
          <button onClick={() => { if (confirm("確定刪除（隱藏）此文字元素？")) saveFromToolbar({ hidden: true }); }}
            className="px-2.5 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">刪除</button>
          {selected.overrideId != null && (
            <button onClick={async () => {
              if (!selected.overrideId || !confirm("確定還原此文字元素為原始狀態？")) return;
              try {
                await deleteMut.mutateAsync({ id: selected.overrideId });
                await refetchOverrides();
                await utils.visualEditor.listTextOverrides.invalidate({ pageId, branchId });
                publishVisualEditorRevision(pageId, branchId);
                iframeRef.current?.contentWindow?.location.reload();
                clearHighlight();
                toast.success("已還原");
              } catch { toast.error("還原失敗"); }
            }} className="px-2.5 py-1 bg-slate-600 text-white rounded text-xs hover:bg-slate-500">還原</button>
          )}
          <button onClick={clearHighlight} className="px-2 py-1 bg-slate-700 text-white rounded text-xs hover:bg-slate-600">✕</button>
        </div>
      )}
    </>
  );
}
