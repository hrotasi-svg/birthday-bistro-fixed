/** Shared interaction math for every visual-editor text element. */
export const VISUAL_EDITOR_LONG_PRESS_MS = 400;

export function getVisualEditorDragOffset(input: {
  startClientX: number;
  startClientY: number;
  clientX: number;
  clientY: number;
  baseX: number;
  baseY: number;
}) {
  return {
    x: Math.round(input.baseX + input.clientX - input.startClientX),
    y: Math.round(input.baseY + input.clientY - input.startClientY),
  };
}

export function getVisualEditorTouchDistance(
  first: { clientX?: number; clientY?: number; x?: number; y?: number },
  second: { clientX?: number; clientY?: number; x?: number; y?: number },
) {
  const dx = (first.clientX ?? first.x ?? 0) - (second.clientX ?? second.x ?? 0);
  const dy = (first.clientY ?? first.y ?? 0) - (second.clientY ?? second.y ?? 0);
  return Math.sqrt(dx * dx + dy * dy);
}

export function getVisualEditorPinchScale(input: {
  baseScale: number;
  startDistance: number;
  currentDistance: number;
  min?: number;
  max?: number;
}) {
  const min = input.min ?? 30;
  const max = input.max ?? 300;
  if (!input.startDistance) return input.baseScale;
  return Math.max(min, Math.min(max, Math.round(input.baseScale * input.currentDistance / input.startDistance)));
}
