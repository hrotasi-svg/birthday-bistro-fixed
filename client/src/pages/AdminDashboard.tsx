import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import PinchZoomViewer from "@/components/PinchZoomViewer";
import MultiImageManager from "@/components/MultiImageManager";
import VisualEditorNativeLayer from "@/components/VisualEditorNativeLayer";
import ExperienceWallAdmin from "@/components/ExperienceWallAdmin";
import { VISUAL_EDITOR_LONG_PRESS_MS, getVisualEditorDragOffset, getVisualEditorPinchScale, getVisualEditorTouchDistance } from "@/lib/visualEditorGestures";
import { PATH_TO_PAGE_ID } from "@/lib/textOverrides";
import { publishVisualEditorRevision, requestVisualEditorTextOverrideApply } from "@/lib/visualEditorRevision";

// 11 fixed positions per PRD
const FIXED_POSITIONS = [
  { key: "boss", label: "老闆／壽星", desc: "統籌全場、接待客人、負責決策與資源分配" },
  { key: "host", label: "主持", desc: "協助現場帶氣氛、協助拍攝" },
  { key: "photo", label: "攝影", desc: "負責拍攝花絮，記錄親友實戰瞬間" },
  { key: "bar", label: "吧檯", desc: "飲品與酒水調製、杯具整理" },
  { key: "cashier", label: "收銀", desc: "操作點餐系統、營業現金保管與結算" },
  { key: "greeter", label: "領檯", desc: "迎賓、介紹菜單與活動亮點" },
  { key: "floor", label: "外場", desc: "餐具擺放、桌面整潔、迎賓引導" },
  { key: "ops", label: "營運助理", desc: "支援協助各個部門營業流程" },
  { key: "exec_chef", label: "行政主廚", desc: "與壽星溝通、管理內場、協助出餐" },
  { key: "chef", label: "主廚", desc: "製作沙拉、烹調主餐、廚具整潔" },
  { key: "sous_chef", label: "副主廚", desc: "準備湯品、甜點、餐具清洗" },
];

const VIDEO_ANGLES = ["中景", "特寫", "廣角", "遠景", "自拍"];
const CASH_PAYMENT_ROLES = [
  { key: "host", label: "主持人" },
  { key: "photo", label: "攝影師" },
  { key: "greeter", label: "領檯" },
  { key: "floor", label: "外場" },
  { key: "cashier", label: "收銀" },
  { key: "bar", label: "吧檯" },
  { key: "exec_chef", label: "行政主廚" },
  { key: "chef", label: "主廚" },
  { key: "sous_chef", label: "副主廚" },
  { key: "ops", label: "營運助理" },
] as const;
const ONLINE_PAYMENT_CHANNELS = [
  { key: "line_pay", label: "LINE Pay", description: "付款說明：請使用 LINE Pay 掃描 QR Code 完成付款" },
  { key: "jkopay", label: "街口支付", description: "付款說明：請使用 街口支付 掃描 QR Code 完成付款" },
  { key: "twqr", label: "TWQR", description: "付款說明：請使用 TWQR掃描 QR Code 完成付款" },
] as const;

