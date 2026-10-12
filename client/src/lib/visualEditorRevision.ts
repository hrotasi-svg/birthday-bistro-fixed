export const VISUAL_EDITOR_REVISION_KEY = "birthday-bistro-editor-revision";
export const VISUAL_EDITOR_TEXT_OVERRIDES_READY_EVENT = "birthday-bistro-text-overrides-ready";
export const VISUAL_EDITOR_CHANNEL_NAME = "birthday-bistro-editor-revision-channel";

export type VisualEditorRevision = {
  pageId: string;
  branchId: number;
  at: number;
};

export function isVisualEditorRevisionFor(rawValue: string | null, pageId: string, branchId: number): boolean {
  if (!rawValue) return false;
  try {
    const revision = JSON.parse(rawValue) as Partial<VisualEditorRevision>;
    return revision.pageId === pageId && Number(revision.branchId) === branchId;
  } catch {
    return false;
  }
}

/** Publishes only after a successful visual-editor database mutation. */
export function publishVisualEditorRevision(
  pageId: string,
  branchId: number,
  payload: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  const revision = { pageId, branchId, at: Date.now(), ...payload };
  window.localStorage.setItem(
    VISUAL_EDITOR_REVISION_KEY,
    JSON.stringify(revision satisfies VisualEditorRevision),
  );
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(VISUAL_EDITOR_CHANNEL_NAME);
    channel.postMessage(revision);
    channel.close();
  }
}

/** Signals that a page with native editable text has mounted after editor mode closes. */
export function requestVisualEditorTextOverrideApply(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(VISUAL_EDITOR_TEXT_OVERRIDES_READY_EVENT));
}
