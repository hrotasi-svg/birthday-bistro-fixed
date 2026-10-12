// ─── 第15批次-2: 分店資料完全獨立化 ───
// 每組【城市+地區+帳號+密碼】= 一個獨立【壽星餐酒館資料分類】（branchId）
// 前台依「目前分店」顯示對應資料；預設 branchId=1（高雄市鳳山區總店）。
// 分店後台登入成功後會將該分店 branchId 寫入 localStorage（frontBranchId），
// 使該裝置的前台各功能（開始預約、精選菜單、每月營業王、輪播圖、NPC…）
// 讀寫該分店專屬資料，達成「屏東墾丁不再讀取高雄鳳山資料」。

const KEY = "frontBranchId";

export function getFrontBranchId(): number {
  try {
    // 即時預覽 iframe 在 SPA 導航後可能失去 URL query；仍以父層已綁定的
    // 編輯分店識別讀取資料，避免切換頁面後誤讀訪客 localStorage 的分店。
    if (window.parent !== window) {
      const frameBranchId = Number((window.frameElement as HTMLIFrameElement | null)?.dataset.editorBranchId);
      if (Number.isFinite(frameBranchId) && frameBranchId > 0) return frameBranchId;
    }
    // The visual-editor iframe is an isolated preview of the admin's current
    // branch. This query parameter is intentionally limited to ?veditor=1
    // and never changes the visitor's saved store selection.
    const query = new URLSearchParams(window.location.search);
    if (query.get("veditor") === "1") {
      const previewBranchId = Number(query.get("veditorBranchId"));
      if (Number.isFinite(previewBranchId) && previewBranchId > 0) return previewBranchId;
    }
    const v = localStorage.getItem(KEY);
    const n = v ? parseInt(v, 10) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
  } catch {
    return 1;
  }
}

/**
 * 視覺編輯器的公開渲染層在一般前台沿用訪客所選分店；但「品牌管理 → 系統設定」
 * 是同一個 /admin 路徑下的後台工作區，必須以當前登入分店讀回剛由編輯器保存的
 * 元素。否則登入分店與瀏覽器上次選擇的門店不同時，會查詢錯誤 branchId 而看似未同步。
 */
export function resolveVisualEditorRenderBranchId(input: {
  pathname: string;
  isEditorFrame: boolean;
  adminLoggedIn: boolean;
  adminBranchId: number | null;
  frontBranchId: number;
}): number {
  const fallback = Number.isFinite(input.frontBranchId) && input.frontBranchId > 0 ? input.frontBranchId : 1;
  if (input.isEditorFrame) return fallback;
  if (input.pathname !== "/admin" || !input.adminLoggedIn) return fallback;
  return Number.isFinite(input.adminBranchId) && (input.adminBranchId ?? 0) > 0
    ? input.adminBranchId!
    : fallback;
}

/** 視覺編輯器專用：在品牌管理系統設定 Tab 以登入分店為準，其餘頁面沿用前台分店。 */
export function getVisualEditorRenderBranchId(): number {
  const frontBranchId = getFrontBranchId();
  try {
    const isEditorFrame = window.parent !== window || new URLSearchParams(window.location.search).get("veditor") === "1";
    const adminLoggedIn = sessionStorage.getItem("adminLoggedIn") === "true";
    const rawAdminBranchId = Number(sessionStorage.getItem("adminBranchId"));
    return resolveVisualEditorRenderBranchId({
      pathname: window.location.pathname,
      isEditorFrame,
      adminLoggedIn,
      adminBranchId: Number.isFinite(rawAdminBranchId) ? rawAdminBranchId : null,
      frontBranchId,
    });
  } catch {
    return frontBranchId;
  }
}

export function isBranchVisible(branch: { visible?: unknown }): boolean {
  return Number(branch.visible ?? 0) === 1;
}

export function setFrontBranchId(id: number) {
  try {
    localStorage.setItem(KEY, String(id));
  } catch {
    /* ignore */
  }
}

/** 後台登入資訊（sessionStorage）優先；否則用前台 localStorage */
export function getAdminBranchId(): number {
  try {
    const v = sessionStorage.getItem("adminBranchId");
    const n = v ? parseInt(v, 10) : NaN;
    if (Number.isFinite(n) && n > 0) return n;
  } catch {
    /* ignore */
  }
  return 1;
}
