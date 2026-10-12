/**
 * 第14批次-5: 頁面文字覆寫工具
 * 視覺編輯器可點選頁面內原生文字元素（標題、按鈕文字等）直接編輯，
 * 修改儲存於 page_text_overrides 表，前台頁面載入時自動套用。
 */

export interface TextOverride {
  id: number;
  pageId: string;
  selector: string;
  originalText: string;
  newText?: string | null;
  fontScale: number;
  color?: string | null;
  hidden: boolean;
  offsetX?: number;
  offsetY?: number;
}

/** 判斷元素是否為「可編輯的文字元素」：自身含直接文字節點 */
export function isTextElement(el: Element, allowDynamic = false): boolean {
  // 注意：iframe 內元素屬於不同 realm，不能用父視窗的 instanceof HTMLElement / Node 常數
  if (!el || el.nodeType !== 1 || !("tagName" in el)) return false;
  // 「＋文字／＋圖片」是視覺編輯器資料表的獨立覆蓋層，不可被既有文字覆寫
  // 的 selector 搜尋到，否則舊 override 可能誤套用 hidden/fontScale 到新元素。
  if ((el as HTMLElement).closest?.("[data-visual-editor-public-layer='true']")) return false;
  // Backend-driven labels (for example branch options) stay protected from stale
  // legacy selectors in public pages, but are eligible inside the native editor
  // and when a saved override uses their stable data selector.
  if (!allowDynamic && (el as HTMLElement).closest?.("[data-visual-editor-dynamic]")) return false;
  const tag = el.tagName.toLowerCase();
  if (["script", "style", "input", "textarea", "select", "img", "svg", "iframe", "video", "canvas"].includes(tag)) return false;
  // 自身有非空白的直接文字節點
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 3 && (node.textContent || "").trim().length > 0) return true;
  }
  return false;
}

/** 取得元素的直接文字內容（不含子元素文字） */
export function getDirectText(el: Element): string {
  let text = "";
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 3) text += node.textContent || "";
  }
  return text.trim();
}

/** 為元素產生穩定 CSS 選擇器（tag + nth-of-type 路徑） */
export function buildSelector(el: Element): string {
  const dynamic = (el as HTMLElement).closest?.("[data-visual-editor-dynamic]") as HTMLElement | null;
  const dynamicKey = dynamic?.dataset.visualEditorDynamic;
  if (dynamic && dynamicKey) {
    return `[data-visual-editor-dynamic="${dynamicKey.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`;
  }
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur.tagName.toLowerCase() !== "body" && parts.length < 8) {
    const tag = cur.tagName.toLowerCase();
    const parent: Element | null = cur.parentElement;
    if (!parent) break;
    const sameTag = Array.from(parent.children).filter((c) => c.tagName === cur!.tagName);
    const idx = sameTag.indexOf(cur) + 1;
    parts.unshift(`${tag}:nth-of-type(${idx})`);
    cur = parent;
  }
  return parts.join(" > ");
}

export function isDynamicTextOverrideSelector(selector: string): boolean {
  return selector.startsWith('[data-visual-editor-dynamic="');
}

/** 在 document 中找出 override 對應的元素：優先 selector，備援以原始文字全頁搜尋 */
export function findOverrideTarget(doc: Document, ov: TextOverride): HTMLElement | null {
  const allowDynamic = isDynamicTextOverrideSelector(ov.selector);
  try {
    const el = doc.querySelector(`body ${ov.selector}`) as HTMLElement | null;
    if (el && isTextElement(el, allowDynamic)) {
      const direct = getDirectText(el);
      // selector 命中且文字符合原文或新文字（已套用過）
      if (direct === ov.originalText || direct === (ov.newText || "")) return el;
    }
  } catch { /* 無效 selector 時走備援 */ }
  // 備援：全頁搜尋 originalText
  const walker = doc.createTreeWalker(doc.body, 1 /* NodeFilter.SHOW_ELEMENT（跨 realm 安全） */);
  let node = walker.nextNode();
  while (node) {
    const el = node as HTMLElement;
    if (isTextElement(el, allowDynamic) && getDirectText(el) === ov.originalText) return el;
    node = walker.nextNode();
  }
  return null;
}

/** 將單一 override 套用至元素 */
export function applyOverrideToElement(el: HTMLElement, ov: TextOverride) {
  if (ov.hidden) {
    el.style.display = "none";
    return;
  }
  if (ov.newText != null && ov.newText !== "" && getDirectText(el) !== ov.newText) {
    // 只替換直接文字節點，保留子元素
    let replaced = false;
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === 3 && (node.textContent || "").trim().length > 0) {
        if (!replaced) { node.textContent = ov.newText; replaced = true; }
        else node.textContent = "";
      }
    }
  }
  if (ov.fontScale && ov.fontScale !== 100) {
    const base = parseFloat(el.dataset.ovBaseFontSize || "");
    const view = el.ownerDocument?.defaultView || window;
    const baseSize = !isNaN(base) ? base : parseFloat(view.getComputedStyle(el).fontSize) || 16;
    el.dataset.ovBaseFontSize = String(baseSize);
    el.style.fontSize = `${Math.round(baseSize * ov.fontScale) / 100}px`;
  }
  if (ov.color) {
    el.style.color = ov.color;
    // 若元素使用漸層透明文字效果，覆寫色彩時需還原
    const view = el.ownerDocument?.defaultView || window;
    const cs = view.getComputedStyle(el);
    if (cs.webkitTextFillColor === "rgba(0, 0, 0, 0)" || (el.style as any).webkitTextFillColor === "transparent") {
      (el.style as any).webkitTextFillColor = ov.color;
      el.style.background = "none";
    }
  }
  const offsetX = ov.offsetX ?? 0;
  const offsetY = ov.offsetY ?? 0;
  const baseTransform = el.dataset.ovBaseTransform ?? el.style.transform;
  el.dataset.ovBaseTransform = baseTransform;
  if (offsetX || offsetY) {
    el.style.position = "relative";
    el.style.transform = `${baseTransform ? `${baseTransform} ` : ""}translate(${offsetX}px, ${offsetY}px)`;
  } else {
    el.style.transform = baseTransform;
  }
}

/** 將某頁全部 overrides 套用至 document */
export function applyAllOverrides(doc: Document, overrides: TextOverride[]) {
  for (const ov of overrides) {
    const el = findOverrideTarget(doc, ov);
    if (el) applyOverrideToElement(el, ov);
  }
}

/** 路由 path → 編輯器 pageId 對照 */
export const PATH_TO_PAGE_ID: Record<string, string> = {
  "/": "home",
  "/store-select": "store-select",
  "/main": "main",
  "/booking": "booking",
  "/my-booking": "my-booking",
  "/invite": "invite",
  "/leaderboard": "leaderboard",
  "/menu": "menu",
  "/experience": "experience",
  "/booking-calendar": "booking-calendar",
  "/member": "member",
  "/npc": "npc",
  "/ritual": "ritual",
  "/more": "more",
  "/sop": "sop",
  "/brand": "brand",
  "/privacy": "privacy",
  "/admin": "admin-settings",
};
