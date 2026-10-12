import { describe, expect, it } from "vitest";
import {
  VISUAL_EDITOR_LONG_PRESS_MS,
  getVisualEditorDragOffset,
  getVisualEditorPinchScale,
  getVisualEditorTouchDistance,
} from "../client/src/lib/visualEditorGestures";

describe("visual editor shared text gestures", () => {
  it("uses the same long-press timing and drag offset for existing and added text", () => {
    expect(VISUAL_EDITOR_LONG_PRESS_MS).toBe(400);
    expect(getVisualEditorDragOffset({
      startClientX: 120,
      startClientY: 80,
      clientX: 164,
      clientY: 108,
      baseX: 0,
      baseY: 0,
    })).toEqual({ x: 44, y: 28 });
  });

  it("calculates the same persisted pinch scale for both text paths", () => {
    const startDistance = getVisualEditorTouchDistance({ x: 0, y: 0 }, { x: 70, y: 0 });
    const currentDistance = getVisualEditorTouchDistance({ x: 0, y: 0 }, { x: 130, y: 0 });
    expect(getVisualEditorPinchScale({ baseScale: 100, startDistance, currentDistance })).toBe(186);
  });
});