export default function AdminDashboard() {
  const [, navigate] = useLocation();

  // Login guard: check sessionStorage for adminLoggedIn flag set by AdminLoginPage
  const [adminLoggedIn, setAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem("adminLoggedIn") === "true";
  });
  useEffect(() => {
    if (!adminLoggedIn) {
      navigate("/admin-login");
    }
  }, [adminLoggedIn, navigate]);

  const [activeTab, setActiveTab] = useState<"bookings" | "menu" | "settings" | "tasks" | "editor" | "members" | "center" | "videos" | "npc" | "banners" | "rituals" | "sop" | "branches" | "cashier" | "experience" | "bookingCal">(() => {
    return new URLSearchParams(window.location.search).get("editorTarget") === "settings" ? "settings" : "bookings";
  });
  useEffect(() => {
    if (activeTab !== "settings") return;
    const timer = window.setTimeout(requestVisualEditorTextOverrideApply, 0);
    return () => window.clearTimeout(timer);
  }, [activeTab]);

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerPreviewFile, setBannerPreviewFile] = useState<File | null>(null);
  const [bannerPreviewScale, setBannerPreviewScale] = useState(1);
  const [bannerPreviewPos, setBannerPreviewPos] = useState({ x: 0, y: 0 });
  // 第14批次-7: 總部儀表板點擊淨利→直接進入該分店收銀台
  useEffect(() => {
    const openTab = sessionStorage.getItem("adminOpenTab");
    if (openTab) {
      sessionStorage.removeItem("adminOpenTab");
      setActiveTab(openTab as any);
    }
  }, []);

  // ── tRPC Queries ──
  // 第13批次-15: 依登入分店（城市＋地區）過濾預約資料
  const [branchScope] = useState(() => ({
    city: sessionStorage.getItem("adminBranchCity") || undefined,
    district: sessionStorage.getItem("adminBranchDistrict") || undefined,
  }));
  // 第14批次-6: 登入分店 ID（收銀台等資料隔離；預設店=1）
  const [loginBranchId] = useState<number>(() => {
    const v = Number(sessionStorage.getItem("adminBranchId"));
    return Number.isFinite(v) && v > 0 ? v : 1;
  });
  const { data: allBookings = [], refetch: refetchBookings } = trpc.admin.listBookings.useQuery({ ...branchScope, branchId: loginBranchId }, { enabled: adminLoggedIn });
  const { data: allEvents = [], refetch: refetchEvents } = trpc.admin.listEvents.useQuery(undefined, { enabled: adminLoggedIn });
  const { data: systemSettings, refetch: refetchSettings } = trpc.system.settings.get.useQuery({ branchId: loginBranchId }, { enabled: adminLoggedIn });
  const { data: allUsers = [], refetch: refetchUsers } = trpc.admin.listUsers.useQuery(undefined, { enabled: adminLoggedIn });
  const { data: taskPositions = [], refetch: refetchPositions } = trpc.task.listPositions.useQuery({ branchId: loginBranchId }, { enabled: adminLoggedIn });
  const { data: menuItems = [], refetch: refetchMenu } = trpc.menu.list.useQuery({ branchId: loginBranchId }, { enabled: adminLoggedIn });
  // 第15批次-1/3: 分店功能顯示/隱藏（總店 branchId=1 永久全功能；分店依總店開關）
  const isHqBranch = loginBranchId === 1;
  const { data: hqSettings, refetch: refetchHqSettings } = trpc.system.settings.get.useQuery({ branchId: 1 }, { enabled: adminLoggedIn });
  const BRANCH_DEFAULT_TABS: Record<string, boolean> = {
    bookings: true, menu: true, settings: true, tasks: true, members: true, center: true, videos: true, bookingCal: true,
    editor: false, npc: false, banners: false, rituals: false, sop: false, cashier: false, experience: false,
  };
  const branchFeatureVisibility: Record<string, boolean> = (() => {
    try {
      const raw = (hqSettings as any)?.branchFeatureVisibility;
      if (raw) return { ...BRANCH_DEFAULT_TABS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return BRANCH_DEFAULT_TABS;
  })();
  const isTabVisibleForBranch = (tabId: string) => {
    if (isHqBranch) return true; // 鳳山總店永久保留全部功能
    return branchFeatureVisibility[tabId] !== false;
  };
  // 分店登入時若當前 tab 被隱藏，自動切回壽星預約資訊
  useEffect(() => {
    if (!adminLoggedIn || isHqBranch) return;
    if (activeTab !== "branches" && !isTabVisibleForBranch(activeTab)) setActiveTab("bookings");
  }, [adminLoggedIn, isHqBranch, activeTab, hqSettings]);

  // ── tRPC Mutations ──
  const approveBookingMut = trpc.admin.approveBooking.useMutation();
  const updateEventStatusMut = trpc.admin.updateEventStatus.useMutation();
  const updateSettingsMut = trpc.system.settings.update.useMutation();
  const setHiddenMut = trpc.booking.setHidden.useMutation();
  const upsertPositionMut = trpc.task.updatePosition.useMutation();
  const upsertMenuMut = trpc.menu.upsert.useMutation();
  const deleteMenuMut = trpc.menu.delete.useMutation();
  const updateMemberMut = trpc.member.update.useMutation();
  const uploadBlackCardImageMut = trpc.member.uploadBlackCardImage.useMutation();
  const upsertRevenueMut = trpc.revenue.upsert.useMutation();
  const uploadMenuImageMut = trpc.admin.uploadMenuImage.useMutation();
  const uploadNpcImageMut = trpc.admin.uploadNpcImage.useMutation();
  const { data: npcItems2 = [], refetch: refetchNpc } = trpc.npc.list.useQuery({ branchId: loginBranchId }, { enabled: adminLoggedIn });
  const upsertNpcMut = trpc.npc.upsert.useMutation();
  const deleteNpcMut = trpc.npc.delete.useMutation();
  // All short videos for centralized video management
  const { data: allShortVideos = [], refetch: refetchAllVideos } = trpc.shortVideo.list.useQuery({ branchId: loginBranchId }, { enabled: adminLoggedIn });
  const deleteVideoMut = trpc.shortVideo.delete.useMutation();
  const [videoSearchQuery, setVideoSearchQuery] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<number>>(new Set());
  const batchDeleteVideoMut = trpc.shortVideo.batchDelete.useMutation();
  const trpcUtils = trpc.useUtils();
  // BUG 6: Banner management
  const { data: bannerList = [], refetch: refetchBanners } = trpc.banner.list.useQuery({ branchId: loginBranchId }, { enabled: adminLoggedIn });
  const addBannerMut = trpc.banner.add.useMutation();
  const deleteBannerMut = trpc.banner.delete.useMutation();
  const updateBannerOrderMut = trpc.banner.updateOrder.useMutation();
  const uploadBannerMut = trpc.banner.upload.useMutation();
  // BUG 7: Visual editor
  const [editorPageId, setEditorPageId] = useState("home");
  const [editorBackgroundRevision, setEditorBackgroundRevision] = useState(0);
  const [editorBackgroundUrl, setEditorBackgroundUrl] = useState<Record<string, string>>({});
  const [editorFrameScroll, setEditorFrameScroll] = useState({ x: 0, y: 0 });
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const [editorPreview, setEditorPreview] = useState(false);
  const [editorSelectedId, setEditorSelectedId] = useState<number | null>(null);
  const [editorDragging, setEditorDragging] = useState<{ id: number; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const [editorResizing, setEditorResizing] = useState<{ id: number; startX: number; startY: number; startW: number; startH: number } | null>(null);
  const [editorTouchState, setEditorTouchState] = useState<{ longPressTimer: ReturnType<typeof setTimeout> | null; isDragging: boolean; startX: number; startY: number; elX: number; elY: number; elId: number | null; pinchStartDist: number; pinchElId: number | null; pinchStartFontSize: number; pinchStartWidth: number; pinchStartHeight: number }>({ longPressTimer: null, isDragging: false, startX: 0, startY: 0, elX: 0, elY: 0, elId: null, pinchStartDist: 0, pinchElId: null, pinchStartFontSize: 16, pinchStartWidth: 0, pinchStartHeight: 0 });
  const { data: editorElements = [], refetch: refetchEditorElements } = trpc.visualEditor.list.useQuery({ pageId: editorPageId, branchId: loginBranchId }, { enabled: adminLoggedIn, refetchOnMount: "always", staleTime: 0 });
  const upsertEditorMut = trpc.visualEditor.upsert.useMutation({
    onSuccess: async (_result, variables) => {
      const branchId = variables.branchId ?? loginBranchId;
      // Public pages in another tab receive this only after the server commit succeeds.
      const savedId = Number(_result.id ?? variables.id ?? 0);
      publishVisualEditorRevision(variables.pageId || editorPageId, branchId, {
        kind: "element",
        element: {
          ...variables,
          id: savedId || variables.id || 0,
          fontSize: variables.fontSize ?? 16,
          color: variables.color ?? "#ffffff",
          zIndex: variables.zIndex ?? 1,
          branchId,
        },
      });
      trpcUtils.visualEditor.list.setData(
        { pageId: variables.pageId, branchId },
        (previous) => {
          const saved = {
            ...variables,
            id: savedId || variables.id || 0,
            fontSize: variables.fontSize ?? 16,
            color: variables.color ?? "#ffffff",
            zIndex: variables.zIndex ?? 1,
            branchId,
          } as any;
          const rows = (previous ?? []) as any[];
          return variables.id ? rows.map((row) => row.id === variables.id ? { ...row, ...saved } : row) : [...rows, saved];
        },
      );
      await trpcUtils.visualEditor.list.invalidate({ pageId: variables.pageId, branchId });
    },
  });
  const deleteEditorMut = trpc.visualEditor.delete.useMutation({
    onSuccess: async () => {
      publishVisualEditorRevision(editorPageId, loginBranchId, { kind: "element-delete", id: editorSelectedId });
      trpcUtils.visualEditor.list.setData(
        { pageId: editorPageId, branchId: loginBranchId },
        (previous) => (previous ?? []).filter((row: any) => row.id !== editorSelectedId),
      );
      await trpcUtils.visualEditor.list.invalidate();
    },
  });
  const uploadEditorImageMut = trpc.visualEditor.uploadImage.useMutation();
  useEffect(() => {
    if (!editorFullscreen) return;
    const syncPreviewRoute = (event: MessageEvent) => {
      if (event.source !== editorIframeRef.current?.contentWindow || event.origin !== window.location.origin) return;
      if (event.data?.type !== "birthday-bistro-editor-route") return;
      const nextPageId = PATH_TO_PAGE_ID[String(event.data.path || "").split("?")[0]];
      if (nextPageId) {
        setEditorPageId(nextPageId);
        setEditorFrameScroll({ x: 0, y: 0 });
        setEditorSelectedId(null);
        // 即時預覽導航至目標頁後，立刻回到該頁的編輯模式，確保「點選到哪、修改到哪」。
        setEditorPreview(false);
      }
    };
    window.addEventListener("message", syncPreviewRoute);
    return () => window.removeEventListener("message", syncPreviewRoute);
  }, [editorFullscreen]);
  // BUG 9: Ritual management
  const { data: ritualImages = [], refetch: refetchRituals } = trpc.ritual.list.useQuery({ branchId: loginBranchId }, { enabled: adminLoggedIn });
  const uploadRitualMut = trpc.ritual.upload.useMutation();
  const deleteRitualMut = trpc.ritual.delete.useMutation();
  // BUG 12-14: Task card images and special task cards
  const { data: taskCardImages = [], refetch: refetchTaskCardImages } = trpc.taskCardImage.list.useQuery({ branchId: loginBranchId }, { enabled: adminLoggedIn });
  const addTaskCardImageMut = trpc.taskCardImage.add.useMutation();
  const uploadTaskCardImageMut = trpc.taskCardImage.upload.useMutation();
  const deleteTaskCardImageMut = trpc.taskCardImage.delete.useMutation();
  const toggleTaskCardImageMut = trpc.taskCardImage.toggleVisible.useMutation();
  const { data: specialTaskCards = [], refetch: refetchSpecialTaskCards } = trpc.specialTaskCard.list.useQuery({ branchId: loginBranchId }, { enabled: adminLoggedIn });
  const addSpecialTaskCardMut = trpc.specialTaskCard.add.useMutation();
  const uploadSpecialTaskCardMut = trpc.specialTaskCard.upload.useMutation();
  const deleteSpecialTaskCardMut = trpc.specialTaskCard.delete.useMutation();
  const toggleSpecialTaskCardMut = trpc.specialTaskCard.toggleVisible.useMutation();
  // 第13批次-13: 我的SOP管理
  const { data: sopImages = [], refetch: refetchSopImages } = trpc.entityImage.list.useQuery({ entityType: "sop", branchId: loginBranchId }, { enabled: adminLoggedIn });
  const uploadEntityImageMut = trpc.entityImage.upload.useMutation();
  const deleteEntityImageMut = trpc.entityImage.delete.useMutation();
  const setEntityImageVisibleMut = trpc.entityImage.setVisible.useMutation();
  const [sopCategory, setSopCategory] = useState<string | null>(null);
  const [sopSub, setSopSub] = useState<string | null>(null);
  // 第13批次-15: 分店管理
  const { data: branchList = [], refetch: refetchBranches } = trpc.branch.list.useQuery(undefined, { enabled: adminLoggedIn });
  // 第14批次-7: 總部儀表板
  const { data: hqSummary } = trpc.branch.hqSummary.useQuery(undefined, { enabled: adminLoggedIn });
  const addBranchMut = trpc.branch.add.useMutation();
  const updateBranchMut = trpc.branch.update.useMutation();
  const deleteBranchMut = trpc.branch.delete.useMutation();
  const toggleBranchVisibleMut = trpc.branch.toggleVisible.useMutation();
  const [branchForm, setBranchForm] = useState({ city: "", district: "", username: "", password: "" });
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  // 第13批次-15: 版本資訊 → 帳密驗證 → 分店管理
  const [showVersionAuth, setShowVersionAuth] = useState(false);
  const [versionAuthAccount, setVersionAuthAccount] = useState("");
  const [versionAuthPassword, setVersionAuthPassword] = useState("");
  // 第13批次-17: 收銀台
  const now = new Date();
  const [cashierYear, setCashierYear] = useState(now.getFullYear());
  const [cashierMonth, setCashierMonth] = useState(now.getMonth() + 1);
  const [cashierDate, setCashierDate] = useState("");
  const [cashierView, setCashierView] = useState<"income" | "expense" | "calendar" | "online" | "cash">("income");
  const [cashierIncomeForm, setCashierIncomeForm] = useState<Record<string, string>>({});
  const [cashierExpenseForm, setCashierExpenseForm] = useState<Record<string, string>>({});
  const [cashierDetailDate, setCashierDetailDate] = useState<string | null>(null);
  const [onlineInfoChannel, setOnlineInfoChannel] = useState<string | null>(null);
  const [cashExpandedBookingId, setCashExpandedBookingId] = useState<number | null>(null);
  const [cashAmounts, setCashAmounts] = useState<Record<string, number>>({});
  const { data: cashierEntries = [], refetch: refetchCashier } = trpc.cashier.listByMonth.useQuery({ year: cashierYear, month: cashierMonth, branchId: loginBranchId }, { enabled: adminLoggedIn });
  const addCashierMut = trpc.cashier.addEntries.useMutation();
  const deleteCashierMut = trpc.cashier.delete.useMutation();
  const { data: paymentChannelSettings = [], refetch: refetchPaymentChannels } = trpc.bookingPayment.channelSettings.useQuery({ branchId: loginBranchId }, { enabled: adminLoggedIn });
  const { data: paymentQrImages = [], refetch: refetchPaymentQrImages } = trpc.entityImage.list.useQuery({ entityType: "payment_qr", branchId: loginBranchId }, { enabled: adminLoggedIn });
  const { data: linePayPaymentRows = [], refetch: refetchLinePayPayments } = trpc.bookingPayment.listByMethod.useQuery({ branchId: loginBranchId, method: "line_pay" }, { enabled: adminLoggedIn });
  const { data: jkPayPaymentRows = [], refetch: refetchJkPayPayments } = trpc.bookingPayment.listByMethod.useQuery({ branchId: loginBranchId, method: "jkopay" }, { enabled: adminLoggedIn });
  const { data: twqrPaymentRows = [], refetch: refetchTwqrPayments } = trpc.bookingPayment.listByMethod.useQuery({ branchId: loginBranchId, method: "twqr" }, { enabled: adminLoggedIn });
  const { data: cashPaymentRows = [], refetch: refetchCashPayments } = trpc.bookingPayment.listByMethod.useQuery({ branchId: loginBranchId, method: "cash" }, { enabled: adminLoggedIn });
  const setPaymentChannelVisibleMut = trpc.bookingPayment.setChannelVisible.useMutation();
  const setBookingPaymentStatusMut = trpc.bookingPayment.setPaymentStatus.useMutation();
  const saveCashAllocationsMut = trpc.bookingPayment.saveCashAllocations.useMutation();
  const clearCashAllocationsMut = trpc.bookingPayment.clearCashAllocations.useMutation();
  const setCashNoticeMut = trpc.bookingPayment.setCashNotice.useMutation();

  // ── Local UI state ──
  const [localSettings, setLocalSettings] = useState<any>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newAccount, setNewAccount] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmFullPaidEventId, setConfirmFullPaidEventId] = useState<number | null>(null);
  const [detailBooking, setDetailBooking] = useState<any>(null);
  const [detailRevenue, setDetailRevenue] = useState<any>({ mealRevenue: "", drinkRevenue: "", totalRevenue: "", cashback: "" });
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // BUG 1 fix: Auto-save revenue with debounce
  const revenueAutoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 第14批次-5: 視覺編輯器 iframe ref（原生文字元素編輯）
  const editorIframeRef = useRef<HTMLIFrameElement | null>(null);

  const [searchedMember, setSearchedMember] = useState<any>(null);
  const [searchedMemberBookings, setSearchedMemberBookings] = useState<any[]>([]);
  const [centerTab, setCenterTab] = useState("count");
  const [memberNumSearch, setMemberNumSearch] = useState("");
  const [memberNumResult, setMemberNumResult] = useState<any>(null);
  const [memberNumEdits, setMemberNumEdits] = useState<any>({});
  const [showMemberExperienceSurvey, setShowMemberExperienceSurvey] = useState(false);
  const [blackCardSearch, setBlackCardSearch] = useState("");
  const [blackCardResult, setBlackCardResult] = useState<any>(null);
  const [promoText, setPromoText] = useState("");
  const [promoVisible, setPromoVisible] = useState(false);
  const { data: memberExperienceSurvey, refetch: refetchMemberExperienceSurvey } = trpc.experienceSurvey.adminGetForMember.useQuery(
    { memberId: memberNumResult?.id ?? 0, branchId: loginBranchId },
    { enabled: adminLoggedIn && centerTab === "number" && !!memberNumResult?.id }
  );
  const { data: experienceSurveyStats } = trpc.experienceSurvey.stats.useQuery(
    { branchId: loginBranchId },
    { enabled: adminLoggedIn && centerTab === "questionnaire" }
  );
  const memberExperienceAttractions = (() => {
    try {
      const parsed = JSON.parse((memberExperienceSurvey as any)?.attractions || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const [taskSubTab, setTaskSubTab] = useState<"dept" | "video" | "special">("dept");
  const [editorColorPickerOpen, setEditorColorPickerOpen] = useState(false);
  const [selectedVideoPosition, setSelectedVideoPosition] = useState("");
  const [selectedVideoBookingId, setSelectedVideoBookingId] = useState<number | null>(null);
  // 11 fixed position names keyed by position key
  const [positionNames, setPositionNames] = useState<Record<string, string>>({});
  // Get eventId from selected booking for short video query
  const selectedVideoEvent = (allEvents as any[]).find((e: any) => e.bookingId === selectedVideoBookingId);
  const selectedVideoEventId = selectedVideoEvent?.id ?? undefined;
  // Short videos query: bound to event + position
  const { data: adminShortVideos = [], refetch: refetchAdminVideos } = trpc.shortVideo.list.useQuery(
    { position: selectedVideoPosition ? (FIXED_POSITIONS.find(p => p.key === selectedVideoPosition)?.label || selectedVideoPosition) : undefined, eventId: selectedVideoEventId },
    { enabled: adminLoggedIn && !!selectedVideoPosition && !!selectedVideoEventId }
  );
  // BUG 4: Query all booking revenues for displaying 當日營業額 in booking cards
  const { data: allRevenues = [] } = trpc.revenue.listAll.useQuery(undefined, { enabled: adminLoggedIn });
  // BUG 2: Delete invite codes mutation
  const deleteInviteCodesMut = trpc.invite.deleteByEvent.useMutation();
  // BUG 5: Monthly king entries
  const { data: monthlyKingEntries = [], refetch: refetchMonthlyKing } = trpc.monthlyKing.list.useQuery({ branchId: loginBranchId }, { enabled: adminLoggedIn });
  const upsertMonthlyKingMut = trpc.monthlyKing.upsert.useMutation();
  const { data: currentMonthBookings = [] } = trpc.monthlyKing.currentMonth.useQuery({ branchId: loginBranchId }, { enabled: adminLoggedIn });
  const [selectedKingMonth, setSelectedKingMonth] = useState<number | null>(null);
  const [kingName, setKingName] = useState("");
  const [kingDate, setKingDate] = useState("");
  const [kingRevenue, setKingRevenue] = useState("");
  const [kingMvp, setKingMvp] = useState("");

  // Video preview modal state
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Sync local settings from DB
  useEffect(() => {
    if (systemSettings && !localSettings) {
      setLocalSettings(systemSettings);
    }
  }, [systemSettings]);

  // Sync position names from DB
  useEffect(() => {
    if (taskPositions && taskPositions.length > 0) {
      const names: Record<string, string> = {};
      (taskPositions as any[]).forEach((p: any) => {
        const fixed = FIXED_POSITIONS.find(f => f.label === p.roleTitle || f.key === p.roleTitle);
        if (fixed) names[fixed.key] = p.displayName || "";
      });
      setPositionNames(names);
    }
  }, [taskPositions]);

  // ── Revenue query for detail modal ──
  const { data: detailRevenueData } = trpc.revenue.get.useQuery(
    { bookingId: detailBooking?.id ?? 0 },
    { enabled: !!detailBooking }
  );
  const [revenueInitialized, setRevenueInitialized] = useState<number | null>(null);
  useEffect(() => {
    // Only load initial values when opening a NEW booking detail (not on refetch/invalidate)
    if (detailBooking && revenueInitialized !== detailBooking.id) {
      if (detailRevenueData) {
        setDetailRevenue({
          mealRevenue: (detailRevenueData as any).mealRevenue || "",
          drinkRevenue: (detailRevenueData as any).drinkRevenue || "",
          totalRevenue: (detailRevenueData as any).totalRevenue || "",
          cashback: (detailRevenueData as any).cashback || "",
        });
        setRevenueInitialized(detailBooking.id);
      } else {
        // First time opening with no existing revenue data - mark as initialized so we don't overwrite user input later
        setRevenueInitialized(detailBooking.id);
      }
    }
    if (!detailBooking) {
      setRevenueInitialized(null);
      setDetailRevenue({ mealRevenue: "", drinkRevenue: "", totalRevenue: "", cashback: "" });
    }
  }, [detailRevenueData, detailBooking]);

  // ── Handlers ──
  const handleApproveBooking = async (bookingId: number) => {
    try {
      await approveBookingMut.mutateAsync({ id: bookingId, status: "approved" });
      toast.success("預約已審核通過");
      await refetchBookings();
      await refetchEvents();
    } catch { toast.error("審核失敗"); }
  };

  const handleDepositPaid = async (eventId: number) => {
    try {
      await updateEventStatusMut.mutateAsync({ id: eventId, status: "deposit_paid" });
      toast.success("預約金繳費已確認");
      await refetchEvents();
    } catch { toast.error("更新失敗"); }
  };

  const handleFullPaidConfirm = async () => {
    if (confirmFullPaidEventId === null) return;
    try {
      await updateEventStatusMut.mutateAsync({ id: confirmFullPaidEventId, status: "full_paid" });
      toast.success("全額繳費已確認，邀請碼已生成");
      await refetchEvents();
    } catch { toast.error("更新失敗"); }
    setConfirmFullPaidEventId(null);
  };

  const handleEventActive = async (eventId: number) => {
    try {
      await updateEventStatusMut.mutateAsync({ id: eventId, status: "active" });
      toast.success("活動已成立");
      await refetchEvents();
    } catch { toast.error("更新失敗"); }
  };

  const handleSettingChange = (field: string, value: string | boolean | number) => {
    setLocalSettings((prev: any) => {
      const updated = { ...prev, [field]: value };
      // Auto-save: send only the changed field + branchId immediately
      updateSettingsMut.mutateAsync({ branchId: loginBranchId, [field]: value } as any)
        .then(() => refetchSettings());
      return updated;
    });
  };

  const handleSaveSettings = async () => {
    try {
      // BUG 10: Only send fields that have values (not undefined)
      const updates: Record<string, any> = {};
      if (localSettings) {
        for (const [key, value] of Object.entries(localSettings)) {
          if (value !== undefined && value !== null) updates[key] = value;
        }
      }
      updates.branchId = loginBranchId;
      await updateSettingsMut.mutateAsync(updates as any);
      const { data: freshSettings } = await refetchSettings();
      if (freshSettings) setLocalSettings(freshSettings);
      toast.success("系統設定已保存");
    } catch { toast.error("保存失敗"); }
  };

 const handleChangeCredentials = async () => {
   const updates: any = {};
   if (newAccount) updates.adminUsername = newAccount;
   if (newPassword) updates.adminPassword = newPassword;
   if (Object.keys(updates).length > 0) {
     try {
       await updateSettingsMut.mutateAsync(updates);
       await refetchSettings();
        setLocalSettings(null); // Force re-sync from DB to show updated credentials
       toast.success("帳號密碼已變更");
     } catch { toast.error("變更失敗"); }
   }
    setShowChangePassword(false);
    setNewAccount("");
    setNewPassword("");
  };

  const handleToggleHideBooking = async (bookingId: number, currentlyHidden: boolean) => {
    try {
      await setHiddenMut.mutateAsync({ id: bookingId, hidden: !currentlyHidden });
      await refetchBookings();
      toast.success(`預約已${!currentlyHidden ? "隱藏" : "顯示"}`);
    } catch { toast.error("操作失敗"); }
  };
  // BUG 5: 刪除預約
  const deleteBookingMut = trpc.admin.deleteBooking.useMutation();
  const handleDeleteBooking = async (bookingId: number) => {
    if (!confirm("確定要刪除此預約嗎？此操作無法復原。")) return;
    try {
      await deleteBookingMut.mutateAsync({ id: bookingId });
      await refetchBookings();
      toast.success("預約已刪除");
    } catch { toast.error("刪除失敗"); }
  };
  // BUG 8: 費用方案輸入框 state
  const [detailPaymentPlanAmount, setDetailPaymentPlanAmount] = useState("");
  const setPaymentPlanMut = trpc.booking.setPaymentPlan.useMutation();
  const handleSavePaymentPlan = async () => {
    if (!detailBooking) return;
    try {
      const amount = parseFloat(detailPaymentPlanAmount || "0");
      let planKey = "";
      if (amount === 1000) planKey = "deposit";
      else if (amount === 29280) planKey = "student";
      else if (amount === 39280) planKey = "weekday";
      else if (amount === 49280) planKey = "holiday";
      else planKey = amount.toString();
      await setPaymentPlanMut.mutateAsync({ id: detailBooking.id, plan: planKey });
      await refetchBookings();
      toast.success("費用方案已保存");
    } catch { toast.error("保存失敗"); }
  };

  const handleMemberSearch = () => {
    if (!memberSearchQuery.trim()) { toast.error("請輸入搜索關鍵字"); return; }
    // BUG 15: Search by member name/phone/email/memberNumber OR by birthday name (壽星名字)
    const found = (allUsers as any[]).find((u: any) =>
      u.name?.includes(memberSearchQuery) ||
      u.phone?.includes(memberSearchQuery) ||
      u.email?.includes(memberSearchQuery) ||
      String(u.memberNumber || "").includes(memberSearchQuery)
    );
    // Also search bookings by birthdayName (壽星名字)
    const bookingsByBirthdayName = (allBookings as any[]).filter((b: any) =>
      b.birthdayName?.includes(memberSearchQuery)
    );
    if (found) {
      setSearchedMember(found);
      setSearchedMemberBookings((allBookings as any[]).filter((b: any) => b.userId === found.id));
    } else if (bookingsByBirthdayName.length > 0) {
      // BUG 15: If found by birthday name, show the booking info directly
      const booking = bookingsByBirthdayName[0];
      const user = (allUsers as any[]).find((u: any) => u.id === booking.userId);
      setSearchedMember(user || { name: booking.birthdayName, phone: booking.phone, lineId: booking.lineId, id: booking.userId, memberRole: "host" });
      setSearchedMemberBookings(bookingsByBirthdayName);
    } else {
      setSearchedMember(null);
      setSearchedMemberBookings([]);
      toast.error("查無此會員");
    }
  };

  const handleMemberNumSearch = () => {
    const q = memberNumSearch.trim();
    const found = (allUsers as any[]).find((u: any) =>
      String(u.memberNumber || "").includes(q) ||
      (u.name || "").includes(q)
    );
    setMemberNumResult(found || null);
    setShowMemberExperienceSurvey(false);
    if (!found) toast.error("查無此會員");
  };

  const handleBlackCardSearch = () => {
    const q = blackCardSearch.trim();
    const found = (allUsers as any[]).find((u: any) =>
      String(u.id) === q || (u.blackCardNo || "") === q || String(u.memberNumber || "").includes(q)
    );
    setBlackCardResult(found || null);
    if (!found) toast.error("查無此卡號");
  };

  const handleUpdateMember = async (userId: number, data: any) => {
    try {
      await updateMemberMut.mutateAsync({ id: userId, ...data });
      await refetchUsers();
      toast.success("會員資料已更新");
      // Refresh search results
      if (memberNumResult?.id === userId) {
        const updated = (allUsers as any[]).find((u: any) => u.id === userId);
        if (updated) setMemberNumResult({ ...updated, ...data });
      }
      if (blackCardResult?.id === userId) {
        const updated = (allUsers as any[]).find((u: any) => u.id === userId);
        if (updated) setBlackCardResult({ ...updated, ...data });
      }
    } catch { toast.error("更新失敗"); }
  };

  const handleSavePositionName = async (posKey: string, name: string) => {
    const fixed = FIXED_POSITIONS.find(f => f.key === posKey);
    if (!fixed) return;
    try {
      await upsertPositionMut.mutateAsync({ branchId: loginBranchId, roleTitle: fixed.label, displayName: name });
      await refetchPositions();
      toast.success(`${fixed.label} 姓名已保存`);
    } catch { toast.error("保存失敗"); }
  };

  const handleSaveRevenue = async () => {
    if (!detailBooking) return;
    try {
      const meal = parseFloat(detailRevenue.mealRevenue || "0");
      const drink = parseFloat(detailRevenue.drinkRevenue || "0");
      const total = (meal + drink).toString();
      const cashback = ((meal + drink) * 0.5).toString();
      await upsertRevenueMut.mutateAsync({
        bookingId: detailBooking.id,
        mealRevenue: detailRevenue.mealRevenue || "0",
        drinkRevenue: detailRevenue.drinkRevenue || "0",
        totalRevenue: total,
        cashback,
      });
      await trpcUtils.revenue.get.invalidate({ bookingId: detailBooking.id });
      await trpcUtils.revenue.listAll.invalidate();
      await trpcUtils.monthlyKing.currentMonth.invalidate();
      toast.success("營業收入已保存");
    } catch (e: any) { toast.error("保存失敗: " + (e?.message || "")); }
  };

  // BUG 1: Auto-save revenue on input change with debounce
  const handleRevenueFieldChange = (field: string, value: string) => {
    const newRevenue = { ...detailRevenue, [field]: value };
    // Auto-calculate total and cashback ONLY if user is editing meal or drink fields
    let updated = newRevenue;
    if (field === "mealRevenue" || field === "drinkRevenue") {
      const meal = parseFloat(newRevenue.mealRevenue || "0");
      const drink = parseFloat(newRevenue.drinkRevenue || "0");
      const total = (meal + drink).toString();
      const cashback = ((meal + drink) * 0.5).toString();
      updated = { ...newRevenue, totalRevenue: total, cashback };
    }
    setDetailRevenue(updated);
    // Debounced auto-save
    if (!detailBooking) return;
    if (revenueAutoSaveTimer.current) clearTimeout(revenueAutoSaveTimer.current);
    revenueAutoSaveTimer.current = setTimeout(async () => {
      try {
        await upsertRevenueMut.mutateAsync({
          bookingId: detailBooking.id,
          mealRevenue: updated.mealRevenue || "0",
          drinkRevenue: updated.drinkRevenue || "0",
          totalRevenue: updated.totalRevenue || "0",
          cashback: updated.cashback || "0",
        });
        await trpcUtils.revenue.get.invalidate({ bookingId: detailBooking.id });
        await trpcUtils.revenue.listAll.invalidate();
        await trpcUtils.monthlyKing.currentMonth.invalidate();
        toast.success("營業收入已自動儲存");
      } catch (e: any) { toast.error("自動儲存失敗: " + (e?.message || "")); }
    }, 1200);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminLoggedIn");
    navigate("/main");
  };

  // ── Helpers ──
  const getEventForBooking = (bookingId: number) => (allEvents as any[]).find((e: any) => e.bookingId === bookingId);

  const getPlanLabel = (plan: string) => {
    if (plan === "deposit") return `預約金 NT$${localSettings?.depositPrice ?? 1000}`;
    if (plan === "student") return `學生 NT$${localSettings?.studentPrice ?? 29280}`;
    if (plan === "weekday") return `平日 NT$${localSettings?.weekdayPrice ?? 39280}`;
    if (plan === "holiday") return `假日 NT$${localSettings?.holidayPrice ?? 49280}`;
    return plan || "未選擇";
  };
  const getAdminBookingPaymentRows = (bookingId: number) => [
    ...(linePayPaymentRows as any[]),
    ...(jkPayPaymentRows as any[]),
    ...(twqrPaymentRows as any[]),
    ...(cashPaymentRows as any[]),
  ].filter((row: any) => row.payment.bookingId === bookingId);
  const getAdminPaymentMethodLabel = (method: string) => ({ line_pay: "LINE Pay", jkopay: "街口支付", twqr: "TWQR", cash: "門店現金繳納" } as Record<string, string>)[method] || method;
  const getAdminPaymentStatusLabel = (status: string) => ({ unpaid: "未付款", paid: "已付款", refunded: "已退款" } as Record<string, string>)[status] || status;

  const renderContent = () => {
    switch (activeTab) {
      case "bookings":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">壽星預約資訊</h2>
            <p className="text-gray-300 mb-4">顯示所有壽星預約資料（共 {(allBookings as any[]).filter((b: any) => !b.hidden).length} 筆）</p>
            <div className="space-y-3">
              {(allBookings as any[]).filter((b: any) => !b.hidden).map((booking: any) => {
                const event = getEventForBooking(booking.id);
                const linkedPayments = getAdminBookingPaymentRows(booking.id);
                const primaryPayment = linkedPayments.find((row: any) => ["host_online", "host_cash"].includes(row.payment.payerKey))?.payment;
                return (
                  <div key={booking.id} className="bg-slate-800/50 p-4 rounded border border-amber-500/20 text-white text-sm space-y-2">
                    <p className="font-semibold text-base">壽星姓名: {booking.birthdayName || "未提供"}</p>
                    <p className="text-gray-400">預約日期: {booking.eventDate}</p>
                    <p className="text-gray-400">時段: {booking.sessionType === "day" ? "日間場 10:00~16:00" : "晚間場 17:00~23:00"}</p>
                    <p className="text-amber-300">當日營業額: NT${(() => { const rev = (allRevenues as any[]).find((r: any) => r.bookingId === booking.id); return rev?.totalRevenue ? Number(rev.totalRevenue).toLocaleString() : "0"; })()}</p>
                    <p className="text-gray-400">狀態: {booking.status}</p>
                    {booking.paymentPlan && <p className="text-amber-300">費用方案: {getPlanLabel(booking.paymentPlan)}</p>}
                    {primaryPayment && <>
                      <p className="text-fuchsia-300">付款方式: {getAdminPaymentMethodLabel(primaryPayment.method)}</p>
                      <p className="text-fuchsia-300">付款金額／狀態: NT${Number(primaryPayment.amount || 0).toLocaleString()}・{getAdminPaymentStatusLabel(primaryPayment.status)}</p>
                    </>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {/* BUG 19: 審核通過 — 初始綠色，按下後變黑 */}
                      {booking.status === "pending" && (
                        <button onClick={() => handleApproveBooking(booking.id)}
                          className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-semibold">
                          ✓ 審核通過
                        </button>
                      )}
                      {booking.status !== "pending" && (
                        <span className="inline-block px-3 py-2 bg-slate-900 text-gray-400 rounded text-sm border border-slate-600">✓ 已審核通過</span>
                      )}
                      {/* BUG 21: 正確流程順序 */}
                      {/* BUG 2: 根據 paymentPlan 決定顯示「預約金繳費完成」或「全額繳費完成」 */}
                      {event && (event.status === "approved" || event.status === "pending_review") && booking.paymentPlan === "deposit" && (
                        <button onClick={() => handleDepositPaid(event.id)}
                          className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-semibold">
                          ✓ 預約金繳費完成
                        </button>
                      )}
                      {event && (event.status === "approved" || event.status === "pending_review") && ["student", "weekday", "holiday"].includes(booking.paymentPlan) && (
                        <button onClick={() => setConfirmFullPaidEventId(event.id)}
                          className="px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 font-semibold">
                          ✓ 全額繳費完成
                        </button>
                      )}
                      {event && event.status === "deposit_paid" && (
                        <span className="inline-block px-3 py-2 bg-blue-900 text-blue-300 rounded text-sm border border-blue-600">✓ 預約金繳費完成</span>
                      )}
                      {event && (event.status === "deposit_paid") && (
                        <button onClick={() => setConfirmFullPaidEventId(event.id)}
                          className="px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 font-semibold">
                          ✓ 全額繳費完成
                        </button>
                      )}
                      {event && event.status === "full_paid" && (
                        <>
                          <span className="inline-block px-3 py-2 bg-indigo-900 text-indigo-300 rounded text-sm border border-indigo-600">✓ 全額繳費完成</span>
                          <button onClick={() => handleEventActive(event.id)}
                            className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 font-semibold">
                            ✓ 活動成立
                          </button>
                        </>
                      )}
                      {event && event.status === "active" && (
                        <span className="inline-block px-3 py-2 bg-green-800 text-green-300 rounded text-sm border border-green-600">🎉 活動已成立</span>
                      )}
                      <button onClick={() => setDetailBooking(booking)}
                        className="px-3 py-2 bg-amber-600 text-white rounded text-sm hover:bg-amber-700">詳情</button>
                      <button onClick={() => handleToggleHideBooking(booking.id, booking.hidden)}
                        className="px-3 py-2 bg-slate-600 text-white rounded text-sm hover:bg-slate-500">隱藏</button>
                      <button onClick={() => handleDeleteBooking(booking.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">刪除</button>
                      {event && (event.status === "full_paid" || event.status === "active") && (
                        <button onClick={async () => { if (!confirm("確定要刪除此活動的所有邀請碼嗎？刪除後邀請碼將無法再使用。")) return; try { await deleteInviteCodesMut.mutateAsync({ eventId: event.id }); toast.success("邀請碼已全部刪除"); } catch { toast.error("刪除邀請碼失敗"); } }}
                          className="px-3 py-2 bg-pink-600 text-white rounded text-sm hover:bg-pink-700">刪除邀請碼</button>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* BUG 14: Show hidden bookings toggle */}
              {(allBookings as any[]).filter((b: any) => b.hidden).length > 0 && (
                <div className="mt-4">
                  <p className="text-gray-400 text-sm mb-2">已隱藏的預約（{(allBookings as any[]).filter((b: any) => b.hidden).length} 筆）：</p>
                  {(allBookings as any[]).filter((b: any) => b.hidden).map((booking: any) => (
                    <div key={booking.id} className="bg-slate-700/30 p-3 rounded flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">{booking.birthdayName || "未提供"} - {booking.eventDate}</span>
                      <button onClick={() => handleToggleHideBooking(booking.id, booking.hidden)}
                        className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700">顯示</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "menu":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">菜單管理</h2>
            <p className="text-gray-300 mb-4">管理菜單分類（與精選菜單頁面同步）</p>
            {(menuItems as any[]).map((item: any) => (
              <div key={item.id} className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
                <h3 className="text-amber-400 font-semibold mb-4">{item.category}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-white text-sm mb-2">標題</label>
                    <input type="text" defaultValue={item.title || ""}
                      onBlur={(e) => upsertMenuMut.mutate({ branchId: loginBranchId, id: item.id, category: item.category, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-amber-500/30" />
                  </div>
                  <div>
                    <label className="block text-white text-sm mb-2">描述</label>
                    <textarea defaultValue={item.description || ""}
                      onBlur={(e) => upsertMenuMut.mutate({ branchId: loginBranchId, id: item.id, category: item.category, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-amber-500/30" />
                  </div>
                  <MultiImageManager entityType="menu" entityKey={String(item.id)} label="圖片上傳（可多張）" />
                  <button onClick={() => { deleteMenuMut.mutate({ id: item.id }); setTimeout(() => refetchMenu(), 500); }}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">刪除</button>
                </div>
              </div>
            ))}
            <button onClick={() => { upsertMenuMut.mutate({ branchId: loginBranchId, category: "新分類" }); setTimeout(() => refetchMenu(), 500); }}
              className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500">+ 新增分類</button>

            {/* 第15批次-9: 精選菜單翻書效果 顯示/隱藏 開關 */}
            <div className="bg-slate-800/50 p-4 rounded border border-amber-500/30 mt-4">
              <h3 className="text-white font-semibold mb-3">菜單翻書效果</h3>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-gray-300 text-sm">顯示／隱藏：</span>
                <button onClick={async () => {
                  await updateSettingsMut.mutateAsync({ branchId: loginBranchId, bookFlipEffect: (systemSettings as any)?.bookFlipEffect === false });
                  refetchSettings();
                  toast.success("已更新");
                }} className={`px-4 py-2 rounded text-sm font-medium ${(systemSettings as any)?.bookFlipEffect !== false ? "bg-green-600 text-white" : "bg-slate-600 text-gray-300"}`}>
                  {(systemSettings as any)?.bookFlipEffect !== false ? "顯示中" : "已隱藏"}
                </button>
              </div>
              <p className="text-gray-500 text-xs">開啟後前台精選菜單以真實紙本書籍翻頁效果切換頁面；隱藏則恢復一般左右滑動瀏覽</p>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">系統設定</h2>

            {/* 第13批次-14: 帳號密碼選項已刪除 */}

            {/* 第15批次-3: 分店系統設定僅顯示 每月營業王/本月營業王 兩項 */}
            {(isHqBranch || isTabVisibleForBranch("systemData")) && (<>
            {/* B. 壽星營業王 — BUG 11/13/16: 只有顯示/隱藏，無日期/營業額輸入框 */}
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
              <h3 className="text-amber-400 font-semibold mb-4">B. 壽星營業王</h3>
              <div className="flex items-center gap-4">
                <button onClick={() => handleSettingChange("leaderboardVisible", true)}
                  className={`px-4 py-2 rounded text-sm ${localSettings?.leaderboardVisible !== false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 顯示</button>
                <button onClick={() => handleSettingChange("leaderboardVisible", false)}
                  className={`px-4 py-2 rounded text-sm ${localSettings?.leaderboardVisible === false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 隱藏</button>
              </div>
              <p className="text-gray-400 text-xs mt-2">同步前台壽星營業王頁面</p>
            </div>

            {/* C. 訂閱中心 */}
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
              <h3 className="text-amber-400 font-semibold mb-4">C. 訂閱中心</h3>
              <div className="flex items-center gap-4">
                <button onClick={() => handleSettingChange("subscriptionVisible", true)}
                  className={`px-4 py-2 rounded text-sm ${localSettings?.subscriptionVisible !== false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 顯示</button>
                <button onClick={() => handleSettingChange("subscriptionVisible", false)}
                  className={`px-4 py-2 rounded text-sm ${localSettings?.subscriptionVisible === false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 隱藏</button>
              </div>
              <p className="text-gray-400 text-xs mt-2">同步前台我的會員內訂閱中心選項</p>
            </div>

            {/* BUG 7: D. 營業收入選項已刪除 */}

            {/* E. 收費方案設定 */}
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
              <h3 className="text-amber-400 font-semibold mb-4">E. 收費方案設定</h3>
              <div className="space-y-2 text-white text-sm">
                {[
                  { label: "預約金 NT$", field: "depositPrice", default: 1000 },
                  { label: "學生 NT$", field: "studentPrice", default: 29280 },
                  { label: "平日 NT$", field: "weekdayPrice", default: 39280 },
                  { label: "假日 NT$", field: "holidayPrice", default: 49280 },
                ].map(({ label, field, default: def }) => (
                  <div key={field} className="flex items-center gap-2">
                    <label className="w-28">{label}</label>
                    <input type="number" value={localSettings?.[field] ?? def}
                      onChange={(e) => handleSettingChange(field, parseInt(e.target.value) || 0)}
                      className="w-36 px-2 py-1 bg-slate-700 rounded border border-amber-500/30" />
                  </div>
                ))}
              </div>
            </div>

            {/* BUG 11: F. 編輯首頁 — 顯示/隱藏選項，與首頁編輯首頁按鈕同步 */}
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
              <h3 className="text-amber-400 font-semibold mb-4">F. 編輯首頁</h3>
              <div className="flex items-center gap-4">
                <button onClick={() => handleSettingChange("editHomepageVisible", true)}
                  className={`px-4 py-2 rounded text-sm ${localSettings?.editHomepageVisible !== false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 顯示</button>
                <button onClick={() => handleSettingChange("editHomepageVisible", false)}
                  className={`px-4 py-2 rounded text-sm ${localSettings?.editHomepageVisible === false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 隱藏</button>
              </div>
              <p className="text-gray-400 text-xs mt-2">同步前台首頁編輯首頁按鈕</p>
            </div>
            </>)}

            {/* BUG 5: H. 每月營業王 — 點選月份後輸入姓名、日期、當日營業額 */}
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
              <h3 className="text-amber-400 font-semibold mb-4">G. 每月營業王</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <button key={m} onClick={() => { setSelectedKingMonth(m); const entry = (monthlyKingEntries as any[]).find((e: any) => e.month === m); setKingName(entry?.name || ""); setKingDate(entry?.eventDate || ""); setKingRevenue(entry?.revenue || ""); setKingMvp(entry?.mvp || ""); }}
                    className={`px-3 py-2 rounded text-sm ${selectedKingMonth === m ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}>{m}月</button>
                ))}
              </div>
              {selectedKingMonth && (
                <div className="space-y-3">
                  {/* 第16批次-5: 姓名/日期/當日營業額/MVP 文字標籤移至輸入框上方 */}
                  <div><label className="block text-gray-400 text-sm mb-1">姓名</label><input type="text" value={kingName} onChange={(e) => setKingName(e.target.value)} className="w-full px-2 py-1.5 bg-slate-700 text-white rounded border border-amber-500/30" /></div>
                  <div><label className="block text-gray-400 text-sm mb-1">日期</label><input type="text" value={kingDate} onChange={(e) => setKingDate(e.target.value)} placeholder="例：7/15" className="w-full px-2 py-1.5 bg-slate-700 text-white rounded border border-amber-500/30" /></div>
                  <div><label className="block text-gray-400 text-sm mb-1">當日營業額</label><input type="text" value={kingRevenue} onChange={(e) => setKingRevenue(e.target.value)} placeholder="輸入金額" className="w-full px-2 py-1.5 bg-slate-700 text-white rounded border border-amber-500/30" /></div>
                  {/* 第16批次-4: 新增 MVP 輸入框 */}
                  <div><label className="block text-gray-400 text-sm mb-1">MVP</label><input type="text" value={kingMvp} onChange={(e) => setKingMvp(e.target.value)} placeholder="輸入 MVP" className="w-full px-2 py-1.5 bg-slate-700 text-white rounded border border-amber-500/30" /></div>
                  <button onClick={async () => { try { await upsertMonthlyKingMut.mutateAsync({ branchId: loginBranchId, month: selectedKingMonth, name: kingName, eventDate: kingDate, revenue: kingRevenue, mvp: kingMvp }); await refetchMonthlyKing(); toast.success(`${selectedKingMonth}月營業王已保存`); } catch { toast.error("保存失敗"); } }}
                    className="mt-2 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm">保存</button>
                  {/* BUG 2: Show saved data synced with frontend */}
                  {(() => {
                    const saved = (monthlyKingEntries as any[]).find((e: any) => e.month === selectedKingMonth);
                    if (!saved || (!saved.name && !saved.eventDate && !saved.revenue)) return null;
                    return (
                      <div className="mt-3 p-3 bg-slate-900/60 rounded border border-green-500/30">
                        <p className="text-green-400 text-xs font-semibold mb-1">已儲存（與前台同步顯示）：</p>
                        <p className="text-white text-sm">👑 {saved.name || "—"} ｜ 日期：{saved.eventDate || "—"} ｜ 營業額：NT${Number(saved.revenue || 0).toLocaleString()}{saved.mvp ? ` ｜ MVP：${saved.mvp}` : ""}</p>
                      </div>
                    );
                  })()}
                </div>
              )}
              <p className="text-gray-400 text-xs mt-2">同步前台每月營業王資訊</p>
            </div>
            {/* BUG 6: I. 本月營業王 顯示/隱藏 */}
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
              <h3 className="text-amber-400 font-semibold mb-4">H. 本月營業王 顯示／隱藏</h3>
              <div className="flex items-center gap-4">
                <button onClick={() => handleSettingChange("currentMonthKingVisible", true)}
                  className={`px-4 py-2 rounded text-sm ${localSettings?.currentMonthKingVisible !== false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 顯示</button>
                <button onClick={() => handleSettingChange("currentMonthKingVisible", false)}
                  className={`px-4 py-2 rounded text-sm ${localSettings?.currentMonthKingVisible === false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 隱藏</button>
              </div>
              <p className="text-gray-400 text-xs mt-2">控制前台「本月營業王」壽星預約資訊（姓名、日期、營業額排名）的顯示或隱藏，與前台排行榜同步</p>
              {/* BUG 5: Show synced current month booking data */}
              {localSettings?.currentMonthKingVisible !== false && (currentMonthBookings as any[]).length > 0 && (
                <div className="mt-3 p-3 bg-slate-900/60 rounded border border-green-500/30">
                  <p className="text-green-400 text-xs font-semibold mb-2">本月壽星預約資訊（與前台同步顯示）：</p>
                  <div className="space-y-1">
                    {(currentMonthBookings as any[]).sort((a: any, b: any) => parseInt(b.totalRevenue || "0") - parseInt(a.totalRevenue || "0")).slice(0, 5).map((entry: any, idx: number) => (
                      <p key={idx} className="text-white text-sm">
                        {idx === 0 ? "👑 " : `${idx + 1}. `}
                        {entry.birthdayName || "—"} ｜ {entry.eventDate || "—"} ｜ NT${Number(entry.totalRevenue || 0).toLocaleString()}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 17-3: 年度營業王 顯示/隱藏 */}
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
              <h3 className="text-amber-400 font-semibold mb-4">H2. 年度營業王 顯示／隱藏</h3>
              <div className="flex items-center gap-4">
                <button onClick={() => handleSettingChange("yearlyKingVisible", true)}
                  className={`px-4 py-2 rounded text-sm ${(localSettings as any)?.yearlyKingVisible !== false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 顯示</button>
                <button onClick={() => handleSettingChange("yearlyKingVisible", false)}
                  className={`px-4 py-2 rounded text-sm ${(localSettings as any)?.yearlyKingVisible === false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 隱藏</button>
              </div>
              <p className="text-gray-400 text-xs mt-2">控制前台「年度營業王」Tab 的顯示或隱藏，與每月營業王資料連結，顯示12個月每月最高營業額壽星</p>
            </div>

            {(isHqBranch || isTabVisibleForBranch("systemData")) && (<>
            {/* BUG 2: I. 我的 NPC 顯示/隱藏 */}
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
              <h3 className="text-amber-400 font-semibold mb-4">I. 我的 NPC 顯示／隱藏</h3>
              <div className="flex items-center gap-4">
                <button onClick={() => handleSettingChange("npcVisible", true)}
                  className={`px-4 py-2 rounded text-sm ${localSettings?.npcVisible !== false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 顯示</button>
                <button onClick={() => handleSettingChange("npcVisible", false)}
                  className={`px-4 py-2 rounded text-sm ${localSettings?.npcVisible === false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 隱藏</button>
              </div>
              <p className="text-gray-400 text-xs mt-2">控制前台主功能表「我的 NPC」按鈕的顯示或隱藏</p>
            </div>

            {/* 第13批次-15: 版本資訊 → 輸入帳密 → 進入分店管理 */}
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
              <h3 className="text-amber-400 font-semibold mb-4">J. 版本資訊</h3>
              <button
                onClick={() => { setShowVersionAuth(!showVersionAuth); setVersionAuthAccount(""); setVersionAuthPassword(""); }}
                className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 text-sm"
              >
                版本資訊：v1.0.0
              </button>
              {showVersionAuth && (
                <div className="mt-4 p-4 bg-slate-700/50 rounded space-y-3">
                  <div>
                    <label className="block text-white text-sm mb-2">帳號</label>
                    <input type="text" value={versionAuthAccount} onChange={(e) => setVersionAuthAccount(e.target.value)}
                      placeholder="請輸入帳號"
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-amber-500/30" />
                  </div>
                  <div>
                    <label className="block text-white text-sm mb-2">密碼</label>
                    <input type="password" value={versionAuthPassword} onChange={(e) => setVersionAuthPassword(e.target.value)}
                      placeholder="請輸入密碼"
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-amber-500/30" />
                  </div>
                  <button
                    onClick={() => {
                      const hqBranch = (branchList as any[]).find((b: any) => b.id === 1);
                      const validUsername = hqBranch?.username || "ajdoll0612";
                      const validPassword = hqBranch?.password || "542966";
                      if (versionAuthAccount.trim() === validUsername && versionAuthPassword.trim() === validPassword) {
                        setShowVersionAuth(false);
                        setActiveTab("branches");
                        toast.success("驗證成功，進入分店管理");
                      } else {
                        toast.error("帳號或密碼錯誤");
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    確認
                  </button>
                </div>
              )}
            </div>
            </>)}

            {/* BUG 10: 保存設定按鈕 */}
            <button onClick={handleSaveSettings}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">保存設定</button>
          </div>
        );

      case "tasks":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">任務管理</h2>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setTaskSubTab("dept")}
                className={`px-4 py-2 rounded text-sm font-semibold ${taskSubTab === "dept" ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}>
                部門任務卡
              </button>
              <button onClick={() => setTaskSubTab("video")}
                className={`px-4 py-2 rounded text-sm font-semibold ${taskSubTab === "video" ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}>
                短影音任務
              </button>
              <button onClick={() => setTaskSubTab("special")}
                className={`px-4 py-2 rounded text-sm font-semibold ${taskSubTab === "special" ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}>
                特殊任務卡
              </button>
            </div>

            {/* BUG 25-26: 部門任務卡 — 固定11個職位，各有輸入框 */}
            {taskSubTab === "dept" && (
              <div className="space-y-3">
                {FIXED_POSITIONS.map((pos) => (
                  <div key={pos.key} className="bg-slate-800/50 p-4 rounded border border-amber-500/30">
                    <h4 className="text-amber-400 font-semibold mb-1">{pos.label}</h4>
                    <p className="text-gray-400 text-xs mb-3">{pos.desc}</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={positionNames[pos.key] || ""}
                        onChange={(e) => setPositionNames(prev => ({ ...prev, [pos.key]: e.target.value }))}
                        placeholder={`輸入${pos.label}姓名`}
                        className="flex-1 px-3 py-2 bg-slate-700 text-white rounded border border-amber-500/30 text-sm"
                      />
                    </div>
                    {/* BUG 12-13: Image upload/visibility/delete for each position */}
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      <label className="cursor-pointer px-3 py-1 bg-blue-700 text-white rounded text-xs hover:bg-blue-600">
                        選擇複數圖片
                        <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          for (const file of files) {
                            const reader = new FileReader();
                            reader.onload = async (ev) => {
                              const base64 = (ev.target?.result as string).split(",")[1];
                              const res = await uploadTaskCardImageMut.mutateAsync({ base64, contentType: file.type, filename: file.name });
                              await addTaskCardImageMut.mutateAsync({ branchId: loginBranchId, positionKey: pos.key, imageUrl: res.url });
                              refetchTaskCardImages();
                            };
                            reader.readAsDataURL(file);
                          }
                          e.target.value = "";
                        }} />
                      </label>
                      <button onClick={async () => {
                        const posImgs = (taskCardImages as any[]).filter((img: any) => img.positionKey === pos.key);
                        const visCount = posImgs.filter((img: any) => img.visible).length;
                        for (const img of posImgs) { await toggleTaskCardImageMut.mutateAsync({ id: img.id, visible: !img.visible }); }
                        toast.success(visCount > 0 ? "已隱藏全部圖片" : "已顯示全部圖片");
                        refetchTaskCardImages();
                      }} className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700">
                        {(() => { const posImgs = (taskCardImages as any[]).filter((img: any) => img.positionKey === pos.key); return posImgs.length > 0 && posImgs.every((img: any) => img.visible) ? "隱藏" : "顯示"; })()}
                      </button>
                      <button onClick={async () => {
                        const posImgs = (taskCardImages as any[]).filter((img: any) => img.positionKey === pos.key);
                        if (!posImgs.length) { toast.error("此職位尚無圖片"); return; }
                        if (!confirm(`確定刪除${pos.label}的所有圖片？`)) return;
                        for (const img of posImgs) { await deleteTaskCardImageMut.mutateAsync({ id: img.id }); }
                        refetchTaskCardImages(); toast.success("已刪除");
                      }} className="px-3 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600">刪除</button>
                    </div>
                    {/* Show uploaded images */}
                    {(() => {
                      const posImgs = (taskCardImages as any[]).filter((img: any) => img.positionKey === pos.key);
                      return posImgs.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {posImgs.map((img: any) => (
                            <div key={img.id} className="relative">
                              <img src={img.imageUrl} alt={pos.label} className={`w-full h-16 object-cover rounded ${img.visible ? "" : "opacity-30"}`} />
                              <button onClick={async () => { await toggleTaskCardImageMut.mutateAsync({ id: img.id, visible: !img.visible }); refetchTaskCardImages(); }} className="absolute top-0 left-0 w-5 h-5 bg-black/60 text-white rounded text-xs flex items-center justify-center">{img.visible ? "👁" : "🚫"}</button>
                              <button onClick={async () => { if (!confirm("確定刪除此圖片？")) return; await deleteTaskCardImageMut.mutateAsync({ id: img.id }); refetchTaskCardImages(); }} className="absolute top-0 right-0 w-5 h-5 bg-red-600/80 text-white rounded text-xs flex items-center justify-center">×</button>
                            </div>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                ))}
                <button onClick={async () => { for (const pos of FIXED_POSITIONS) { if (positionNames[pos.key]) { await handleSavePositionName(pos.key, positionNames[pos.key]); } } }}  className="mt-4 px-6 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 font-semibold">確認</button>
              </div>
            )}

            {/* BUG 14: 特殊任務卡 */}
            {taskSubTab === "special" && (
              <div className="space-y-4">
                <div className="bg-slate-800/50 p-4 rounded border border-amber-500/30">
                  <h4 className="text-amber-400 font-semibold mb-3">新增特殊任務卡</h4>
                  <div className="flex gap-2 mb-3">
                    <input id="specialTitleInput" type="text" placeholder="輸入任務卡標題" className="flex-1 px-3 py-2 bg-slate-700 text-white rounded border border-amber-500/30 text-sm" />
                  </div>
                  <label className="cursor-pointer px-4 py-2 bg-blue-700 text-white rounded text-sm hover:bg-blue-600 inline-block">
                    選擇複數圖片
                    <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      const title = (document.getElementById("specialTitleInput") as HTMLInputElement)?.value || "特殊任務";
                      for (const file of files) {
                        const reader = new FileReader();
                        reader.onload = async (ev) => {
                          const base64 = (ev.target?.result as string).split(",")[1];
                          const res = await uploadSpecialTaskCardMut.mutateAsync({ base64, contentType: file.type, filename: file.name });
                          await addSpecialTaskCardMut.mutateAsync({ branchId: loginBranchId, title, imageUrl: res.url });
                          refetchSpecialTaskCards();
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = "";
                    }} />
                  </label>
                </div>
                {(specialTaskCards as any[]).length > 0 && (
                  <div className="space-y-3">
                    {(specialTaskCards as any[]).map((card: any) => (
                      <div key={card.id} className="bg-slate-800/50 p-4 rounded border border-amber-500/30">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-amber-400 font-semibold">{card.title}</h4>
                          <div className="flex gap-2">
                            <button onClick={async () => { await toggleSpecialTaskCardMut.mutateAsync({ id: card.id, visible: !card.visible }); refetchSpecialTaskCards(); }} className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700">{card.visible ? "隱藏" : "顯示"}</button>
                            <button onClick={async () => { if (!confirm("確定刪除此任務卡？")) return; await deleteSpecialTaskCardMut.mutateAsync({ id: card.id }); refetchSpecialTaskCards(); toast.success("已刪除"); }} className="px-3 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600">刪除</button>
                          </div>
                        </div>
                        <img src={card.imageUrl} alt={card.title} className={`w-full h-32 object-cover rounded ${card.visible ? "" : "opacity-30"}`} />
                      </div>
                    ))}
                  </div>
                )}
                {(specialTaskCards as any[]).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-8">尚無特殊任務卡，請上傳圖片新增</p>
                )}
              </div>
            )}

            {/* BUG 27-31: 短影音任務 */}
            {taskSubTab === "video" && (
              <div className="space-y-4">
                <div className="bg-slate-800/50 p-4 rounded border border-amber-500/30">
                  <label className="block text-amber-400 font-semibold mb-3">選擇壽星預約</label>
                  <select value={selectedVideoBookingId ?? ""} onChange={(e) => { setSelectedVideoBookingId(e.target.value ? Number(e.target.value) : null); setSelectedVideoPosition(""); }}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-amber-500/30 mb-4">
                    <option value="">請選擇壽星預約（系統自動讀取邀請碼綁定影片）</option>
                    {(allBookings as any[]).filter((b: any) => !b.hidden).map((b: any) => (
                      <option key={b.id} value={b.id}>{b.birthdayName || "未提供"} — {b.eventDate}</option>
                    ))}
                  </select>
                  <label className="block text-amber-400 font-semibold mb-3">選擇職位</label>
                  <select value={selectedVideoPosition} onChange={(e) => setSelectedVideoPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-amber-500/30"
                    disabled={!selectedVideoBookingId}>
                    <option value="">請選擇職位</option>
                    {FIXED_POSITIONS.map(pos => (
                      <option key={pos.key} value={pos.key}>{pos.label}</option>
                    ))}
                  </select>
                  {!selectedVideoBookingId && <p className="text-gray-400 text-xs mt-2">請先選擇壽星預約，系統將自動載入該活動的邀請碼綁定影片</p>}
                </div>
                {selectedVideoPosition && selectedVideoEventId && (
                  <div className="bg-slate-800/50 p-4 rounded border border-amber-500/30">
                    <h4 className="text-amber-400 font-semibold mb-4">
                      {FIXED_POSITIONS.find(p => p.key === selectedVideoPosition)?.label} — 影片管理
                    </h4>
                    <div className="space-y-3">
                      {VIDEO_ANGLES.map(angle => {
                        const posLabel = FIXED_POSITIONS.find(p => p.key === selectedVideoPosition)?.label || "";
                        const vid = (adminShortVideos as any[]).find((v: any) => v.angle === angle && (v.position === posLabel || v.position === selectedVideoPosition));
                        const videoUrl = vid?.videoUrl;
                        const hasVideo = !!videoUrl;
                        return (
                        <div key={angle} className="flex items-center justify-between bg-slate-700/50 p-3 rounded">
                          <span className="text-white text-sm">{angle}</span>
                          <div className="flex items-center gap-2">
                            {hasVideo ? (
                              <>
                                {/* BUG 3: Preview button - opens video in new window */}
                                <button onClick={() => { const fullUrl = videoUrl.startsWith("http") ? videoUrl : window.location.origin + videoUrl; setPreviewVideoUrl(fullUrl); }}
                                  className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                                  預覽
                                </button>
                                {/* BUG 4: Download button - use server endpoint for real mobile download */}
                                <a
                                  href={(() => {
                                    const fileKey = vid?.fileKey || videoUrl.replace("/manus-storage/", "");
                                    const downloadFilename = `${posLabel}_${angle}.mp4`;
                                    return `/api/download-video?fileKey=${encodeURIComponent(fileKey)}&filename=${encodeURIComponent(downloadFilename)}`;
                                  })()}
                                  download={`${posLabel}_${angle}.mp4`}
                                  className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 cursor-pointer inline-block no-underline"
                                >
                                  下載影片
                                </a>
                              </>
                            ) : (
                              <span className="px-4 py-2 bg-slate-600 text-gray-400 rounded text-sm">尚無影片</span>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                    {/* BUG 3: Download all & Delete all buttons */}
                    <div className="flex gap-3 mt-4">
                      <button onClick={async () => {
                        const posLabel = FIXED_POSITIONS.find(p => p.key === selectedVideoPosition)?.label || "";
                        const videos = (adminShortVideos as any[]).filter((v: any) => (v.position === posLabel || v.position === selectedVideoPosition) && v.videoUrl);
                        if (videos.length === 0) { toast.error("此職位尚無影片可下載"); return; }
                        toast.info(`正在下載 ${videos.length} 支影片...`);
                        for (let i = 0; i < videos.length; i++) {
                          const vid = videos[i];
                          try {
                            const fileKey = vid.fileKey || vid.videoUrl.replace("/manus-storage/", "");
                            const downloadFilename = `${posLabel}_${vid.angle || i}.mp4`;
                            const downloadUrl = `/api/download-video?fileKey=${encodeURIComponent(fileKey)}&filename=${encodeURIComponent(downloadFilename)}`;
                            // Use hidden anchor tag with download attribute for mobile compatibility
                            const a = document.createElement("a");
                            a.href = downloadUrl;
                            a.download = downloadFilename;
                            a.style.display = "none";
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          } catch { /* skip failed */ }
                          // Delay between downloads to avoid browser blocking
                          if (i < videos.length - 1) await new Promise(r => setTimeout(r, 1500));
                        }
                      }}
                        className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-semibold">
                        全部下載
                      </button>
                      <button onClick={async () => {
                        const posLabel = FIXED_POSITIONS.find(p => p.key === selectedVideoPosition)?.label || "";
                        const videos = (adminShortVideos as any[]).filter((v: any) => (v.position === posLabel || v.position === selectedVideoPosition));
                        if (videos.length === 0) { toast.error("此職位尚無影片可刪除"); return; }
                        if (!confirm(`確定要刪除「${posLabel}」的所有影片嗎？此操作無法復原。`)) return;
                        try {
                          const deleteRes = await fetch("/api/trpc/shortVideo.deleteByPosition", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ json: { eventId: selectedVideoEventId, position: posLabel } }),
                          });
                          if (!deleteRes.ok) throw new Error("delete failed");
                          toast.success(`已刪除 ${videos.length} 支影片`);
                          refetchAdminVideos();
                        } catch { toast.error("刪除失敗，請稍後再試"); }
                      }}
                        className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-semibold">
                        全部刪除
                      </button>
                    </div>
                    <p className="text-gray-400 text-xs mt-3">影片由親友在「輸入邀請碼了解更多」的短影音任務中上傳，系統依邀請碼自動歸屬此活動</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "editor":
        // 第13批次-16: 視覺編輯器重構 — 頁面列表 → 全螢幕載入實際頁面(iframe) + 覆蓋編輯層
        {
          const EDITOR_PAGES = [
            { id: "home", label: "首頁", path: "/" },
            { id: "admin-settings", label: "系統設定", path: "/admin?editorTarget=settings" },
            { id: "store-select", label: "門店選擇", path: "/store-select" },
            { id: "main", label: "主功能", path: "/main" },
            { id: "booking", label: "開始預約", path: "/booking" },
            { id: "my-booking", label: "我的活動【預約進度】", path: "/my-booking" },
            { id: "invite", label: "我的任務【輸入邀請碼】", path: "/invite" },
            { id: "leaderboard", label: "壽星營業王", path: "/leaderboard" },
            { id: "menu", label: "精選菜單", path: "/menu" },
            { id: "experience", label: "真實體驗牆", path: "/experience" },
            { id: "booking-calendar", label: "預約查詢", path: "/booking-calendar" },
            { id: "member", label: "我的生日倒數", path: "/member" },
            { id: "npc", label: "我的NPC", path: "/npc" },
            { id: "ritual", label: "慶生儀式", path: "/ritual" },
            { id: "more", label: "更多", path: "/more" },
            { id: "brand", label: "品牌資訊", path: "/brand" },
            { id: "privacy", label: "隱私權政策", path: "/privacy" },
            { id: "sop", label: "我的SOP", path: "/sop" },
          ];
          // 頁面列表模式（尚未進入編輯）
          if (!editorFullscreen) {
            return (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-amber-400 mb-2">視覺編輯器</h2>
                <p className="text-gray-300 mb-4">點選要編輯的頁面，將直接載入該頁面進行編輯</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {EDITOR_PAGES.map((page) => (
                    <button key={page.id}
                      onClick={() => { setEditorPageId(page.id); setEditorSelectedId(null); setEditorFullscreen(true); }}
                      className="px-4 py-4 rounded font-semibold text-sm bg-slate-700 text-gray-200 hover:bg-amber-600 hover:text-white transition">
                      {page.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          }
          // 全螢幕編輯模式：iframe 載入實際頁面 + 覆蓋編輯層
          const currentPage = EDITOR_PAGES.find((p) => p.id === editorPageId) || EDITOR_PAGES[0];
          const selEl = editorSelectedId ? (editorElements as any[]).find((e: any) => e.id === editorSelectedId) : null;
          return (
            <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
              {/* 上方工具列 */}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-amber-500/30 flex-wrap shrink-0">
                <button onClick={() => { setEditorFullscreen(false); setEditorSelectedId(null); setEditorPreview(false); }}
                  className="px-3 py-1.5 bg-slate-700 text-white rounded text-sm hover:bg-slate-600">← 返回頁面列表</button>
                <span className="text-amber-400 font-semibold text-sm">{currentPage.label}</span>
                {!editorPreview && (
                  <>
                    <label className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 cursor-pointer">
                      選擇圖片
                      <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        let offset = 0;
                        for (const file of Array.from(files)) {
                          try {
                            await new Promise<void>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onload = async () => {
                                try {
                                  const base64 = (reader.result as string).split(",")[1];
                                  const res = await uploadEditorImageMut.mutateAsync({ base64, contentType: file.type, filename: file.name });
                                  await upsertEditorMut.mutateAsync({ branchId: loginBranchId, pageId: editorPageId, type: "image", content: res.url, x: 50 + editorFrameScroll.x + offset, y: 80 + editorFrameScroll.y + offset, width: 200, height: 150 });
                                  offset += 20;
                                  resolve();
                                } catch (err) { reject(err); }
                              };
                              reader.onerror = () => reject(new Error("讀取失敗"));
                              reader.readAsDataURL(file);
                            });
                          } catch { toast.error(`${file.name} 上傳失敗`); }
                        }
                        toast.success("圖片已新增（即時儲存）");
                        refetchEditorElements();
                        (e.target as HTMLInputElement).value = "";
                      }} />
                    </label>
                    {/* 第16批次-2: 變更背景圖片 — 上傳圖片後設定為該頁面背景（保留版面/按鈕/動畫/功能不變） */}
                    <label className="px-3 py-1.5 bg-teal-600 text-white rounded text-sm hover:bg-teal-700 cursor-pointer">
                      變更背景圖片
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve((reader.result as string).split(",")[1]);
                            reader.onerror = () => reject(new Error("讀取失敗"));
                            reader.readAsDataURL(file);
                          });
                          const res = await uploadEditorImageMut.mutateAsync({ base64, contentType: file.type, filename: file.name });
                          let bgMap: Record<string, string> = {};
                          const latestSettings = await refetchSettings();
                          try { bgMap = JSON.parse((latestSettings.data as any)?.pageBackgrounds || "{}"); } catch { bgMap = {}; }
                          bgMap[editorPageId] = res.url;
                          await updateSettingsMut.mutateAsync({ branchId: loginBranchId, pageBackgrounds: JSON.stringify(bgMap) } as any);
                          const persistedSettings = await refetchSettings();
                          let persistedMap: Record<string, string> = {};
                          try { persistedMap = JSON.parse((persistedSettings.data as any)?.pageBackgrounds || "{}"); } catch { persistedMap = {}; }
                          if (persistedMap[editorPageId] !== res.url) throw new Error("背景設定未保存");
                          setEditorBackgroundUrl((previous) => ({ ...previous, [editorPageId]: res.url }));
                          setEditorBackgroundRevision(Date.now());
                          toast.success("背景圖片已保存並重新載入");
                          // 以修訂參數破除 iframe 快取，強制 PageBackgroundApplier 讀取剛回讀確認的資料庫設定。
                          if (editorIframeRef.current) {
                            try {
                              const iframeWin = editorIframeRef.current.contentWindow;
                              if (iframeWin) {
                                iframeWin.localStorage.setItem("frontBranchId", String(loginBranchId));
                                iframeWin.postMessage({ type: "birthday-bistro-background-saved", pageId: editorPageId, branchId: loginBranchId, url: res.url }, window.location.origin);
                              }
                              const reloadUrl = new URL(editorIframeRef.current.src, window.location.origin);
                              reloadUrl.searchParams.set("veditorBackgroundRev", String(Date.now()));
                              editorIframeRef.current.src = reloadUrl.toString();
                            } catch {
                              editorIframeRef.current.src = `${editorIframeRef.current.src}${editorIframeRef.current.src.includes("?") ? "&" : "?"}veditorBackgroundRev=${Date.now()}`;
                            }
                          }
                        } catch { toast.error("背景圖片保存失敗，請重新嘗試"); }
                        (e.target as HTMLInputElement).value = "";
                      }} />
                    </label>
                    {(() => {
                      let bgMap: Record<string, string> = {};
                      try { bgMap = JSON.parse((systemSettings as any)?.pageBackgrounds || "{}"); } catch { bgMap = {}; }
                      if (!bgMap[editorPageId]) return null;
                      return (
                        <button onClick={async () => {
                          if (!confirm("還原此頁面的預設背景？")) return;
                          delete bgMap[editorPageId];
                          await updateSettingsMut.mutateAsync({ branchId: loginBranchId, pageBackgrounds: JSON.stringify(bgMap) } as any);
                          toast.success("已還原預設背景");
                          refetchSettings();
                          try {
                            const doc = editorIframeRef.current?.contentDocument;
                            if (doc?.body) doc.body.style.backgroundImage = "";
                          } catch { /* ignore */ }
                        }} className="px-3 py-1.5 bg-slate-600 text-white rounded text-sm hover:bg-slate-500">還原背景</button>
                      );
                    })()}
                  </>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => { setEditorPreview(!editorPreview); setEditorSelectedId(null); }}
                    className={`px-3 py-1.5 rounded text-sm ${editorPreview ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}
                    title="即時預覽">👁 {editorPreview ? "編輯模式" : "即時預覽"}</button>
                  <button onClick={() => { setEditorFullscreen(false); setEditorSelectedId(null); setEditorPreview(false); }}
                    className="px-3 py-1.5 bg-slate-700 text-white rounded text-sm hover:bg-slate-600" title="離開編輯">✕ 離開編輯</button>
                </div>
              </div>
              {/* 實際頁面 iframe + 覆蓋編輯層 */}
              <div className="flex-1 relative overflow-hidden">
                <iframe ref={editorIframeRef} data-editor-branch-id={loginBranchId}
                  src={`${currentPage.path}${currentPage.path.includes("?") ? "&" : "?"}veditor=1&veditorBranchId=${loginBranchId}&veditorBackgroundRev=${editorBackgroundRevision}${editorBackgroundUrl[editorPageId] ? `&veditorBackgroundPageId=${encodeURIComponent(editorPageId)}&veditorBackgroundUrl=${encodeURIComponent(editorBackgroundUrl[editorPageId])}` : ""}`}
                  title={currentPage.label}
                  className="absolute inset-0 w-full h-full border-0 bg-white"
                  onLoad={(event) => {
                    try {
                      const frameWindow = event.currentTarget.contentWindow;
                      if (!frameWindow) return;
                      frameWindow.localStorage.setItem("frontBranchId", String(loginBranchId));
                      const loadedPageId = PATH_TO_PAGE_ID[frameWindow.location.pathname];
                      if (loadedPageId && loadedPageId !== editorPageId) setEditorPageId(loadedPageId);
                      const syncScroll = () => setEditorFrameScroll({ x: frameWindow.scrollX, y: frameWindow.scrollY });
                      syncScroll();
                      frameWindow.addEventListener("scroll", syncScroll, { passive: true });
                    } catch { setEditorFrameScroll({ x: 0, y: 0 }); }
                  }} />
                {/* 第14批次-5: 原生文字元素編輯層 — 頁面內所有文字皆可點選 → 修改/放大/縮小/刪除，即時儲存 */}
                <VisualEditorNativeLayer iframeRef={editorIframeRef} pageId={editorPageId} branchId={loginBranchId} enabled={!editorPreview} />
                {/* 選取元素時的浮動編輯面板（直接編輯，不佔工具列） */}
                {!editorPreview && selEl && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-900/95 border border-amber-500/40 rounded-lg px-2 py-1.5 shadow-lg">
                    {selEl.type === "text" && (
                      <>
                        <button onClick={() => {
                          const newContent = prompt("修改文字內容：", selEl.content || "");
                          if (newContent !== null) {
                            upsertEditorMut.mutate({ branchId: loginBranchId, id: selEl.id, pageId: editorPageId, type: selEl.type, content: newContent, x: selEl.x, y: selEl.y, width: selEl.width, height: selEl.height, fontSize: selEl.fontSize, color: selEl.color, zIndex: selEl.zIndex });
                          }
                        }} className="px-2.5 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">修改文字</button>
                        <button onClick={() => {
                          const newSize = prompt("字體大小：", String(selEl.fontSize || 16));
                          if (newSize) {
                            upsertEditorMut.mutate({ branchId: loginBranchId, id: selEl.id, pageId: editorPageId, type: selEl.type, content: selEl.content, x: selEl.x, y: selEl.y, width: selEl.width, height: selEl.height, fontSize: parseInt(newSize), color: selEl.color, zIndex: selEl.zIndex });
                          }
                        }} className="px-2.5 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700">字型</button>
                        <input type="color" defaultValue={selEl.color || "#ffffff"}
                          onChange={(e) => {
                            upsertEditorMut.mutate({ branchId: loginBranchId, id: selEl.id, pageId: editorPageId, type: selEl.type, content: selEl.content, x: selEl.x, y: selEl.y, width: selEl.width, height: selEl.height, fontSize: selEl.fontSize, color: e.target.value, zIndex: selEl.zIndex });
                          }}
                          className="w-7 h-7 cursor-pointer rounded border-0" title="色彩" />
                      </>
                    )}
                    <button onClick={async () => {
                      await deleteEditorMut.mutateAsync({ id: selEl.id });
                      setEditorSelectedId(null);
                    toast.success("已刪除（即時儲存）");
                    }} className="px-2.5 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">刪除</button>
                    <button onClick={() => setEditorSelectedId(null)}
                      className="px-2 py-1 bg-slate-700 text-white rounded text-xs hover:bg-slate-600">✕</button>
                  </div>
                )}
                {/* 新增文字：未選取元素時顯示於畫面右下角（不佔上方工具列） */}
                {!editorPreview && !selEl && (
                  <button onClick={async () => {
                    await upsertEditorMut.mutateAsync({ branchId: loginBranchId, pageId: editorPageId, type: "text", content: "新文字", x: 50 + editorFrameScroll.x, y: 80 + editorFrameScroll.y, width: 200, height: 40, fontSize: 18, color: "#ffffff" });
                    toast.success("已新增文字（即時儲存）");
                  }} className="absolute bottom-4 right-4 z-20 px-3 py-2 bg-amber-600 text-white rounded-full text-sm shadow-lg hover:bg-amber-700">+ 文字</button>
                )}
                {/* 覆蓋編輯層（預覽模式時隱藏編輯框線，僅顯示元素） */}
                {/* 第14批次-5: 容器本身 pointer-events:none 讓點擊穿透到 iframe（頁面原生文字可點選）；
                    自訂元素（子元素）各自 pointer-events:auto 維持拖曳/縮放；拖曳中容器恢復接收事件 */}
                <div
                  className="absolute inset-0"
                  // 選取元素後必須由編輯層接收第二根手指與移動事件；否則第二指落在元素外時
                  // 會被 iframe 頁面吃掉，造成＋文字／＋圖片只縮放框架或無法鎖定拖曳位置。
                  style={{ pointerEvents: editorPreview ? "none" : (editorSelectedId || editorDragging || editorResizing) ? "auto" : "none", background: "transparent", touchAction: "none" }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (editorDragging) {
                      const position = getVisualEditorDragOffset({ startClientX: editorDragging.startX, startClientY: editorDragging.startY, clientX: e.clientX - rect.left, clientY: e.clientY - rect.top, baseX: editorDragging.elX, baseY: editorDragging.elY });
                      const newX = Math.max(0, position.x);
                      const newY = Math.max(0, position.y);
                      const target = e.currentTarget.querySelector(`[data-el-id="${editorDragging.id}"]`) as HTMLElement;
                      if (target) { target.style.left = newX + "px"; target.style.top = newY + "px"; }
                    }
                    if (editorResizing) {
                      const newW = Math.max(50, editorResizing.startW + (e.clientX - editorResizing.startX));
                      const newH = Math.max(30, editorResizing.startH + (e.clientY - editorResizing.startY));
                      const target = e.currentTarget.querySelector(`[data-el-id="${editorResizing.id}"]`) as HTMLElement;
                      if (target) { target.style.width = newW + "px"; target.style.height = newH + "px"; }
                    }
                  }}
                  onMouseUp={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (editorDragging) {
                      const position = getVisualEditorDragOffset({ startClientX: editorDragging.startX, startClientY: editorDragging.startY, clientX: e.clientX - rect.left, clientY: e.clientY - rect.top, baseX: editorDragging.elX, baseY: editorDragging.elY });
                      const newX = Math.max(0, position.x);
                      const newY = Math.max(0, position.y);
                      const el = (editorElements as any[]).find((item: any) => item.id === editorDragging.id);
                      if (el) {
                        upsertEditorMut.mutate({ branchId: loginBranchId, id: el.id, pageId: editorPageId, type: el.type, content: el.content, x: newX + editorFrameScroll.x, y: newY + editorFrameScroll.y, width: el.width, height: el.height, fontSize: el.fontSize, color: el.color, zIndex: el.zIndex });
                      }
                      setEditorDragging(null);
                    }
                    if (editorResizing) {
                      const el = (editorElements as any[]).find((item: any) => item.id === editorResizing.id);
                      if (el) {
                        const newW = Math.max(50, editorResizing.startW + (e.clientX - editorResizing.startX));
                        const newH = Math.max(30, editorResizing.startH + (e.clientY - editorResizing.startY));
                        upsertEditorMut.mutate({ branchId: loginBranchId, id: el.id, pageId: editorPageId, type: el.type, content: el.content, x: el.x, y: el.y, width: newW, height: newH, fontSize: el.fontSize, color: el.color, zIndex: el.zIndex });
                      }
                      setEditorResizing(null);
                    }
                  }}
                  onMouseLeave={() => { setEditorDragging(null); setEditorResizing(null); }}
                  onClick={(e) => { if (e.target === e.currentTarget) setEditorSelectedId(null); }}
                  onTouchStartCapture={(e) => {
                    if (editorPreview || e.touches.length !== 2) return;
                    // 第二指不一定落在已選取元素上；從目前事件目標回推元素，
                    // 才能讓文字與圖片都使用同一套雙指縮放資料鏈。
                    const targetEl = (e.target as HTMLElement).closest?.("[data-el-id]") as HTMLElement | null;
                    const targetId = Number(targetEl?.dataset.elId || 0);
                    const pinchId = editorSelectedId || targetId;
                    const el = (editorElements as any[]).find((item: any) => item.id === pinchId);
                    if (!el) return;
                    const dist = getVisualEditorTouchDistance(e.touches[0], e.touches[1]);
                    setEditorSelectedId(el.id);
                    setEditorTouchState(prev => ({ ...prev, pinchStartDist: dist, pinchElId: el.id, pinchStartFontSize: el.fontSize || 16, pinchStartWidth: el.width, pinchStartHeight: el.height, isDragging: false, longPressTimer: prev.longPressTimer ? (clearTimeout(prev.longPressTimer), null) : null }));
                  }}
                  onTouchMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (e.touches.length === 2 && editorTouchState.pinchElId) {
                      e.preventDefault();
                      const dist = getVisualEditorTouchDistance(e.touches[0], e.touches[1]);
                      const scale = getVisualEditorPinchScale({ baseScale: 1, startDistance: editorTouchState.pinchStartDist, currentDistance: dist, min: 0.25, max: 4 });
                      const target = e.currentTarget.querySelector(`[data-el-id="${editorTouchState.pinchElId}"]`) as HTMLElement;
                      const el = (editorElements as any[]).find((item: any) => item.id === editorTouchState.pinchElId);
                      if (target && el) {
                        if (el.type === "text") {
                          const text = target.querySelector("[data-editor-text-content]") as HTMLElement | null;
                          if (text) text.style.fontSize = `${getVisualEditorPinchScale({ baseScale: editorTouchState.pinchStartFontSize, startDistance: editorTouchState.pinchStartDist, currentDistance: dist, min: 8, max: 160 })}px`;
                        } else {
                          target.style.width = `${Math.max(50, Math.round(editorTouchState.pinchStartWidth * scale))}px`;
                          target.style.height = `${Math.max(30, Math.round(editorTouchState.pinchStartHeight * scale))}px`;
                        }
                      }
                    } else if (e.touches.length === 1 && editorTouchState.isDragging && editorTouchState.elId) {
                      e.preventDefault();
                      const touch = e.touches[0];
                      const position = getVisualEditorDragOffset({ startClientX: editorTouchState.startX, startClientY: editorTouchState.startY, clientX: touch.clientX - rect.left, clientY: touch.clientY - rect.top, baseX: editorTouchState.elX, baseY: editorTouchState.elY });
                      const newX = Math.max(0, position.x);
                      const newY = Math.max(0, position.y);
                      const target = e.currentTarget.querySelector(`[data-el-id="${editorTouchState.elId}"]`) as HTMLElement;
                      if (target) { target.style.left = newX + "px"; target.style.top = newY + "px"; }
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (editorTouchState.longPressTimer) { clearTimeout(editorTouchState.longPressTimer); }
                    if (editorTouchState.pinchElId) {
                      const el = (editorElements as any[]).find((item: any) => item.id === editorTouchState.pinchElId);
                      if (el) {
                        const target = e.currentTarget.querySelector(`[data-el-id="${editorTouchState.pinchElId}"]`) as HTMLElement;
                        if (target) {
                          const text = target.querySelector("[data-editor-text-content]") as HTMLElement | null;
                          const newFontSize = el.type === "text" && text ? parseInt(text.style.fontSize) || el.fontSize : el.fontSize;
                          const newWidth = el.type === "image" ? parseInt(target.style.width) || el.width : el.width;
                          const newHeight = el.type === "image" ? parseInt(target.style.height) || el.height : el.height;
                          upsertEditorMut.mutate({ branchId: loginBranchId, id: el.id, pageId: editorPageId, type: el.type, content: el.content, x: el.x, y: el.y, width: newWidth, height: newHeight, fontSize: newFontSize, color: el.color, zIndex: el.zIndex });
                        }
                      }
                    } else if (editorTouchState.isDragging && editorTouchState.elId) {
                      const el = (editorElements as any[]).find((item: any) => item.id === editorTouchState.elId);
                      if (el) {
                        const target = e.currentTarget.querySelector(`[data-el-id="${editorTouchState.elId}"]`) as HTMLElement;
                        if (target) {
                          const parsedX = parseInt(target.style.left);
                          const parsedY = parseInt(target.style.top);
                          const newX = Number.isFinite(parsedX) ? parsedX + editorFrameScroll.x : el.x;
                          const newY = Number.isFinite(parsedY) ? parsedY + editorFrameScroll.y : el.y;
                          upsertEditorMut.mutate({ branchId: loginBranchId, id: el.id, pageId: editorPageId, type: el.type, content: el.content, x: newX, y: newY, width: el.width, height: el.height, fontSize: el.fontSize, color: el.color, zIndex: el.zIndex });
                        }
                      }
                    }
                    setEditorTouchState(prev => ({ ...prev, isDragging: false, elId: null, longPressTimer: null, pinchElId: null }));
                  }}
                >
                  {(editorElements as any[]).map((el: any) => (
                    <div key={el.id} data-el-id={el.id}
                      className={`absolute select-none ${editorPreview ? "" : editorSelectedId === el.id ? "cursor-move border-2 border-amber-400 ring-2 ring-amber-400/30" : "cursor-move border border-dashed border-amber-500/50 hover:border-amber-400"}`}
                      style={{ left: el.x - editorFrameScroll.x, top: el.y - editorFrameScroll.y, width: el.width, height: el.height, zIndex: el.zIndex || 1, pointerEvents: editorPreview ? "none" : "auto", touchAction: "none" }}
                      onClick={(e) => { if (editorPreview) return; e.stopPropagation(); setEditorSelectedId(el.id); }}
                      onMouseDown={(e) => {
                        if (editorPreview) return;
                        if ((e.target as HTMLElement).dataset.resize) return;
                        e.preventDefault();
                        const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                        setEditorDragging({ id: el.id, startX: e.clientX - rect.left, startY: e.clientY - rect.top, elX: el.x - editorFrameScroll.x, elY: el.y - editorFrameScroll.y });
                        setEditorSelectedId(el.id);
                      }}
                      onTouchStart={(e) => {
                        if (editorPreview) return;
                        if (e.touches.length === 2) {
                          const dist = getVisualEditorTouchDistance(e.touches[0], e.touches[1]);
                          setEditorTouchState(prev => ({ ...prev, pinchStartDist: dist, pinchElId: el.id, pinchStartFontSize: el.fontSize || 16, pinchStartWidth: el.width, pinchStartHeight: el.height, isDragging: false, longPressTimer: prev.longPressTimer ? (clearTimeout(prev.longPressTimer), null) : null }));
                          setEditorSelectedId(el.id);
                        } else if (e.touches.length === 1) {
                          const touch = e.touches[0];
                          const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                          const startX = touch.clientX - rect.left;
                          const startY = touch.clientY - rect.top;
                          const timer = setTimeout(() => {
                            setEditorTouchState(prev => ({ ...prev, isDragging: true, elId: el.id, startX, startY, elX: el.x - editorFrameScroll.x, elY: el.y - editorFrameScroll.y }));
                          }, VISUAL_EDITOR_LONG_PRESS_MS);
                          setEditorTouchState(prev => ({ ...prev, longPressTimer: timer }));
                          setEditorSelectedId(el.id);
                        }
                      }}
                      onDoubleClick={() => {
                        if (editorPreview) return;
                        if (el.type === "text") {
                          const newContent = prompt("修改文字：", el.content || "");
                          if (newContent !== null) {
                            upsertEditorMut.mutate({ branchId: loginBranchId, id: el.id, pageId: editorPageId, type: el.type, content: newContent, x: el.x, y: el.y, width: el.width, height: el.height, fontSize: el.fontSize, color: el.color, zIndex: el.zIndex });
                          }
                        }
                      }}
                    >
                      {el.type === "text" ? (
                        <div data-editor-text-content="true" className="w-full h-full flex items-center px-2 overflow-visible whitespace-pre-wrap pointer-events-none"
                          style={{ fontSize: el.fontSize || 16, color: el.color || "#ffffff" }}>
                          {el.content}
                        </div>
                      ) : (
                        <img src={el.content || ""} alt="" className="w-full h-full object-contain pointer-events-none" />
                      )}
                      {!editorPreview && editorSelectedId === el.id && (
                        <div data-resize="true"
                          className="absolute bottom-0 right-0 w-5 h-5 bg-amber-500 cursor-se-resize rounded-tl"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditorResizing({ id: el.id, startX: e.clientX, startY: e.clientY, startW: el.width, startH: el.height });
                          }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {/* 底部狀態列 */}
              {!editorPreview && (
                <div className="px-3 py-1.5 text-xs text-gray-500 bg-slate-900 border-t border-slate-800 shrink-0">
                  {editorSelectedId ? `已選取元素 #${editorSelectedId} — 拖曳移動｜右下角縮放｜雙擊編輯文字（修改即時儲存）` : "點擊元素選取｜拖曳移動｜雙擊編輯文字（修改即時儲存）"}
                  {" "}｜ 元素數：{(editorElements as any[]).length}
                </div>
              )}
            </div>
          );
        }

      case "members":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">壽星會員專區</h2>
            {/* 1. 會員搜索框 */}
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
              <p className="text-amber-400 font-semibold mb-3">會員搜索框</p>
              <div className="flex gap-2">
                <input type="text" value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleMemberSearch(); }}
                  placeholder="輸入會員姓名..."
                  className="flex-1 px-3 py-2 bg-slate-700 text-white rounded border border-amber-500/30" />
                <button onClick={handleMemberSearch}
                  className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 whitespace-nowrap">確認</button>
              </div>
              {searchedMember && (
                <div className="mt-6 space-y-4">
                  <div className="bg-slate-700/50 p-4 rounded">
                    <h4 className="text-amber-400 font-semibold mb-2">會員資訊</h4>
                    <div className="text-white text-sm space-y-1">
                      <p>姓名: {searchedMember.name || "未提供"}</p>
                      <p>電話: {searchedMember.phone || "未提供"}</p>
                      <p>LINE ID: {searchedMember.lineId || "未提供"}</p>
                      <p>會員編號: {searchedMember.memberNumber || `MEM${String(searchedMember.id).padStart(4, "0")}`}</p>
                      <p>會員身份: {searchedMember.memberRole === "premium" ? "高級會員" : searchedMember.memberRole === "host" ? "壽星會員" : searchedMember.memberRole === "friend" ? "親友會員" : "一般會員"}</p>
                    </div>
                  </div>
                  {/* 2. 會員預約資訊 */}
                  <div className="bg-slate-700/50 p-4 rounded">
                    <h4 className="text-amber-400 font-semibold mb-2">會員預約資訊（共 {searchedMemberBookings.length} 筆）</h4>
                    {searchedMemberBookings.length > 0 ? (
                      <div className="space-y-3">
                        {searchedMemberBookings.filter((b: any) => !b.hidden).map((booking: any) => {
                          const event = getEventForBooking(booking.id);
                          return (
                            <div key={booking.id} className="bg-slate-800/50 p-3 rounded text-white text-sm space-y-1">
                              <p className="font-semibold">壽星姓名: {booking.birthdayName || "未提供"}</p>
                              <p className="text-gray-400">活動日期: {booking.eventDate}</p>
                              <p className="text-gray-400">費用方案: {getPlanLabel(booking.paymentPlan || "")}</p>
                              <p className="text-gray-400">狀態: {booking.status}</p>
                              {event && <p className="text-gray-400">活動狀態: {event.status}</p>}
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => setDetailBooking(booking)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">詳情</button>
                                <button onClick={() => handleToggleHideBooking(booking.id, booking.hidden)}
                                  className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700">隱藏</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-gray-400 text-sm">此會員尚無預約記錄</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "center":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">會員中心</h2>
            <div className="flex gap-2 flex-wrap mb-4">
              {[
                { id: "count", label: "會員人數" },
                { id: "number", label: "會員編號" },
                { id: "questionnaire", label: "問卷管理" },
                { id: "plan", label: "方案管理" },
                { id: "promo", label: "新增優惠" },
                { id: "payment", label: "高級會員付款平台" },
              ].map(tab => (
                <button key={tab.id} onClick={() => setCenterTab(tab.id)}
                  className={`px-3 py-2 rounded text-sm font-semibold ${centerTab === tab.id ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
              {centerTab === "count" && (
                <div>
                  <p className="text-amber-400 font-semibold text-2xl">{(allUsers as any[]).length}</p>
                  <p className="text-white text-sm mt-1">目前會員總人數</p>
                </div>
              )}
              {/* BUG 18-20: 會員編號查詢 + 會員列表 */}
              {centerTab === "number" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input type="text" value={memberNumSearch} onChange={(e) => setMemberNumSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleMemberNumSearch(); }}
                      placeholder="輸入會員編號或姓名查詢"
                      className="flex-1 px-4 py-2 bg-slate-700 text-white rounded border border-amber-500/30" />
                    <button onClick={handleMemberNumSearch} className="px-4 py-2 bg-amber-600 text-white rounded">確認</button>
                  </div>
                  {memberNumResult && (
                    <div className="bg-slate-700/50 p-4 rounded text-white text-sm space-y-3">
                      <p><span className="text-gray-400">姓名：</span>{memberNumResult.name || "未提供"}</p>
                      <p><span className="text-gray-400">出生年月日：</span>{memberNumResult.birthday || "未提供"}</p>
                      <p><span className="text-gray-400">手機號碼：</span>{memberNumResult.phone || "未提供"}</p>
                      <p><span className="text-gray-400">LINE ID：</span>{memberNumResult.lineId || "未提供"}</p>
                      <p><span className="text-gray-400">會員編號：</span>{memberNumResult.memberNumber || `MEM${String(memberNumResult.id).padStart(4, "0")}`}</p>
                      <div className="border-t border-pink-400/30 pt-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-pink-300">體驗調查表</p>
                            <p className="text-xs text-gray-400">顯示或隱藏此會員前台新提交的調查表</p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => { setShowMemberExperienceSurvey((shown) => !shown); await refetchMemberExperienceSurvey(); }}
                            className={`rounded px-3 py-2 text-sm ${showMemberExperienceSurvey ? "bg-slate-600 text-white" : "bg-pink-600 text-white"}`}
                          >
                            {showMemberExperienceSurvey ? "隱藏調查表" : "顯示調查表"}
                          </button>
                        </div>
                        {showMemberExperienceSurvey && (
                          memberExperienceSurvey ? (
                            <div className="mt-3 space-y-2 rounded bg-slate-800/70 p-3 text-sm">
                              <p><span className="text-gray-400">活動期待：</span>{({ far_exceeds: "遠超預期", exceeds: "超出預期", slightly_below: "略低於預期", not_meet: "不符合預期" } as any)[(memberExperienceSurvey as any).expectation]}</p>
                              <p><span className="text-gray-400">再次參加：</span>{({ definitely: "一定會", probably: "可能會", maybe: "不一定", no: "不會" } as any)[(memberExperienceSurvey as any).attendAgain]}</p>
                              <p><span className="text-gray-400">推薦朋友：</span>{({ definitely: "一定會", probably: "可能會", maybe: "不一定", no: "不會" } as any)[(memberExperienceSurvey as any).recommend]}</p>
                              <p><span className="text-gray-400">特色體驗：</span>{memberExperienceAttractions.length ? memberExperienceAttractions.join("、") : "未選擇"}</p>
                              <p><span className="text-gray-400">活動 MVP：</span>{(memberExperienceSurvey as any).activityMvp || "未填寫"}</p>
                              <p><span className="text-gray-400">最佳氣氛王 MVP：</span>{(memberExperienceSurvey as any).atmosphereMvp || "未填寫"}</p>
                            </div>
                          ) : <p className="mt-3 text-sm text-gray-400">此會員尚未提交體驗調查表</p>
                        )}
                      </div>
                      {/* BUG 20: 完整可編輯欄位 */}
                      <div>
                        <label className="text-gray-400 block mb-1">會員身份</label>
                        <select value={memberNumEdits.memberRole ?? memberNumResult.memberRole ?? "general"}
                          onChange={(e) => {
                            setMemberNumEdits((p: any) => ({ ...p, memberRole: e.target.value }));
                            handleUpdateMember(memberNumResult.id, { memberRole: e.target.value as any });
                          }}
                          className="w-full px-3 py-2 bg-slate-600 text-white rounded">
                          <option value="general">一般會員</option>
                          <option value="friend">親友會員</option>
                          <option value="host">壽星會員</option>
                          <option value="premium">高級會員</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">高級會員狀態</label>
                        <select value={memberNumEdits.premiumStatus ?? memberNumResult.premiumStatus ?? "none"}
                          onChange={(e) => {
                            setMemberNumEdits((p: any) => ({ ...p, premiumStatus: e.target.value }));
                            handleUpdateMember(memberNumResult.id, { premiumStatus: e.target.value as any });
                          }}
                          className="w-full px-3 py-2 bg-slate-600 text-white rounded">
                          <option value="none">未訂閱</option>
                          <option value="subscribed">已訂閱</option>
                          <option value="expired">已到期</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">高級會員付款平台</label>
                        <select defaultValue={memberNumResult.subscriptionPlatform || "restaurant"}
                          onChange={(e) => handleUpdateMember(memberNumResult.id, { subscriptionPlatform: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-600 text-white rounded">
                          <option value="restaurant">餐酒館</option>
                          <option value="google_play">Google Play 商店</option>
                          <option value="app_store">App Store</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">黑卡權益</label>
                        <input type="text" defaultValue={memberNumResult.blackCardBenefit || "全年用餐五折優惠"}
                          onBlur={(e) => handleUpdateMember(memberNumResult.id, { blackCardBenefit: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-600 text-white rounded" />
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">黑卡卡號</label>
                        <input type="text" defaultValue={memberNumResult.blackCardNo || ""}
                          onBlur={(e) => handleUpdateMember(memberNumResult.id, { blackCardNo: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-600 text-white rounded" />
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">黑卡圖片</label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            id={`black-card-image-${memberNumResult.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              if (file.size > 10 * 1024 * 1024) { toast.error("圖片大小不能超過 10MB"); return; }
                              const reader = new FileReader();
                              reader.onload = async () => {
                                try {
                                  const base64 = String(reader.result || "").split(",")[1] || "";
                                  const { url } = await uploadBlackCardImageMut.mutateAsync({ base64, contentType: file.type, filename: file.name });
                                  await handleUpdateMember(memberNumResult.id, { blackCardImageUrl: url, blackCardImageVisible: true });
                                  toast.success("黑卡圖片已更新");
                                } catch { toast.error("黑卡圖片上傳失敗"); }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                          <label htmlFor={`black-card-image-${memberNumResult.id}`} className="cursor-pointer rounded bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700">選擇圖片</label>
                          <button
                            type="button"
                            onClick={() => handleUpdateMember(memberNumResult.id, { blackCardImageVisible: true })}
                            className={`rounded px-3 py-2 text-sm ${memberNumResult.blackCardImageVisible !== false ? "bg-green-600 text-white" : "bg-slate-600 text-gray-300"}`}
                          >
                            ● 顯示
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateMember(memberNumResult.id, { blackCardImageVisible: false })}
                            className={`rounded px-3 py-2 text-sm ${memberNumResult.blackCardImageVisible === false ? "bg-slate-600 text-white" : "bg-slate-700 text-gray-300"}`}
                          >
                            ○ 隱藏
                          </button>
                          {memberNumResult.blackCardImageUrl && (
                            <button
                              type="button"
                              onClick={() => handleUpdateMember(memberNumResult.id, { blackCardImageUrl: "", blackCardImageVisible: true })}
                              className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                            >
                              刪除
                            </button>
                          )}
                        </div>
                        {memberNumResult.blackCardImageUrl && <img src={memberNumResult.blackCardImageUrl} alt="黑卡預覽" className="mt-3 max-h-32 rounded border border-amber-500/30 object-contain" />}
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">黑卡取得方式</label>
                        <select value={memberNumEdits.blackCardMethod ?? memberNumResult.blackCardMethod ?? "none"}
                          onChange={(e) => {
                            setMemberNumEdits((p: any) => ({ ...p, blackCardMethod: e.target.value }));
                            handleUpdateMember(memberNumResult.id, { blackCardMethod: e.target.value as any });
                          }}
                          className="w-full px-3 py-2 bg-slate-600 text-white rounded">
                          <option value="none">未取得</option>
                          <option value="host">壽星</option>
                          <option value="friend">親友</option>
                          <option value="subscription">訂閱</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">黑卡取得日期</label>
                        <input type="date" defaultValue={memberNumResult.blackCardDate || ""}
                          onBlur={(e) => handleUpdateMember(memberNumResult.id, { blackCardDate: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-600 text-white rounded" />
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">黑卡到期日</label>
                        <input type="date" defaultValue={memberNumResult.blackCardExpiry || ""}
                          onBlur={(e) => handleUpdateMember(memberNumResult.id, { blackCardExpiry: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-600 text-white rounded" />
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">訂閱日期</label>
                        <input type="date" defaultValue={memberNumResult.premiumStartDate || ""}
                          onBlur={(e) => handleUpdateMember(memberNumResult.id, { premiumStartDate: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-600 text-white rounded" />
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">訂閱到期日</label>
                        <input type="date" defaultValue={memberNumResult.premiumEndDate || ""}
                          onBlur={(e) => handleUpdateMember(memberNumResult.id, { premiumEndDate: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-600 text-white rounded" />
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">自動續訂狀態</label>
                        <select defaultValue={memberNumResult.appAutoRenew ? "true" : "false"}
                          onChange={(e) => handleUpdateMember(memberNumResult.id, { appAutoRenew: e.target.value === "true" })}
                          className="w-full px-3 py-2 bg-slate-600 text-white rounded">
                          <option value="false">未開啟</option>
                          <option value="true">已開啟</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">取消訂閱狀態</label>
                        <input type="text" defaultValue={memberNumResult.appCancelStatus || ""}
                          onBlur={(e) => handleUpdateMember(memberNumResult.id, { appCancelStatus: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-600 text-white rounded" />
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">新增優惠</label>
                        <input type="text" defaultValue={memberNumResult.appPromo || ""}
                          onBlur={(e) => handleUpdateMember(memberNumResult.id, { appPromo: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-600 text-white rounded" />
                      </div>
                      <p className="text-gray-500 text-xs mt-2">以上欄位目前由後台管理，未來 App 可串接 Google Play / App Store 自動同步</p>
                    </div>
                  )}
                  {memberNumResult === null && memberNumSearch && <p className="text-gray-400 text-center text-sm">查無此會員</p>}
                  {/* BUG 20: 會員列表依加入時間顯示 */}
                  <div className="mt-6 border-t border-amber-500/20 pt-4">
                    <h4 className="text-amber-400 font-semibold mb-3">全部會員列表</h4>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {(allUsers as any[]).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((user: any) => (
                        <div key={user.id} className="bg-slate-700/50 p-3 rounded text-sm text-white flex items-center justify-between cursor-pointer hover:bg-slate-700/80"
                          onClick={() => { setMemberNumResult(user); setMemberNumEdits({}); setShowMemberExperienceSurvey(false); }}>
                          <div>
                            <span className="font-semibold">{user.name || "未命名"}</span>
                            <span className="text-gray-400 ml-2 text-xs">{user.memberNumber || ""}</span>
                          </div>
                          <span className="text-gray-400 text-xs">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("zh-TW") : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {centerTab === "questionnaire" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-semibold text-pink-300">問卷管理</h3>
                    <p className="mt-1 text-sm text-gray-400">本分店已提交問卷：{experienceSurveyStats?.total ?? 0} 份。百分比以本分店已提交問卷總數計算；多選特色體驗各自以提交總數計算。</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      ["活動有沒有超出期待", experienceSurveyStats?.expectation],
                      ["願不願意再次參加", experienceSurveyStats?.attendAgain],
                      ["願不願意推薦朋友", experienceSurveyStats?.recommend],
                    ].map(([label, values]: any) => (
                      <div key={label} className="rounded border border-pink-400/30 bg-slate-700/50 p-4">
                        <p className="font-semibold text-white">{label}</p>
                        <p className="mt-2 text-pink-300">有／是：{values?.yes ?? 0}％</p>
                        <p className="text-gray-300">否：{values?.no ?? 0}％</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded border border-pink-400/30 bg-slate-700/50 p-4">
                    <p className="mb-3 font-semibold text-white">客人真正被什麼吸引：</p>
                    <div className="grid gap-2 text-sm md:grid-cols-3">
                      {["包場慶生", "團隊遊戲", "當一日餐酒館老闆", "美食", "賺錢機制", "任務挑戰", "營業王競賽", "調酒", "壽星與朋友共同完成活動"].map((item) => (
                        <p key={item} className="text-gray-200">{item}　<span className="text-pink-300">{(experienceSurveyStats?.attractions as any)?.[item] ?? 0}％</span></p>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">期待：遠超預期、超出預期＝有；略低於預期、不符合預期＝否。再次參加與推薦：一定會、可能會＝是；不一定、不會＝否。</p>
                </div>
              )}
              {/* BUG 21: 方案管理 — 與會員訂閱同步 */}
              {centerTab === "plan" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white">高級會員方案</span>
                    <button onClick={() => { handleSettingChange("premiumPlanVisible", !localSettings?.premiumPlanVisible); handleSaveSettings(); }}
                      className={`px-3 py-1 rounded text-sm ${localSettings?.premiumPlanVisible ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300"}`}>
                      {localSettings?.premiumPlanVisible ? "顯示" : "隱藏"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">新人優惠</span>
                    <button onClick={() => { handleSettingChange("newcomerPlanVisible", !localSettings?.newcomerPlanVisible); handleSaveSettings(); }}
                      className={`px-3 py-1 rounded text-sm ${localSettings?.newcomerPlanVisible ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300"}`}>
                      {localSettings?.newcomerPlanVisible ? "顯示" : "隱藏"}
                    </button>
                  </div>
                  <div>
                    <label className="text-white text-sm block mb-1">月費價格</label>
                    <input type="number" value={localSettings?.premiumPrice ?? 600}
                      onChange={(e) => handleSettingChange("premiumPrice", parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-amber-500/30" />
                  </div>
                  <p className="text-gray-400 text-xs">方案管理與會員訂閱資料同步，修改後會員前台即時更新</p>
                  <button onClick={handleSaveSettings} className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">保存</button>
                </div>
              )}
              {/* BUG 23: 新增優惠 — 與會員資訊同步 */}
              {centerTab === "promo" && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm mb-2">新增優惠與會員資訊同步，可於會員資料中顯示。請在「會員編號」分頁中搜尋會員後，於「新增優惠」欄位輸入。</p>
                  <textarea placeholder="輸入全站優惠公告內容" value={promoText} onChange={(e) => setPromoText(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-amber-500/30 min-h-[100px]" />
                  <div className="flex items-center gap-4">
                    <button onClick={() => setPromoVisible(true)}
                      className={`px-4 py-2 rounded text-sm ${promoVisible ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>顯示</button>
                    <button onClick={() => setPromoVisible(false)}
                      className={`px-4 py-2 rounded text-sm ${!promoVisible ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>隱藏</button>
                  </div>
                  <button onClick={() => toast.success("優惠內容已保存")} className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">保存</button>
                  <p className="text-gray-500 text-xs mt-2">高級會員狀態目前由後台管理，未來 App 上線後，Google Play 與 App Store 訂閱結果需同步更新會員訂閱狀態</p>
                </div>
              )}
              {centerTab === "payment" && (
                <div className="space-y-4">
                  <p className="text-amber-400 font-semibold">高級會員付款平台</p>
                  <select value={localSettings?.paymentPlatform || "restaurant"}
                    onChange={(e) => { handleSettingChange("paymentPlatform", e.target.value); handleSaveSettings(); }}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-amber-500/30">
                    <option value="restaurant">餐酒館</option>
                    <option value="google_play">Google Play 商店</option>
                    <option value="app_store">App Store</option>
                  </select>
                  <p className="text-gray-500 text-xs mt-2">高級會員狀態目前由後台管理，未來 App 上線後，Google Play 與 App Store 訂閱結果需同步更新會員訂閱狀態</p>
                </div>
              )}
            </div>
          </div>
        );


      case "videos": {
        const filteredVideos = (allShortVideos as any[]).filter((v: any) => {
          if (!videoSearchQuery) return true;
          const q = videoSearchQuery.toLowerCase();
          return (v.position || "").toLowerCase().includes(q) || (v.angle || "").toLowerCase().includes(q) || (v.videoUrl || "").toLowerCase().includes(q);
        });
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">影片管理</h2>
            <p className="text-gray-300 mb-4">集中管理所有上傳的短影音（共 {(allShortVideos as any[]).length} 支）</p>
            <input type="text" value={videoSearchQuery} onChange={(e) => setVideoSearchQuery(e.target.value)}
              placeholder="搜尋（職位、分鏡、網址）"
              className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-amber-500/30 mb-4" />
            {/* BUG 4: Batch select & delete toolbar */}
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                <input type="checkbox"
                  checked={filteredVideos.length > 0 && filteredVideos.every((v: any) => selectedVideoIds.has(v.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedVideoIds(new Set(filteredVideos.map((v: any) => v.id)));
                    } else {
                      setSelectedVideoIds(new Set());
                    }
                  }}
                  className="w-4 h-4" />
                全選
              </label>
              {selectedVideoIds.size > 0 && (
                <button onClick={async () => {
                  if (!confirm(`確定要刪除選取的 ${selectedVideoIds.size} 支影片？`)) return;
                  try {
                    await batchDeleteVideoMut.mutateAsync({ ids: Array.from(selectedVideoIds) });
                    toast.success(`已刪除 ${selectedVideoIds.size} 支影片`);
                    setSelectedVideoIds(new Set());
                    refetchAllVideos();
                  } catch { toast.error("批次刪除失敗"); }
                }}
                  className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                  批次刪除（{selectedVideoIds.size}）
                </button>
              )}
              {selectedVideoIds.size > 0 && (
                <button onClick={() => setSelectedVideoIds(new Set())}
                  className="px-3 py-2 bg-slate-600 text-white rounded text-sm hover:bg-slate-500">取消選取</button>
              )}
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {filteredVideos.length === 0 && <p className="text-gray-400 text-center py-8">無影片資料</p>}
              {filteredVideos.map((vid: any) => (
                <div key={vid.id} className={`bg-slate-800/50 p-4 rounded border flex items-center justify-between gap-3 ${selectedVideoIds.has(vid.id) ? "border-red-500/50 bg-red-900/10" : "border-amber-500/30"}`}>
                  <input type="checkbox"
                    checked={selectedVideoIds.has(vid.id)}
                    onChange={(e) => {
                      const next = new Set(selectedVideoIds);
                      if (e.target.checked) next.add(vid.id); else next.delete(vid.id);
                      setSelectedVideoIds(next);
                    }}
                    className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">{vid.position} — {vid.angle}</p>
                    <p className="text-gray-400 text-xs truncate">{vid.videoUrl || "無網址"}</p>
                    {vid.eventId && <p className="text-gray-500 text-xs">活動 ID: {vid.eventId}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {vid.videoUrl && (
                      <>
                        <button onClick={() => { const fullUrl = vid.videoUrl.startsWith("http") ? vid.videoUrl : window.location.origin + vid.videoUrl; setVideoPreviewUrl(fullUrl); }}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">預覽</button>
                        <a href={`/api/download-video?fileKey=${encodeURIComponent(vid.fileKey || vid.videoUrl.replace("/manus-storage/", ""))}&filename=${encodeURIComponent(`${vid.position}_${vid.angle}.mp4`)}`}
                          download className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 no-underline inline-block">下載</a>
                      </>
                    )}
                    <button onClick={async () => {
                      if (!confirm("確定要刪除此影片？")) return;
                      try { await deleteVideoMut.mutateAsync({ id: vid.id }); toast.success("已刪除"); refetchAllVideos(); } catch { toast.error("刪除失敗"); }
                    }} className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">刪除</button>
                  </div>
                </div>
              ))}
            </div>
            {videoPreviewUrl && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setVideoPreviewUrl(null)}>
                <div className="bg-slate-900 rounded-lg p-4 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                  <video src={videoPreviewUrl} controls autoPlay className="w-full max-h-[70vh] rounded" />
                  <button onClick={() => setVideoPreviewUrl(null)} className="mt-3 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 w-full">關閉</button>
                </div>
              </div>
            )}
          </div>
        );
      }

      // ── 第16批次-8: 體驗牆管理（活動圖片/活動影片，多檔上傳/預覽/刪除） ──
      case "experience": {
        return <ExperienceWallAdmin branchId={loginBranchId} />;
      }

      case "npc": {
        const NPC_TYPES = [
          { type: "influencer", label: "A. 網紅", category: "互動NPC" },
          { type: "kol", label: "B. KOL", category: "互動NPC" },
          { type: "anchor", label: "C. 主播", category: "互動NPC" },
          { type: "artist", label: "D. 藝人", category: "人氣NPC" },
          { type: "band", label: "E. 樂團", category: "人氣NPC" },
          { type: "singer", label: "F. 歌手", category: "人氣NPC" },
        ];
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">NPC 管理</h2>
            <p className="text-gray-300 mb-2">管理前台「我的 NPC」頁面的角色圖片與描述（與前台同步）</p>
            <p className="text-green-400 text-xs mb-4">✓ 圖片上傳後即時同步至前台「我的 NPC」頁面顯示</p>
            <div className="space-y-4">
              {NPC_TYPES.map((npcType) => {
                const item = (npcItems2 as any[]).find((n: any) => n.type === npcType.type);
                return (
                  <div key={npcType.type} className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
                    <h3 className="text-amber-400 font-semibold mb-1">{npcType.label}</h3>
                    <p className="text-gray-500 text-xs mb-3">{npcType.category}</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-white text-sm mb-2">描述</label>
                        <textarea defaultValue={item?.description || ""}
                          onBlur={(e) => {
                            const label = npcType.label.replace(/^[A-F]\.\s*/, "");
                            if (item) { upsertNpcMut.mutate({ branchId: loginBranchId, id: item.id, type: npcType.type, label, description: e.target.value }); }
                            else { upsertNpcMut.mutate({ branchId: loginBranchId, type: npcType.type, label, description: e.target.value }); }
                            setTimeout(() => refetchNpc(), 500);
                          }}
                          className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-amber-500/30" />
                      </div>
                      <MultiImageManager entityType="npc" entityKey={npcType.type} label="圖片上傳（可多張）" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }


      case "banners": {
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">首頁輪播圖管理</h2>
            <p className="text-gray-300 mb-2">管理首頁主視覺圖片區（至少可上傳 6 張）</p>
            <p className="text-green-400 text-xs mb-4">✓ 上傳後即時同步至首頁輪播顯示</p>

            {/* BUG 11: Upload with preview */}
            <div className="bg-slate-800/50 p-4 rounded border border-amber-500/30 mb-4">
              <label className="block text-white text-sm mb-2">上傳新圖片（單張可預覽調整）</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) { toast.error("圖片大小不能超過 10MB"); return; }
                const reader = new FileReader();
                reader.onload = () => {
                  setBannerPreview(reader.result as string);
                  setBannerPreviewFile(file);
                };
                reader.readAsDataURL(file);
              }} className="text-white text-sm" />
              <label className="block text-white text-sm mb-2 mt-4">批次上傳（可一次選擇多張）</label>
              <input type="file" accept="image/*" multiple onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                let count = 0;
                for (const file of Array.from(files)) {
                  if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} 超過 10MB，已略過`); continue; }
                  try {
                    await new Promise<void>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = async () => {
                        try {
                          const base64 = (reader.result as string).split(",")[1];
                          const res = await uploadBannerMut.mutateAsync({ base64, contentType: file.type, filename: file.name });
                          await addBannerMut.mutateAsync({ branchId: loginBranchId, imageUrl: res.url, sortOrder: (bannerList as any[]).length + count });
                          count++;
                          resolve();
                        } catch (err) { reject(err); }
                      };
                      reader.onerror = () => reject(new Error("讀取失敗"));
                      reader.readAsDataURL(file);
                    });
                  } catch { toast.error(`${file.name} 上傳失敗`); }
                }
                if (count > 0) toast.success(`已上傳 ${count} 張圖片`);
                refetchBanners();
                (e.target as HTMLInputElement).value = "";
              }} className="text-white text-sm" />
              {/* BUG 2: Preview area with finger pinch zoom */}
              {bannerPreview && (
                <div className="mt-3 border border-amber-500/30 rounded p-3">
                  <p className="text-gray-300 text-xs mb-2">預覽（手指縮放移動調整後確認上傳）</p>
                  <div className="relative overflow-hidden rounded" style={{ aspectRatio: "1.414/1", maxHeight: 300, touchAction: "none" }}
                    onTouchStart={(e) => {
                      if (e.touches.length === 2) {
                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                        (e.currentTarget as any)._lastDist = Math.sqrt(dx * dx + dy * dy);
                      } else if (e.touches.length === 1) {
                        (e.currentTarget as any)._lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                      }
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      const el = e.currentTarget as any;
                      if (e.touches.length === 2 && el._lastDist) {
                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const delta = (dist - el._lastDist) * 0.005;
                        setBannerPreviewScale(s => Math.max(0.5, Math.min(5, s + delta)));
                        el._lastDist = dist;
                      } else if (e.touches.length === 1 && el._lastTouch) {
                        const dx = e.touches[0].clientX - el._lastTouch.x;
                        const dy = e.touches[0].clientY - el._lastTouch.y;
                        setBannerPreviewPos(p => ({ x: p.x + dx, y: p.y + dy }));
                        el._lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                      }
                    }}
                    onTouchEnd={() => { /* reset handled by browser */ }}
                    onWheel={(e) => { e.preventDefault(); setBannerPreviewScale(s => Math.max(0.5, Math.min(5, s + (e.deltaY > 0 ? -0.1 : 0.1)))); }}
                  >
                    <img src={bannerPreview} alt="預覽" className="w-full h-full object-cover" style={{ transform: `scale(${bannerPreviewScale}) translate(${bannerPreviewPos.x}px, ${bannerPreviewPos.y}px)`, transition: "transform 0.1s ease-out", transformOrigin: "center" }} draggable={false} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => setBannerPreviewScale(s => Math.min(5, s + 0.2))} className="px-2 py-1 bg-slate-700 text-white rounded text-xs">+</button>
                    <button onClick={() => setBannerPreviewScale(s => Math.max(0.5, s - 0.2))} className="px-2 py-1 bg-slate-700 text-white rounded text-xs">−</button>
                    <span className="text-gray-400 text-xs">{Math.round(bannerPreviewScale * 100)}%</span>
                    <button onClick={() => { setBannerPreviewScale(1); setBannerPreviewPos({ x: 0, y: 0 }); }} className="px-2 py-1 bg-slate-700 text-white rounded text-xs">重置</button>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">手指縮放 ｜ 拖曳移動 ｜ 滾輪縮放</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={async () => {
                      if (!bannerPreviewFile) return;
                      try {
                        const base64 = bannerPreview.split(",")[1];
                        const res = await uploadBannerMut.mutateAsync({ base64, contentType: bannerPreviewFile.type, filename: bannerPreviewFile.name });
                        await addBannerMut.mutateAsync({ branchId: loginBranchId, imageUrl: res.url, sortOrder: (bannerList as any[]).length });
                        toast.success("圖片已上傳");
                        setBannerPreview(null);
                        setBannerPreviewFile(null);
                        setBannerPreviewScale(1);
                        setBannerPreviewPos({ x: 0, y: 0 });
                        refetchBanners();
                      } catch { toast.error("上傳失敗"); }
                    }} className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">確認上傳</button>
                    <button onClick={() => { setBannerPreview(null); setBannerPreviewFile(null); setBannerPreviewScale(1); setBannerPreviewPos({ x: 0, y: 0 }); }}
                      className="px-4 py-2 bg-slate-600 text-white rounded text-sm hover:bg-slate-700">取消</button>
                  </div>
                </div>
              )}
            </div>

            {/* BUG 10: Banner grid with visible delete button */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(bannerList as any[]).map((banner: any, idx: number) => (
                <div key={banner.id} className="relative group bg-slate-800/50 rounded border border-amber-500/30 overflow-hidden">
                  <img src={banner.imageUrl} alt={`Banner ${idx + 1}`} className="w-full h-40 object-cover" />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">#{idx + 1}</div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    {idx > 0 && (
                      <button onClick={async () => {
                        const items = (bannerList as any[]).map((b: any, i: number) => ({ id: b.id, sortOrder: i }));
                        const temp = items[idx].sortOrder; items[idx].sortOrder = items[idx-1].sortOrder; items[idx-1].sortOrder = temp;
                        await updateBannerOrderMut.mutateAsync({ items });
                        refetchBanners();
                      }} className="w-7 h-7 bg-blue-600 text-white rounded text-xs flex items-center justify-center">↑</button>
                    )}
                    {idx < (bannerList as any[]).length - 1 && (
                      <button onClick={async () => {
                        const items = (bannerList as any[]).map((b: any, i: number) => ({ id: b.id, sortOrder: i }));
                        const temp = items[idx].sortOrder; items[idx].sortOrder = items[idx+1].sortOrder; items[idx+1].sortOrder = temp;
                        await updateBannerOrderMut.mutateAsync({ items });
                        refetchBanners();
                      }} className="w-7 h-7 bg-blue-600 text-white rounded text-xs flex items-center justify-center">↓</button>
                    )}
                    <button onClick={async () => {
                      if (!confirm("確定刪除此圖片？")) return;
                      await deleteBannerMut.mutateAsync({ id: banner.id });
                      toast.success("已刪除");
                      refetchBanners();
                    }} className="w-7 h-7 bg-red-600 text-white rounded text-xs flex items-center justify-center" title="刪除圖片">✕</button>
                  </div>
                </div>
              ))}
            </div>
            {(bannerList as any[]).length === 0 && <p className="text-gray-400 text-center py-8">尚未上傳任何輪播圖片</p>}

            {/* BUG 5: Auto-play and pause controls (moved from homepage) */}
            <div className="bg-slate-800/50 p-4 rounded border border-amber-500/30 mt-6">
              <h3 className="text-white font-semibold mb-3">播放管理</h3>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-gray-300 text-sm">自動循環播放：</span>
                <button onClick={async () => {
                  await updateSettingsMut.mutateAsync({ branchId: loginBranchId, bannerAutoPlay: !(systemSettings as any)?.bannerAutoPlay });
                  refetchSettings();
                  toast.success("已更新");
                }} className={`px-4 py-2 rounded text-sm font-medium ${(systemSettings as any)?.bannerAutoPlay !== false ? "bg-green-600 text-white" : "bg-slate-600 text-gray-300"}`}>
                  {(systemSettings as any)?.bannerAutoPlay !== false ? "▶ 播放中" : "⏸ 已暫停"}
                </button>
              </div>
              <p className="text-gray-500 text-xs">控制首頁輪播圖是否自動循環播放（每 4 秒切換一張）</p>
              <div className="mt-4 border-t border-slate-700 pt-4">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-gray-300 text-sm">門店社群圖標：</span>
                  <button onClick={async () => {
                    await updateSettingsMut.mutateAsync({ branchId: loginBranchId, storeSelectSocialIconsVisible: (systemSettings as any)?.storeSelectSocialIconsVisible === false });
                    refetchSettings();
                    toast.success("門店社群圖標顯示設定已更新");
                  }} className={`px-4 py-2 rounded text-sm font-medium ${(systemSettings as any)?.storeSelectSocialIconsVisible !== false ? "bg-green-600 text-white" : "bg-slate-600 text-gray-300"}`}>
                    {(systemSettings as any)?.storeSelectSocialIconsVisible !== false ? "顯示中" : "已隱藏"}
                  </button>
                </div>
                <p className="text-gray-500 text-xs">控制前台門店選擇頁最下方的 LINE、Instagram、TikTok、Facebook 圖標與原有社群連結。</p>
              </div>
            </div>

            {/* BUG 8-9: Parallax scrolling toggle */}
            <div className="bg-slate-800/50 p-4 rounded border border-amber-500/30 mt-4">
              <h3 className="text-white font-semibold mb-3">網站視差滾動</h3>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-gray-300 text-sm">視差滾動效果：</span>
                <button onClick={async () => {
                  await updateSettingsMut.mutateAsync({ branchId: loginBranchId, parallaxEnabled: !(systemSettings as any)?.parallaxEnabled });
                  refetchSettings();
                  toast.success("已更新");
                }} className={`px-4 py-2 rounded text-sm font-medium ${(systemSettings as any)?.parallaxEnabled ? "bg-green-600 text-white" : "bg-slate-600 text-gray-300"}`}>
                  {(systemSettings as any)?.parallaxEnabled ? "已啟用" : "未啟用"}
                </button>
              </div>
              <p className="text-gray-500 text-xs">頁面滾動時，圖片稍停 0.5 秒再隨即跟上，產生視覺落差效果</p>
            </div>

            {/* 第33批次：獨立黑金特效顯示／隱藏，避免與視差位移設定混用 */}
            <div className="bg-slate-800/50 p-4 rounded border border-amber-500/30 mt-4">
              <h3 className="text-white font-semibold mb-3">黑金特效</h3>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-gray-300 text-sm">顯示／隱藏：</span>
                <button onClick={async () => {
                  await updateSettingsMut.mutateAsync({ branchId: loginBranchId, blackGoldEffect: !(systemSettings as any)?.blackGoldEffect });
                  refetchSettings();
                  toast.success("已更新");
                }} className={`px-4 py-2 rounded text-sm font-medium ${(systemSettings as any)?.blackGoldEffect ? "bg-green-600 text-white" : "bg-slate-600 text-gray-300"}`}>
                  {(systemSettings as any)?.blackGoldEffect ? "顯示中" : "已隱藏"}
                </button>
              </div>
              <p className="text-gray-500 text-xs">控制首頁金色粒子、金色光暈與漸層標題效果；不影響網站視差滾動位移</p>
            </div>

            {/* 第15批次-7/8: 玻璃雨滴特效＋輪播轉場特效（同一開關） */}
            <div className="bg-slate-800/50 p-4 rounded border border-amber-500/30 mt-4">
              <h3 className="text-white font-semibold mb-3">玻璃雨滴特效</h3>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-gray-300 text-sm">顯示／隱藏：</span>
                <button onClick={async () => {
                  await updateSettingsMut.mutateAsync({ branchId: loginBranchId, rainEffect: (systemSettings as any)?.rainEffect === false });
                  refetchSettings();
                  toast.success("已更新");
                }} className={`px-4 py-2 rounded text-sm font-medium ${(systemSettings as any)?.rainEffect !== false ? "bg-green-600 text-white" : "bg-slate-600 text-gray-300"}`}>
                  {(systemSettings as any)?.rainEffect !== false ? "顯示中" : "已隱藏"}
                </button>
              </div>
              <p className="text-gray-500 text-xs">開啟後首頁呈現雨滴滑落半透明玻璃的視覺特效，並同時啟用輪播圖切換轉場特效；隱藏則兩者一併關閉</p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded border border-amber-500/30 mt-4">
              <h3 className="text-white font-semibold mb-3">門店選擇頁logo特效</h3>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-gray-300 text-sm">顯示／隱藏：</span>
                <button onClick={async () => {
                  await updateSettingsMut.mutateAsync({ branchId: loginBranchId, storeSelectFlameEffect: (systemSettings as any)?.storeSelectFlameEffect === false });
                  await refetchSettings();
                  toast.success("門店選擇頁火焰特效已更新");
                }} className={`px-4 py-2 rounded text-sm font-medium ${(systemSettings as any)?.storeSelectFlameEffect !== false ? "bg-green-600 text-white" : "bg-slate-600 text-gray-300"}`}>
                  {(systemSettings as any)?.storeSelectFlameEffect !== false ? "顯示中" : "已隱藏"}
                </button>
              </div>
              <div className="border-t border-slate-700 pt-3">
                <span className="mb-2 block text-gray-300 text-sm">logo顏色：</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "orange", label: "原始橙黃", preview: "bg-amber-400" },
                    { value: "pink", label: "粉紅色", preview: "bg-pink-300" },
                    { value: "blue", label: "粉藍色", preview: "bg-sky-300" },
                    { value: "cyan", label: "粉青色", preview: "bg-cyan-300" },
                    { value: "purple", label: "粉紫色", preview: "bg-purple-300" },
                    { value: "rainbow", label: "彩色", preview: "bg-gradient-to-r from-pink-300 via-cyan-300 to-purple-300" },
                  ].map((color) => {
                    const selected = ((systemSettings as any)?.storeSelectFlameColor ?? "orange") === color.value;
                    return (
                      <button
                        key={color.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={async () => {
                          await updateSettingsMut.mutateAsync({ branchId: loginBranchId, storeSelectFlameColor: color.value as "orange" | "pink" | "blue" | "cyan" | "purple" | "rainbow" });
                          await refetchSettings();
                          toast.success(`蛋糕logo圖標變色選項已切換為${color.label}`);
                        }}
                        className={`flex items-center gap-2 rounded border px-3 py-2 text-sm transition-colors ${selected ? "border-amber-300 bg-amber-500/20 text-white" : "border-slate-600 bg-slate-900/50 text-gray-300 hover:border-amber-400/60"}`}
                      >
                        <span className={`h-3 w-3 rounded-full ${color.preview}`} aria-hidden="true" />
                        {color.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-gray-500 text-xs">控制前台門店選擇頁的Logo動畫特效；隱藏時保留蛋糕Logo、文字、背景與門店入口。</p>
            </div>
          </div>
        );
      }
      case "rituals": {
        const ritualTypes = [
          { key: "wish", label: "心願招喚儀式" },
          { key: "korean", label: "韓式咒印儀式" },
          { key: "chinese", label: "中式符印儀式" },
        ];
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">慶生儀式管理</h2>
            <p className="text-gray-300 mb-4">管理 3 種慶生儀式圖片（前台「慶生儀式介紹」頁面顯示，可上傳多張，前台以輪播顯示）</p>
            {ritualTypes.map((rt) => (
              <div key={rt.key} className="bg-slate-800/50 p-4 rounded border border-amber-500/30">
                <h3 className="text-amber-400 font-semibold mb-3">{rt.label}</h3>
                <MultiImageManager entityType="ritual" entityKey={rt.key} label="圖片上傳（可多張）" showVisibilityToggle />
              </div>
            ))}
          </div>
        );
      }
      // 第13批次-13: 我的SOP管理
      case "sop": {
        const sopCats = [
          { id: "time", label: "A. 時間流程", subs: [{ key: "day", label: "日間場" }, { key: "night", label: "晚間場" }] },
          { id: "food", label: "B. 餐酒", subs: [{ key: "meal", label: "餐點" }, { key: "cocktail", label: "調酒" }] },
          { id: "ritual", label: "C. 儀式活動", subs: [{ key: "birthday", label: "慶生儀式" }, { key: "surprise", label: "驚喜典禮" }, { key: "handover", label: "交接儀式" }, { key: "award", label: "營業王頒獎" }] },
          { id: "special", label: "D. 特殊任務", subs: [{ key: "game", label: "特殊遊戲" }, { key: "event", label: "特殊事件" }] },
        ];
        const activeSopCat = sopCategory ? sopCats.find((c) => c.id === sopCategory) : null;
        const subImages = sopSub ? (sopImages as any[]).filter((img: any) => img.entityKey === sopSub) : [];
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">我的SOP管理</h2>
            <p className="text-gray-300 mb-4">管理前台「我的SOP」頁面圖片（上傳後前台立即同步顯示）</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {sopCats.map((cat) => (
                <button key={cat.id}
                  onClick={() => { setSopCategory(sopCategory === cat.id ? null : cat.id); setSopSub(null); }}
                  className={`px-4 py-3 rounded font-semibold text-sm ${sopCategory === cat.id ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}>
                  {cat.label}
                </button>
              ))}
            </div>
            {activeSopCat && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeSopCat.subs.map((sub) => (
                  <button key={sub.key}
                    onClick={() => setSopSub(sopSub === sub.key ? null : sub.key)}
                    className={`px-4 py-2 rounded text-sm ${sopSub === sub.key ? "bg-pink-600 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}>
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
            {sopSub && (
              <div className="bg-slate-800/50 p-4 rounded border border-amber-500/30 space-y-3">
                <label className="inline-block px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm cursor-pointer">
                  選擇圖片
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async () => {
                      const base64 = (reader.result as string).split(",")[1];
                      try {
                        await uploadEntityImageMut.mutateAsync({ branchId: loginBranchId, entityType: "sop", entityKey: sopSub, base64, contentType: file.type, filename: file.name, sortOrder: subImages.length });
                        toast.success("圖片已上傳，前台已同步");
                        refetchSopImages();
                      } catch { toast.error("上傳失敗"); }
                    };
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }} />
                </label>
                {subImages.length === 0 ? (
                  <p className="text-gray-400 text-sm">尚未上傳圖片</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {subImages.map((img: any) => (
                      <div key={img.id} className="relative bg-slate-900/60 rounded p-2">
                        <img src={img.imageUrl} alt="SOP" className="w-full h-32 object-contain rounded" />
                        <button
                          onClick={async () => {
                            if (!confirm("確定要刪除此圖片？")) return;
                            try { await deleteEntityImageMut.mutateAsync({ id: img.id }); toast.success("已刪除"); refetchSopImages(); } catch { toast.error("刪除失敗"); }
                          }}
                          className="absolute top-1 right-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">刪除</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* 第13批次-13: 最下方 我的SOP 顯示/隱藏（同步前台主功能表） */}
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30 mt-6">
              <h3 className="text-amber-400 font-semibold mb-4">我的SOP 顯示／隱藏</h3>
              <div className="flex items-center gap-4">
                <button onClick={async () => { try { await updateSettingsMut.mutateAsync({ branchId: loginBranchId, sopVisible: true } as any); refetchSettings(); toast.success("已設為顯示"); } catch { toast.error("設定失敗"); } }}
                  className={`px-4 py-2 rounded text-sm ${(systemSettings as any)?.sopVisible !== false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 顯示</button>
                <button onClick={async () => { try { await updateSettingsMut.mutateAsync({ branchId: loginBranchId, sopVisible: false } as any); refetchSettings(); toast.success("已設為隱藏"); } catch { toast.error("設定失敗"); } }}
                  className={`px-4 py-2 rounded text-sm ${(systemSettings as any)?.sopVisible === false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>○ 隱藏</button>
              </div>
              <p className="text-gray-400 text-xs mt-2">控制前台主功能表「我的SOP」按鈕的顯示或隱藏</p>
            </div>
          </div>
        );
      }
      // 第13批次-15: 分店管理（由系統設定→版本資訊→帳密驗證進入）
      case "branches": {
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">分店管理</h2>
            <p className="text-gray-300 mb-4">新增分店後，即可以「城市＋地區＋帳號＋密碼」登入品牌管理，各分店資料獨立分類</p>
            {/* 第14批次-7: 總部儀表板 */}
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30 space-y-4">
              <h3 className="text-amber-400 font-semibold text-lg">總部儀表板</h3>
              <div>
                <h4 className="text-white font-semibold mb-2">總覽</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-slate-900/60 rounded p-4 text-center">
                    <p className="text-gray-400 text-xs mb-1">全台預約總數</p>
                    <p className="text-amber-300 text-2xl font-bold">{hqSummary?.totalBookings ?? 0}</p>
                  </div>
                  <div className="bg-slate-900/60 rounded p-4 text-center">
                    <p className="text-gray-400 text-xs mb-1">今日預約總數</p>
                    <p className="text-amber-300 text-2xl font-bold">{hqSummary?.todayBookings ?? 0}</p>
                  </div>
                  <div className="bg-slate-900/60 rounded p-4 text-center col-span-2 md:col-span-1">
                    <p className="text-gray-400 text-xs mb-1">總營收</p>
                    <p className="text-blue-400 text-2xl font-bold">NT${(hqSummary?.totalRevenue ?? 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-3 bg-slate-900/60 rounded p-4">
                  <p className="text-gray-400 text-xs mb-2">各分店排名（依營收）</p>
                  {(hqSummary?.branches ?? []).length === 0 ? (
                    <p className="text-gray-500 text-sm">尚無分店資料</p>
                  ) : (
                    <div className="space-y-1">
                      {(hqSummary?.branches ?? []).map((b: any, i: number) => (
                        <div key={b.branchId} className="flex items-center justify-between text-sm">
                          <span className="text-white"><span className="text-amber-400 font-bold mr-2">#{i + 1}</span>{b.city}{b.district}壽星餐酒館</span>
                          <span className="text-blue-400">NT${Number(b.revenue).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">分店</h4>
                {(hqSummary?.branches ?? []).length === 0 ? (
                  <p className="text-gray-500 text-sm">尚無分店資料</p>
                ) : (
                  <div className="space-y-2">
                    {(hqSummary?.branches ?? []).map((b: any) => (
                      <div key={b.branchId} className="bg-slate-900/60 rounded p-4">
                        <p className="text-amber-300 font-semibold mb-2">{b.city}{b.district}壽星餐酒館</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              sessionStorage.setItem("adminBranchCity", b.city);
                              sessionStorage.setItem("adminBranchDistrict", b.district);
                              sessionStorage.setItem("adminBranchId", String(b.branchId));
                              sessionStorage.setItem("adminOpenTab", "bookings");
                              window.location.href = "/admin";
                            }}
                            className="bg-slate-800 hover:bg-slate-700 rounded p-3 text-left transition-colors border border-amber-500/20">
                            <p className="text-gray-400 text-xs mb-1">壽星預約人數（點擊查看該分店預約資訊）</p>
                            <p className="text-amber-300 text-xl font-bold">{b.bookingCount} 人</p>
                          </button>
                          <button
                            onClick={() => {
                              sessionStorage.setItem("adminBranchCity", b.city);
                              sessionStorage.setItem("adminBranchDistrict", b.district);
                              sessionStorage.setItem("adminBranchId", String(b.branchId));
                              sessionStorage.setItem("adminOpenTab", "cashier");
                              window.location.href = "/admin";
                            }}
                            className="bg-slate-800 hover:bg-slate-700 rounded p-3 text-left transition-colors border border-amber-500/20">
                            <p className="text-gray-400 text-xs mb-1">收銀台淨利（點擊進入該分店收銀台）</p>
                            <p className={`text-xl font-bold ${Number(b.netProfit) >= 0 ? "text-blue-400" : "text-red-400"}`}>NT${Number(b.netProfit).toLocaleString()}</p>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* 第15批次-3: 分店功能顯示/隱藏（總店控制，所有分店同步；總店本身永久全功能） */}
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30 space-y-3">
              <h3 className="text-amber-400 font-semibold">分店功能顯示／隱藏</h3>
              <p className="text-gray-400 text-xs">控制所有分店品牌管理選單的顯示或隱藏（鳳山總店永久保留全部功能，不受此設定影響），設定後與各分店後台即時同步</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { id: "bookings", label: "壽星預約資訊" },
                  { id: "menu", label: "菜單管理" },
                  { id: "settings", label: "系統設定" },
                  { id: "tasks", label: "任務管理" },
                  { id: "members", label: "壽星會員專區" },
                  { id: "center", label: "會員中心" },
                  { id: "videos", label: "影片管理" },
                  { id: "editor", label: "視覺編輯器" },
                  { id: "npc", label: "NPC管理" },
                  { id: "banners", label: "首頁輪播圖" },
                  { id: "rituals", label: "慶生儀式管理" },
                  { id: "sop", label: "我的SOP管理" },
                  { id: "cashier", label: "收銀台" },
                  { id: "experience", label: "體驗牆" },
                  { id: "bookingCal", label: "預約查詢管理" },
                  { id: "systemData", label: "系統資料（營業王～版本資訊）" },
                ].map((t) => {
                  const visible = branchFeatureVisibility[t.id] !== false;
                  return (
                    <button key={t.id}
                      onClick={async () => {
                        const next = { ...branchFeatureVisibility, [t.id]: !visible };
                        try {
                          await updateSettingsMut.mutateAsync({ branchId: 1, branchFeatureVisibility: JSON.stringify(next) } as any);
                          await refetchHqSettings();
                          toast.success(`${t.label} 已${!visible ? "顯示" : "隱藏"}`);
                        } catch { toast.error("設定失敗"); }
                      }}
                      className={`px-3 py-2 rounded text-sm flex items-center justify-between gap-2 border ${visible ? "bg-green-700/40 border-green-500/40 text-green-300" : "bg-slate-700 border-slate-600 text-gray-400"}`}>
                      <span>{t.label}</span>
                      <span className="text-xs">{visible ? "顯示" : "隱藏"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30 space-y-3">
              <h3 className="text-amber-400 font-semibold">{editingBranchId ? "變更分店" : "新增分店"}</h3>
              {[
                { field: "city", label: "城市", placeholder: "例如：台北市" },
                { field: "district", label: "地區", placeholder: "例如：信義區" },
                { field: "username", label: "帳號", placeholder: "請輸入分店帳號" },
                { field: "password", label: "密碼", placeholder: "請輸入分店密碼" },
              ].map(({ field, label, placeholder }) => (
                <div key={field} className="flex items-center gap-2">
                  <label className="text-white text-sm w-16">{label}</label>
                  <input type="text" value={(branchForm as any)[field]}
                    onChange={(e) => setBranchForm({ ...branchForm, [field]: e.target.value })}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 bg-slate-700 text-white rounded border border-amber-500/30" />
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={async () => {
                    const { city, district, username, password } = branchForm;
                    if (!city.trim() || !district.trim() || !username.trim() || !password.trim()) { toast.error("請填寫全部欄位"); return; }
                    try {
                      if (editingBranchId) {
                        await updateBranchMut.mutateAsync({ id: editingBranchId, city: city.trim(), district: district.trim(), username: username.trim(), password: password.trim() });
                        toast.success("分店已變更");
                      } else {
                        await addBranchMut.mutateAsync({ city: city.trim(), district: district.trim(), username: username.trim(), password: password.trim() });
                        toast.success("分店已新增");
                      }
                      setBranchForm({ city: "", district: "", username: "", password: "" });
                      setEditingBranchId(null);
                      refetchBranches();
                    } catch { toast.error(editingBranchId ? "變更失敗" : "新增失敗"); }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">確認</button>
                {editingBranchId && (
                  <button onClick={() => { setEditingBranchId(null); setBranchForm({ city: "", district: "", username: "", password: "" }); }}
                    className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 text-sm">取消變更</button>
                )}
              </div>
            </div>
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
              <h3 className="text-amber-400 font-semibold mb-3">分店列表</h3>
              {(branchList as any[]).length === 0 ? (
                <p className="text-gray-400 text-sm">尚無分店</p>
              ) : (
                <div className="space-y-2">
                  {(branchList as any[]).map((b: any) => (
                    <div key={b.id} className="flex flex-wrap items-center justify-between bg-slate-900/60 rounded p-3 gap-2">
                      <div className="text-white text-sm">
                        <span className="text-amber-300 font-semibold">{b.city}{b.district}</span>
                        <span className="text-gray-400 ml-3">帳號：{b.username}</span>
                        <span className="text-gray-400 ml-3">密碼：{b.password}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingBranchId(b.id); setBranchForm({ city: b.city, district: b.district, username: b.username, password: b.password }); }}
                          className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700">變更</button>
                        <button
                          onClick={async () => {
                            if (!confirm(`確定要刪除分店「${b.city}${b.district}」？`)) return;
                            try { await deleteBranchMut.mutateAsync({ id: b.id }); toast.success("分店已刪除"); refetchBranches(); } catch { toast.error("刪除失敗"); }
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">刪除</button>
                        <button
                          onClick={async () => {
                            const newVisible = !(b as any).visible;
                            try { await toggleBranchVisibleMut.mutateAsync({ id: b.id, visible: newVisible }); toast.success(newVisible ? "已顯示" : "已隱藏"); refetchBranches(); } catch { toast.error("操作失敗"); }
                          }}
                          className={`px-3 py-1 rounded text-xs ${(b as any).visible !== false && (b as any).visible !== 0 ? "bg-green-600 text-white hover:bg-green-700" : "bg-slate-600 text-gray-300 hover:bg-slate-500"}`}>{(b as any).visible !== false && (b as any).visible !== 0 ? "顯示" : "隱藏"}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setActiveTab("settings")}
              className="px-4 py-2 bg-slate-700 text-gray-300 rounded hover:bg-slate-600 text-sm">← 返回系統設定</button>
          </div>
        );
      }
      // 第13批次-17: 收銀台
      case "cashier": {
        const INCOME_CATS = [
          { key: "plan", label: "費用方案收入" },
          { key: "food", label: "餐點收入" },
          { key: "drink", label: "酒水收入" },
          { key: "deposit", label: "預約金收入" },
          { key: "other_income", label: "其他收入" },
        ];
        const EXPENSE_CATS = [
          { key: "ingredient", label: "食材支出" },
          { key: "staff", label: "人事支出" },
          { key: "reward", label: "回饋獎金支出" },
          { key: "redpacket", label: "生日紅包支出" },
          { key: "rent", label: "房租支出" },
          { key: "utility", label: "水電支出" },
          { key: "ad", label: "廣告支出" },
          { key: "gas", label: "瓦斯支出" },
          { key: "other_expense", label: "其他支出" },
        ];
        const catLabel = (k: string) => [...INCOME_CATS, ...EXPENSE_CATS].find((c) => c.key === k)?.label || k;
        const entries = cashierEntries as any[];
        const monthIncome = entries.filter((e) => e.kind === "income").reduce((s, e) => s + Number(e.amount || 0), 0);
        const monthExpense = entries.filter((e) => e.kind === "expense").reduce((s, e) => s + Number(e.amount || 0), 0);
        const daysInMonth = new Date(cashierYear, cashierMonth, 0).getDate();
        const firstDow = new Date(cashierYear, cashierMonth - 1, 1).getDay();
        const dateKey = (d: number) => `${cashierYear}-${String(cashierMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayTotals = (d: number) => {
          const list = entries.filter((e) => e.entryDate === dateKey(d));
          return {
            income: list.filter((e) => e.kind === "income").reduce((s, e) => s + Number(e.amount || 0), 0),
            expense: list.filter((e) => e.kind === "expense").reduce((s, e) => s + Number(e.amount || 0), 0),
          };
        };
        const detailEntries = cashierDetailDate ? entries.filter((e) => e.entryDate === cashierDetailDate) : [];
        const paymentRowsByChannel: Record<string, any[]> = {
          line_pay: linePayPaymentRows as any[],
          jkopay: jkPayPaymentRows as any[],
          twqr: twqrPaymentRows as any[],
        };
        const isPaymentChannelVisible = (channel: string) => {
          const setting = (paymentChannelSettings as any[]).find((item: any) => item.channel === channel);
          return setting?.visible !== false;
        };
        const onlinePaymentsVisible = ONLINE_PAYMENT_CHANNELS.some((channel) => isPaymentChannelVisible(channel.key));
        const toggleOnlinePayments = async () => {
          const nextVisible = !onlinePaymentsVisible;
          try {
            await Promise.all(ONLINE_PAYMENT_CHANNELS.map((channel) => setPaymentChannelVisibleMut.mutateAsync({ branchId: loginBranchId, channel: channel.key, visible: nextVisible })));
            await refetchPaymentChannels();
            toast.success(`線上付款已${nextVisible ? "顯示" : "隱藏"}`);
          } catch {
            toast.error("線上付款顯示設定失敗");
          }
        };
        const openPaymentResult = (booking: any, type: "payment_complete" | "guest_prepay" | "host_refund" | "guest_refund", payerKey?: string) => {
          const params = new URLSearchParams({
            bookingId: String(booking.id),
            branchId: String(loginBranchId),
            phone: String(booking.phone || ""),
            date: String(booking.eventDate || ""),
            type,
          });
          if (payerKey) params.set("payerKey", payerKey);
          window.open(`/payment-result?${params.toString()}`, "_blank", "noopener,noreferrer");
        };
        const getCashRowsForBooking = (bookingId: number) => (cashPaymentRows as any[])
          .filter((item: any) => item.payment.bookingId === bookingId);
        const getCashAmountForRole = (bookingId: number, roleKey: string) => {
          const saved = getCashRowsForBooking(bookingId).find((item: any) => item.payment.payerKey === `guest_${roleKey}`);
          return cashAmounts[roleKey] ?? Number(saved?.payment.amount ?? 2928);
        };
        const refreshPaymentData = async () => {
          await Promise.all([
            refetchPaymentChannels(), refetchPaymentQrImages(), refetchLinePayPayments(),
            refetchJkPayPayments(), refetchTwqrPayments(), refetchCashPayments(),
          ]);
        };
        const saveUniformCashAmounts = async (bookingId: number, amount: number) => {
          const next = Object.fromEntries(CASH_PAYMENT_ROLES.map((role) => [role.key, amount]));
          setCashAmounts(next);
          try {
            const result = await saveCashAllocationsMut.mutateAsync({
              bookingId,
              branchId: loginBranchId,
              roleAllocations: CASH_PAYMENT_ROLES.map((role) => ({ key: role.key, label: role.label, amount })),
            });
            toast.success(`十個職位已自動保存，每位 NT$${amount.toLocaleString()}，合計 NT$${result.total.toLocaleString()}`);
            await refetchCashPayments();
          } catch (error: any) {
            toast.error(error?.message || "現金付款金額保存失敗");
          }
        };
        const submitCashier = async (kind: "income" | "expense") => {
          if (!cashierDate) { toast.error("請先選擇日期"); return; }
          const form = kind === "income" ? cashierIncomeForm : cashierExpenseForm;
          const cats = kind === "income" ? INCOME_CATS : EXPENSE_CATS;
          const list = cats
            .map((c) => ({ entryDate: cashierDate, kind, category: c.key, amount: parseInt(form[c.key] || "0") || 0, branchId: loginBranchId }))
            .filter((e) => e.amount > 0);
          if (list.length === 0) { toast.error("請輸入至少一筆金額"); return; }
          try {
            await addCashierMut.mutateAsync({ entries: list });
            toast.success(kind === "income" ? "收入已登錄" : "支出已登錄");
            if (kind === "income") setCashierIncomeForm({}); else setCashierExpenseForm({});
            const [y, m] = cashierDate.split("-").map(Number);
            if (y === cashierYear && m === cashierMonth) refetchCashier();
          } catch { toast.error("登錄失敗"); }
        };
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">收銀台</h2>
            {/* 五個選項：收入 / 支出 / 日曆 / 線上付款 / 現金付款 */}
            <div className="flex gap-2">
              {([["income", "收入"], ["expense", "支出"], ["calendar", "日曆"], ["online", "線上付款"], ["cash", "現金付款"]] as const).map(([k, label]) => (
                <button key={k} onClick={() => setCashierView(k)}
                  className={`px-4 py-2 rounded text-sm font-semibold ${cashierView === k ? (k === "income" ? "bg-blue-600 text-white" : k === "expense" ? "bg-red-600 text-white" : k === "online" ? "bg-fuchsia-700 text-white" : k === "cash" ? "bg-emerald-700 text-white" : "bg-amber-600 text-white") : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}>
                  {label}
                </button>
              ))}
            </div>
            {/* 收入（6個選項，藍字）：日期日曆 + 5個輸入框 */}
            {cashierView === "income" && (
            <div className="bg-slate-800/50 p-6 rounded border border-blue-500/40">
              <h3 className="text-blue-400 font-semibold mb-3">收入</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-blue-400 text-sm mb-1">日期：</label>
                  <input type="date" value={cashierDate} onChange={(e) => setCashierDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-blue-300 rounded border border-blue-500/30" />
                </div>
                {INCOME_CATS.map((c) => (
                  <div key={c.key}>
                    <label className="block text-blue-400 text-sm mb-1">{c.label}：</label>
                    <input type="number" min="0" value={cashierIncomeForm[c.key] || ""}
                      onChange={(e) => setCashierIncomeForm({ ...cashierIncomeForm, [c.key]: e.target.value })}
                      placeholder="NT$"
                      className="w-full px-3 py-2 bg-slate-700 text-blue-300 rounded border border-blue-500/30" />
                  </div>
                ))}
              </div>
              <button onClick={() => submitCashier("income")}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">登錄收入</button>
            </div>
            )}
            {/* 支出（10個選項，紅字）：日期日曆 + 9個輸入框 */}
            {cashierView === "expense" && (
            <div className="bg-slate-800/50 p-6 rounded border border-red-500/40">
              <h3 className="text-red-400 font-semibold mb-3">支出</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-red-400 text-sm mb-1">日期：</label>
                  <input type="date" value={cashierDate} onChange={(e) => setCashierDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-red-300 rounded border border-red-500/30" />
                </div>
                {EXPENSE_CATS.map((c) => (
                  <div key={c.key}>
                    <label className="block text-red-400 text-sm mb-1">{c.label}：</label>
                    <input type="number" min="0" value={cashierExpenseForm[c.key] || ""}
                      onChange={(e) => setCashierExpenseForm({ ...cashierExpenseForm, [c.key]: e.target.value })}
                      placeholder="NT$"
                      className="w-full px-3 py-2 bg-slate-700 text-red-300 rounded border border-red-500/30" />
                  </div>
                ))}
              </div>
              <button onClick={() => submitCashier("expense")}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">登錄支出</button>
            </div>
            )}
            {/* 第127批次：線上付款（QR圖片、顯示控制、付款資訊） */}
            {cashierView === "online" && (
              <div className="space-y-4">
                <div className="rounded border border-fuchsia-400/40 bg-fuchsia-950/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-fuchsia-200">線上付款</h3>
                      <p className="mt-1 text-xs text-gray-300">LINE Pay、街口支付與 TWQR 圖片及付款狀態均依目前登入分店獨立管理，並與前台「我的預約」同步。</p>
                    </div>
                    <button type="button" onClick={() => void toggleOnlinePayments()} className={`rounded px-3 py-2 text-xs font-semibold ${onlinePaymentsVisible ? "bg-emerald-700 text-white" : "bg-slate-700 text-gray-300"}`}>{onlinePaymentsVisible ? "顯示" : "隱藏"}</button>
                  </div>
                </div>
                {ONLINE_PAYMENT_CHANNELS.map((channel) => {
                  const visible = isPaymentChannelVisible(channel.key);
                  const qrImages = (paymentQrImages as any[]).filter((image: any) => image.entityKey === channel.key);
                  const paymentRows = paymentRowsByChannel[channel.key] || [];
                  const showInfo = onlineInfoChannel === channel.key;
                  return (
                    <div key={channel.key} className="rounded border border-fuchsia-400/30 bg-slate-800/50 p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-white">{channel.label}</h4>
                          <p className="text-xs text-gray-400">{channel.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={async () => {
                            try {
                              await setPaymentChannelVisibleMut.mutateAsync({ branchId: loginBranchId, channel: channel.key, visible: !visible });
                              toast.success(`${channel.label} 已${visible ? "隱藏" : "顯示"}`);
                              await refetchPaymentChannels();
                            } catch { toast.error("付款管道設定失敗"); }
                          }} className={`rounded px-3 py-1 text-xs ${visible ? "bg-emerald-700 text-white" : "bg-slate-700 text-gray-300"}`}>{visible ? "顯示" : "隱藏"}</button>
                          <button onClick={() => setOnlineInfoChannel(showInfo ? null : channel.key)} className="rounded bg-indigo-700 px-3 py-1 text-xs text-white hover:bg-indigo-600">資訊</button>
                          <label className="cursor-pointer rounded bg-amber-600 px-3 py-1 text-xs text-white hover:bg-amber-700">
                            選擇圖片
                            <input type="file" accept="image/*" className="hidden" onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              if (file.size > 10 * 1024 * 1024) { toast.error("圖片大小不能超過 10MB"); return; }
                              const reader = new FileReader();
                              reader.onload = async () => {
                                try {
                                  const base64 = String(reader.result || "").split(",")[1] || "";
                                  await uploadEntityImageMut.mutateAsync({ branchId: loginBranchId, entityType: "payment_qr", entityKey: channel.key, base64, contentType: file.type, filename: file.name, sortOrder: qrImages.length });
                                  toast.success(`${channel.label} QR 圖片已上傳`);
                                  await refetchPaymentQrImages();
                                } catch { toast.error("圖片上傳失敗"); }
                              };
                              reader.readAsDataURL(file);
                              event.target.value = "";
                            }} />
                          </label>
                        </div>
                      </div>
                      {qrImages.length === 0 ? (
                        <p className="text-sm text-gray-500">尚未上傳 {channel.label} QR Code 圖片。</p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {qrImages.map((image: any) => (
                            <div key={image.id} className="rounded bg-slate-900/70 p-3">
                              <img src={image.imageUrl} alt={`${channel.label} QR Code`} className={`mx-auto max-h-48 max-w-full rounded object-contain ${image.visible ? "" : "opacity-35"}`} />
                              <div className="mt-3 flex gap-2">
                                <button onClick={async () => { try { await setEntityImageVisibleMut.mutateAsync({ id: image.id, visible: !image.visible }); await refetchPaymentQrImages(); } catch { toast.error("圖片顯示設定失敗"); } }} className="rounded bg-slate-700 px-2 py-1 text-xs text-white">{image.visible ? "顯示" : "隱藏"}</button>
                                <button onClick={async () => { if (!confirm("確定刪除此付款QR圖片？")) return; try { await deleteEntityImageMut.mutateAsync({ id: image.id }); await refetchPaymentQrImages(); toast.success("圖片已刪除"); } catch { toast.error("圖片刪除失敗"); } }} className="rounded bg-red-700 px-2 py-1 text-xs text-white">刪除</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {showInfo && (
                        <div className="rounded border border-indigo-400/30 bg-slate-900/70 p-4">
                          <h5 className="mb-3 font-semibold text-indigo-200">{channel.label} 付款資訊</h5>
                          {paymentRows.length === 0 ? <p className="text-sm text-gray-500">尚無客人選擇此付款方式。</p> : (
                            <div className="space-y-3">
                              {paymentRows.map((row: any) => (
                                <div key={row.payment.id} className="rounded bg-slate-800 p-3 text-sm">
                                  <p className="text-white">壽星姓名：{row.booking.birthdayName || "未提供"}</p>
                                  <p className="text-gray-300">預約日期：{row.booking.eventDate}</p>
                                  <p className="text-amber-200">應付金額：NT${Number(row.payment.amount || 0).toLocaleString()}</p>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="text-gray-300">付款狀態：</span>
                                    {(["unpaid", "paid"] as const).map((status) => (
                                      <button key={status} onClick={async () => {
                                        try {
                                          await setBookingPaymentStatusMut.mutateAsync({ bookingId: row.payment.bookingId, branchId: loginBranchId, payerKey: row.payment.payerKey, status });
                                          toast.success(`已標記為${status === "paid" ? "已付款" : "未付款"}`);
                                          await refreshPaymentData();
                                        } catch { toast.error("付款狀態更新失敗"); }
                                      }} className={`rounded px-3 py-1 text-xs ${row.payment.status === status ? "bg-emerald-600 text-white" : "bg-slate-700 text-gray-300"}`}>{status === "paid" ? "已付款" : "未付款"}</button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* 第127批次：現金付款（全額鎖定席位、十個職位、預繳與退款） */}
            {cashierView === "cash" && (
              <div className="space-y-4">
                <div className="rounded border border-emerald-400/40 bg-emerald-950/20 p-4">
                  <h3 className="font-semibold text-emerald-200">現金付款</h3>
                  <p className="mt-1 text-xs text-gray-300">僅列出已選擇「全額鎖定席位」方案的預約。十個職位必須使用相同單價；變更價格後會自動保存。</p>
                </div>
                {(allBookings as any[]).filter((booking: any) => ["student", "weekday", "holiday"].includes(booking.paymentPlan)).length === 0 ? (
                  <p className="text-sm text-gray-500">尚無選擇全額鎖定席位的預約。</p>
                ) : (
                  (allBookings as any[]).filter((booking: any) => ["student", "weekday", "holiday"].includes(booking.paymentPlan)).map((booking: any) => {
                    const expanded = cashExpandedBookingId === booking.id;
                    const savedRows = getCashRowsForBooking(booking.id);
                    const roleRows = savedRows.filter((row: any) => row.payment.payerKey.startsWith("guest_"));
                    const total = roleRows.reduce((sum: number, row: any) => sum + Number(row.payment.amount || 0), 0);
                    return (
                      <div key={booking.id} className="rounded border border-emerald-400/30 bg-slate-800/50 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <button onClick={() => {
                            setCashExpandedBookingId(expanded ? null : booking.id);
                            if (!expanded) {
                              const initial = Object.fromEntries(CASH_PAYMENT_ROLES.map((role) => [role.key, getCashAmountForRole(booking.id, role.key)]));
                              setCashAmounts(initial);
                            }
                          }} className="text-left">
                            <p className="font-semibold text-white">壽星姓名：{booking.birthdayName || "未提供"}</p>
                            <p className="text-sm text-gray-300">活動日期：{booking.eventDate}</p>
                            <p className="text-sm text-gray-300">聯絡電話：{booking.phone || "未提供"}</p>
                          </button>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={async () => { if (!confirm("確定刪除這筆現金付款資料？")) return; try { await clearCashAllocationsMut.mutateAsync({ bookingId: booking.id, branchId: loginBranchId }); toast.success("現金付款資料已刪除"); await refetchCashPayments(); } catch { toast.error("刪除失敗"); } }} className="rounded bg-red-700 px-3 py-1 text-xs text-white">刪除</button>
                            <button onClick={async () => { try { await setCashNoticeMut.mutateAsync({ bookingId: booking.id, branchId: loginBranchId, notice: "host_refund" }); toast.success("退款通知已同步"); await refetchCashPayments(); openPaymentResult(booking, "host_refund"); } catch { toast.error("退款設定失敗"); } }} className="rounded bg-rose-700 px-3 py-1 text-xs text-white">退款</button>
                            {roleRows.length === 10 && <button onClick={async () => { try { await setCashNoticeMut.mutateAsync({ bookingId: booking.id, branchId: loginBranchId, notice: "payment_complete" }); toast.success("付款完成通知已同步至前台"); await refetchCashPayments(); openPaymentResult(booking, "payment_complete"); } catch { toast.error("付款完成設定失敗"); } }} className="rounded bg-emerald-800 px-3 py-1 text-xs text-emerald-100">金額顯示 NT${total.toLocaleString()}</button>}
                          </div>
                        </div>
                        {expanded && (
                          <div className="mt-4 space-y-4 border-t border-slate-700 pt-4">
                            <div className="grid gap-3 md:grid-cols-2">
                              {CASH_PAYMENT_ROLES.map((role) => {
                                const record = roleRows.find((row: any) => row.payment.payerKey === `guest_${role.key}`)?.payment;
                                const amount = getCashAmountForRole(booking.id, role.key);
                                return (
                                  <div key={role.key} className="flex items-center gap-2 rounded bg-slate-900/60 p-3">
                                    <span className="min-w-20 text-sm text-white">{role.label}</span>
                                    <select value={amount} onChange={(event) => void saveUniformCashAmounts(booking.id, Number(event.target.value))} className="flex-1 rounded border border-emerald-500/30 bg-slate-700 px-2 py-1 text-sm text-white">
                                      <option value={2928}>學生2928</option>
                                      <option value={3928}>一般3928</option>
                                      <option value={4928}>假日4928</option>
                                    </select>
                                    <button onClick={async (event) => {
                                      event.stopPropagation();
                                      if (!record) { toast.error("請先設定十個職位的金額"); return; }
                                      try {
                                        await setBookingPaymentStatusMut.mutateAsync({ bookingId: booking.id, branchId: loginBranchId, payerKey: record.payerKey, status: "paid" });
                                        toast.success(`${role.label} 預繳已同步`);
                                        await refetchCashPayments();
                                        openPaymentResult(booking, "guest_prepay", record.payerKey);
                                      } catch { toast.error("預繳設定失敗"); }
                                    }} className="rounded bg-amber-600 px-2 py-1 text-xs text-white">預繳</button>
                                    <button onClick={async (event) => {
                                      event.stopPropagation();
                                      if (!record) { toast.error("請先設定十個職位的金額"); return; }
                                      try {
                                        await setBookingPaymentStatusMut.mutateAsync({ bookingId: booking.id, branchId: loginBranchId, payerKey: record.payerKey, status: "refunded" });
                                        toast.success(`${role.label} 退款已同步`);
                                        await refetchCashPayments();
                                        openPaymentResult(booking, "guest_refund", record.payerKey);
                                      } catch { toast.error("退款設定失敗"); }
                                      }} className={`rounded px-2 py-1 text-xs ${record?.status === "refunded" ? "border border-rose-400 bg-rose-950 text-rose-200" : "bg-slate-700 text-gray-300"}`}>退款</button>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="rounded border border-emerald-400/30 bg-emerald-950/20 p-4">
                              <p className="mb-3 font-semibold text-emerald-200">全額鎖定席位</p>
                              <div className="flex flex-wrap gap-2">
                                {[[2928, "學生29280"], [3928, "一般39280"], [4928, "假日49280"]].map(([amount, label]) => (
                                  <button key={String(amount)} onClick={() => void saveUniformCashAmounts(booking.id, Number(amount))} className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">{label}</button>
                                ))}
                              </div>
                              <p className="mt-2 text-xs text-gray-300">選擇後十個輸入框會自動同步為相同金額；若資料不一致，系統會顯示錯誤並拒絕保存。</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
            {/* 日曆檢視 */}
            {cashierView === "calendar" && (
            <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => { if (cashierMonth === 1) { setCashierYear(cashierYear - 1); setCashierMonth(12); } else setCashierMonth(cashierMonth - 1); setCashierDetailDate(null); }}
                  className="px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600">◀</button>
                <h3 className="text-amber-400 font-semibold">{cashierYear}年{cashierMonth}月</h3>
                <button onClick={() => { if (cashierMonth === 12) { setCashierYear(cashierYear + 1); setCashierMonth(1); } else setCashierMonth(cashierMonth + 1); setCashierDetailDate(null); }}
                  className="px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600">▶</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-gray-400 text-xs mb-1">
                {["日", "一", "二", "三", "四", "五", "六"].map((d) => (<div key={d}>{d}</div>))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDow }).map((_, i) => (<div key={`e${i}`} />))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const t = dayTotals(d);
                  const has = t.income > 0 || t.expense > 0;
                  return (
                    <button key={d}
                      onClick={() => setCashierDetailDate(cashierDetailDate === dateKey(d) ? null : dateKey(d))}
                      className={`rounded p-1 min-h-[52px] text-xs border flex flex-col items-center justify-start ${cashierDetailDate === dateKey(d) ? "border-amber-500 bg-amber-600/20" : "border-slate-700 bg-slate-900/60 hover:border-amber-500/50"}`}>
                      <span className="text-white">{d}</span>
                      {has && (
                        <>
                          {t.income > 0 && <span className="text-blue-400 leading-tight">{t.income.toLocaleString()}</span>}
                          {t.expense > 0 && <span className="text-red-400 leading-tight">{t.expense.toLocaleString()}</span>}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* 點日期顯示品項明細 */}
              {cashierDetailDate && (
                <div className="mt-4 p-4 bg-slate-900/60 rounded border border-amber-500/30">
                  <h4 className="text-amber-400 text-sm font-semibold mb-2">{cashierDetailDate} 明細</h4>
                  {detailEntries.length === 0 ? (
                    <p className="text-gray-400 text-sm">此日無登錄項目</p>
                  ) : (
                    <div className="space-y-1">
                      {detailEntries.filter((e: any) => e.kind === "income").map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between text-sm">
                          <span className="text-blue-400">
                            {catLabel(e.category)}｜收入｜NT${Number(e.amount).toLocaleString()}
                          </span>
                          <button
                            onClick={async () => {
                              if (!confirm("確定刪除此筆紀錄？")) return;
                              try { await deleteCashierMut.mutateAsync({ id: e.id }); toast.success("已刪除"); refetchCashier(); } catch { toast.error("刪除失敗"); }
                            }}
                            className="px-2 py-0.5 bg-red-600 text-white rounded text-xs hover:bg-red-700">刪除</button>
                        </div>
                      ))}
                      {detailEntries.filter((e: any) => e.kind === "expense").map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between text-sm">
                          <span className="text-red-400">
                            {catLabel(e.category)}｜支出｜NT${Number(e.amount).toLocaleString()}
                          </span>
                          <button
                            onClick={async () => {
                              if (!confirm("確定刪除此筆紀錄？")) return;
                              try { await deleteCashierMut.mutateAsync({ id: e.id }); toast.success("已刪除"); refetchCashier(); } catch { toast.error("刪除失敗"); }
                            }}
                            className="px-2 py-0.5 bg-red-600 text-white rounded text-xs hover:bg-red-700">刪除</button>
                        </div>
                      ))}
                      <div className="pt-2 mt-1 border-t border-slate-700 text-sm space-y-0.5">
                        <p className="text-blue-400">收入：NT${detailEntries.filter((e: any) => e.kind === "income").reduce((s: number, e: any) => s + Number(e.amount || 0), 0).toLocaleString()}</p>
                        <p className="text-red-400">支出：NT${detailEntries.filter((e: any) => e.kind === "expense").reduce((s: number, e: any) => s + Number(e.amount || 0), 0).toLocaleString()}</p>
                        <p className="text-blue-400 font-semibold">合計：NT${(detailEntries.filter((e: any) => e.kind === "income").reduce((s: number, e: any) => s + Number(e.amount || 0), 0) - detailEntries.filter((e: any) => e.kind === "expense").reduce((s: number, e: any) => s + Number(e.amount || 0), 0)).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* 月統計 */}
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-900/60 rounded p-3">
                  <p className="text-gray-400 text-xs">每月收入</p>
                  <p className="text-blue-400 font-bold">NT${monthIncome.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/60 rounded p-3">
                  <p className="text-gray-400 text-xs">每月支出</p>
                  <p className="text-red-400 font-bold">NT${monthExpense.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/60 rounded p-3">
                  <p className="text-gray-400 text-xs">每月淨利</p>
                  <p className={`font-bold ${monthIncome - monthExpense >= 0 ? "text-green-400" : "text-red-400"}`}>NT${(monthIncome - monthExpense).toLocaleString()}</p>
                </div>
              </div>
            </div>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };
  // ── Booking Calendar Admin (17-5) ──
  // Wire bookingCal into renderContent
  const renderContentFinal = () => {
    if (activeTab === "bookingCal") return <BookingCalendarAdmin />;
    return renderContent();
  };
  const BookingCalendarAdmin = () => {
    const today = new Date();
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const yearMonth = `${calYear}-${String(calMonth).padStart(2, "0")}`;
    const { data: calData = [], refetch: refetchCal } = trpc.bookingCalendar.listMonth.useQuery({ branchId: loginBranchId, yearMonth });
    const upsertCal = trpc.bookingCalendar.upsert.useMutation({ onSuccess: () => { refetchCal(); } });
    const calStatusMap: Record<string, string> = {};
    (calData as any[]).forEach((item: any) => { calStatusMap[item.date] = item.status; });
    const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const calWeeks: (number | null)[][] = [];
    let calWeek: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) { calWeek.push(d); if (calWeek.length === 7) { calWeeks.push(calWeek); calWeek = []; } }
    if (calWeek.length > 0) { while (calWeek.length < 7) calWeek.push(null); calWeeks.push(calWeek); }
    const STATUS_OPTIONS = ["日場預約保留", "晚場預約保留", "全日預約保留", "日場席位鎖定", "晚場席位鎖定", "全日席位鎖定"];
    const handleStatusSelect = (status: string | null) => {
      if (!selectedDate) return;
      upsertCal.mutate({ branchId: loginBranchId, date: selectedDate, status });
      setSelectedDate(null);
    };
    return (
      <div className="space-y-4">
        <h3 className="text-amber-400 font-bold text-lg">預約查詢管理</h3>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => { if (calMonth === 1) { setCalYear(calYear - 1); setCalMonth(12); } else setCalMonth(calMonth - 1); }} className="px-2 py-1 bg-slate-700 text-white rounded">◀</button>
          <span className="text-white font-bold">{calYear} 年 {calMonth} 月</span>
          <button onClick={() => { if (calMonth === 12) { setCalYear(calYear + 1); setCalMonth(1); } else setCalMonth(calMonth + 1); }} className="px-2 py-1 bg-slate-700 text-white rounded">▶</button>
        </div>
        {/* bookingCalendarVisible toggle */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-300 text-sm">前台預約查詢：</span>
          <button onClick={() => handleSettingChange("bookingCalendarVisible", true)} className={`px-3 py-1 rounded text-xs ${(localSettings as any)?.bookingCalendarVisible !== false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>顯示</button>
          <button onClick={() => handleSettingChange("bookingCalendarVisible", false)} className={`px-3 py-1 rounded text-xs ${(localSettings as any)?.bookingCalendarVisible === false ? "bg-amber-600 text-white" : "bg-slate-700 text-gray-300"}`}>隱藏</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {["日","一","二","三","四","五","六"].map(d => <div key={d} className="text-amber-400 font-semibold text-xs py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calWeeks.flat().map((day, idx) => {
            if (day === null) return <div key={idx} className="h-14" />;
            const dateStr = `${calYear}-${String(calMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const st = calStatusMap[dateStr];
            return (
              <div key={idx} onClick={() => setSelectedDate(dateStr)} className={`h-14 rounded flex flex-col items-center justify-start pt-1 cursor-pointer border ${selectedDate === dateStr ? "border-amber-400 bg-slate-700" : "border-slate-700 bg-slate-800/60"} hover:border-amber-400/60`}>
                <span className="text-white text-xs font-semibold">{day}</span>
                {st && <span className="text-[8px] leading-tight text-center mt-0.5 text-pink-400">{st}</span>}
              </div>
            );
          })}
        </div>
        {selectedDate && (
          <div className="mt-4 p-4 bg-slate-900/80 rounded border border-amber-500/30">
            <p className="text-white font-semibold mb-2">設定 {selectedDate} 狀態：</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(s => (
                <button key={s} onClick={() => handleStatusSelect(s)} className={`px-3 py-2 rounded text-xs font-semibold ${calStatusMap[selectedDate] === s ? "bg-amber-500 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}>{s}</button>
              ))}
              <button onClick={() => handleStatusSelect(null)} className="px-3 py-2 rounded text-xs bg-red-800 text-white hover:bg-red-700 col-span-2">清除狀態</button>
            </div>
          </div>
        )}
        <p className="text-gray-400 text-xs mt-2">點選日期後選擇預約狀態，與前台「預約查詢」同步顯示。各分店獨立管理。</p>
        <button onClick={async () => { await handleSaveSettings(); toast.success("預約查詢設定已保存"); }} className="mt-4 w-full py-3 bg-amber-600 text-white font-bold rounded hover:bg-amber-700">保存</button>
      </div>
    );
  };
  // Don't render until login check is done

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/main")}
            className="text-amber-400 hover:text-amber-300 flex items-center gap-2">
            ← 返回主功能
          </button>
          <button onClick={handleLogout}
            className="px-4 py-2 bg-slate-700 text-gray-300 rounded hover:bg-slate-600 text-sm">
            登出
          </button>
        </div>
        <h1 className="text-4xl font-bold text-amber-400 mb-8 text-center">品牌管理</h1>
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { id: "bookings", label: "壽星預約資訊" },
            { id: "menu", label: "菜單管理" },
            { id: "settings", label: "系統設定" },
            { id: "tasks", label: "任務管理" },
            { id: "editor", label: "視覺編輯器" },
            { id: "members", label: "壽星會員專區" },
            { id: "center", label: "會員中心" },
            { id: "videos", label: "影片管理" },
            { id: "npc", label: "NPC管理" },
            { id: "banners", label: "首頁輪播圖" },
            { id: "rituals", label: "慶生儀式管理" },
            { id: "sop", label: "我的SOP管理" },
            { id: "cashier", label: "收銀台" },
            { id: "experience", label: "體驗牆" },
            { id: "bookingCal", label: "預約查詢管理" },
          ].filter((tab) => isTabVisibleForBranch(tab.id)).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded font-semibold transition ${activeTab === tab.id ? "bg-amber-500 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="bg-slate-800/30 rounded-lg p-6 border border-amber-500/20">
          {renderContentFinal()}
        </div>
      </div>

      {/* BUG 4-9: Detail Modal with all booking fields + revenue inputs */}
      {detailBooking && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-lg p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-amber-400 mb-4">完整活動資訊</h3>
            <div className="text-white text-sm space-y-2">
              <p><span className="text-gray-400">壽星姓名：</span>{detailBooking.birthdayName || "未提供"}</p>
              <p><span className="text-gray-400">出生年月日：</span>{detailBooking.birthdayDate || "未提供"}</p>
              <p><span className="text-gray-400">預約日期：</span>{detailBooking.eventDate}</p>
              <p><span className="text-gray-400">時段：</span>{detailBooking.sessionType === "day" ? "日間場 10:00~16:00" : "晚間場 17:00~23:00"}</p>
              <p><span className="text-gray-400">電話：</span>{detailBooking.phone || "未提供"}</p>
              <p><span className="text-gray-400">LINE ID：</span>{detailBooking.lineId || "未提供"}</p>
              <p><span className="text-gray-400">工作：</span>{detailBooking.job || "未提供"}</p>
              <p><span className="text-gray-400">專長：</span>{detailBooking.skills || "未提供"}</p>
              <p><span className="text-gray-400">慶生儀式：</span>{detailBooking.ceremonyType === "wish" ? "許願儀式" : detailBooking.ceremonyType === "chinese" ? "中式慶生" : detailBooking.ceremonyType === "korean" ? "韓式慶生" : "未提供"}</p>
              <p><span className="text-gray-400">派對主題：</span>{detailBooking.partyThemeChoice === "store" ? "店家主題" : detailBooking.partyThemeChoice === "custom" ? `自訂：${detailBooking.partyThemeCustom || ""}` : "未提供"}</p>

              <p><span className="text-gray-400">來源管道：</span>{detailBooking.sourceChannels || detailBooking.sourceChannel || "未提供"}</p>
              <p><span className="text-gray-400">特殊需求：</span>{detailBooking.specialRequests || "無"}</p>
              <p><span className="text-gray-400">預約狀態：</span>{detailBooking.status}</p>
              <p><span className="text-gray-400">壽星提交報名表時間：</span>{detailBooking.createdAt ? new Date(detailBooking.createdAt).toLocaleString("zh-TW") : "未記錄"}</p>
              {/* BUG 9: 費用方案 */}
              <p><span className="text-gray-400">費用方案：</span>{getPlanLabel(detailBooking.paymentPlan || "")}</p>
              {getAdminBookingPaymentRows(detailBooking.id).filter((row: any) => ["host_online", "host_cash"].includes(row.payment.payerKey)).map((row: any) => (
                <div key={row.payment.id} className="space-y-1">
                  <p><span className="text-gray-400">付款方式：</span>{getAdminPaymentMethodLabel(row.payment.method)}</p>
                  <p><span className="text-gray-400">付款金額：</span>NT${Number(row.payment.amount || 0).toLocaleString()}</p>
                  <p><span className="text-gray-400">付款狀態：</span>{getAdminPaymentStatusLabel(row.payment.status)}</p>
                </div>
              ))}
            </div>
            {/* BUG 8: 費用方案輸入框 */}
            <div className="mt-4 pt-4 border-t border-amber-500/20">
              <h4 className="text-amber-400 font-semibold mb-3">費用方案</h4>
              <div className="flex items-center gap-2">
                <label className="text-gray-400 w-36">費用方案金額</label>
                <input type="number"
                  value={detailPaymentPlanAmount}
                  onChange={(e) => setDetailPaymentPlanAmount(e.target.value)}
                  placeholder="輸入費用方案金額"
                  className="flex-1 px-2 py-1 bg-slate-700 text-white rounded border border-amber-500/30" />
              </div>
              <button onClick={handleSavePaymentPlan}
                className="mt-3 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm">保存費用方案</button>
            </div>
            {/* BUG 5-8: 營業收入輸入框 */}
            <div className="mt-4 pt-4 border-t border-amber-500/20">
              <h4 className="text-amber-400 font-semibold mb-3">營業收入</h4>
              <div className="space-y-2 text-sm">
                {[
                  { label: "餐點收入", field: "mealRevenue" },
                  { label: "酒水收入", field: "drinkRevenue" },
                  { label: "當日營業額", field: "totalRevenue" },
                  { label: "當日營收現金50%回饋", field: "cashback" },
                ].map(({ label, field }) => (
                  <div key={field} className="flex items-center gap-2">
                    <label className="text-gray-400 w-36">{label}</label>
                    <input type="number"
                      value={detailRevenue[field] || ""}
                      onChange={(e) => handleRevenueFieldChange(field, e.target.value)}
                      placeholder="輸入金額"
                      className="flex-1 px-2 py-1 bg-slate-700 text-white rounded border border-amber-500/30" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">輸入金額後自動儲存，當日營業額與回饋金自動計算</p>
              <button onClick={handleSaveRevenue}
                className="mt-3 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm">手動保存</button>
            </div>
            <div className="flex justify-center mt-6">
              <button onClick={() => setDetailBooking(null)}
                className="px-6 py-2 bg-slate-700 text-white rounded hover:bg-slate-600">關閉</button>
            </div>
          </div>
        </div>
      )}

      {confirmFullPaidEventId !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-lg p-6 max-w-md w-full text-center">
            <h3 className="text-xl font-semibold text-amber-400 mb-4">確認全額繳費完成</h3>
            <p className="text-white mb-6">確定要標記此活動為「全額繳費完成」嗎？</p>
            <p className="text-gray-400 text-sm mb-6">系統將自動生成 11 組邀請碼（壽星 1 + 親友 10）</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmFullPaidEventId(null)}
                className="px-6 py-2 bg-slate-700 text-white rounded hover:bg-slate-600">取消</button>
              <button onClick={handleFullPaidConfirm}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">確認</button>
            </div>
          </div>
        </div>
      )}
      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPreviewVideoUrl(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewVideoUrl(null)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-red-400 z-10">✕ 關閉</button>
            <video src={previewVideoUrl} controls autoPlay playsInline
              className="w-full max-h-[85vh] rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
