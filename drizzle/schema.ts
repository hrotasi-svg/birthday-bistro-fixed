import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  index,
  varchar,
  decimal,
  bigint,
} from "drizzle-orm/mysql-core";

// ─────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  birthday: varchar("birthday", { length: 16 }),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  job: varchar("job", { length: 128 }),
  skills: text("skills"),
  lineId: varchar("lineId", { length: 64 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // 會員系統欄位
  memberNumber: varchar("memberNumber", { length: 32 }),
  memberRole: mysqlEnum("memberRole", ["general", "friend", "host", "premium"]).default("general").notNull(),
  premiumStatus: mysqlEnum("premiumStatus", ["none", "subscribed", "expired"]).default("none").notNull(),
  premiumStartDate: varchar("premiumStartDate", { length: 16 }),
  premiumEndDate: varchar("premiumEndDate", { length: 16 }),
  subscriptionPlatform: varchar("subscriptionPlatform", { length: 32 }).default("restaurant"),
  blackCardMethod: mysqlEnum("blackCardMethod", ["host", "friend", "subscription", "none"]).default("none").notNull(),
  blackCardDate: varchar("blackCardDate", { length: 16 }),
  blackCardExpiry: varchar("blackCardExpiry", { length: 16 }),
  blackCardNo: varchar("blackCardNo", { length: 64 }),
  blackCardImageUrl: varchar("blackCardImageUrl", { length: 1024 }),
  blackCardImageVisible: boolean("blackCardImageVisible").default(true).notNull(),
  blackCardBenefit: varchar("blackCardBenefit", { length: 128 }).default("全年用餐五折優惠"),
  blackCardAcquiredBy: varchar("blackCardAcquiredBy", { length: 64 }),
  appAutoRenew: boolean("appAutoRenew").default(false),
  appCancelStatus: varchar("appCancelStatus", { length: 32 }),
  appPromo: text("appPromo"),
  // 第16批次-7: 我的生日願望
  birthdayWish: text("birthdayWish"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─────────────────────────────────────────────
// Bookings（預約）
// ─────────────────────────────────────────────
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  userId: int("userId").notNull(),
  eventDate: varchar("eventDate", { length: 16 }).notNull(),
  timeSlot: varchar("timeSlot", { length: 32 }),
  guestCount: int("guestCount").default(1),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  challengeMode: boolean("challengeMode").default(false),
  themeType: varchar("themeType", { length: 64 }),
  themeCustom: text("themeCustom"),
  specialRequests: text("specialRequests"),
  sourceChannel: varchar("sourceChannel", { length: 64 }),
  // PRD 報名表欄位
  birthdayName: varchar("birthdayName", { length: 64 }),
  birthdayDate: varchar("birthdayDate", { length: 16 }),
  phone: varchar("phone", { length: 32 }),
  lineId: varchar("lineId", { length: 64 }),
  job: varchar("job", { length: 128 }),
  skills: text("skills"),
  sessionType: mysqlEnum("sessionType", ["day", "night"]),
  ceremonyType: mysqlEnum("ceremonyType", ["wish", "chinese", "korean"]),
  challengeLeader: boolean("challengeLeader").default(false),
  partyThemeChoice: mysqlEnum("partyThemeChoice", ["store", "custom"]),
  partyThemeCustom: text("partyThemeCustom"),
  sourceChannels: text("sourceChannels"),
  paymentPlan: varchar("paymentPlan", { length: 32 }),
  // 第13批次-15：城市地區資料分類
  city: varchar("city", { length: 64 }),
  district: varchar("district", { length: 64 }),
  hidden: boolean("hidden").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  // 第42批次：既有 userId 成為會員 User ID ↔ Booking ID 的永久查詢關聯。
  index("bookings_user_branch_idx").on(table.userId, table.branchId),
]);

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ─────────────────────────────────────────────
// Booking Notifications（預約／活動紅點通知 — 每筆預約獨立持久化）
// ─────────────────────────────────────────────
export const bookingNotifications = mysqlTable("booking_notifications", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  branchId: int("branchId").default(1).notNull(),
  recipient: mysqlEnum("recipient", ["admin", "customer"]).notNull(),
  kind: mysqlEnum("kind", ["booking_submitted", "booking_approved", "payment_confirmed"]).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("booking_notifications_booking_kind_unique").on(table.bookingId, table.kind),
]);

export type BookingNotification = typeof bookingNotifications.$inferSelect;
export type InsertBookingNotification = typeof bookingNotifications.$inferInsert;

// ─────────────────────────────────────────────
// Experience Surveys（登入會員體驗調查表 — 每位會員、每間分店一份）
// ─────────────────────────────────────────────
export const experienceSurveys = mysqlTable("experience_surveys", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  branchId: int("branchId").default(1).notNull(),
  expectation: varchar("expectation", { length: 32 }).notNull(),
  attendAgain: varchar("attendAgain", { length: 32 }).notNull(),
  recommend: varchar("recommend", { length: 32 }).notNull(),
  attractions: text("attractions").notNull(),
  activityMvp: varchar("activityMvp", { length: 128 }),
  atmosphereMvp: varchar("atmosphereMvp", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("experience_surveys_member_branch_unique").on(table.memberId, table.branchId),
  index("experience_surveys_branch_idx").on(table.branchId),
]);

export type ExperienceSurvey = typeof experienceSurveys.$inferSelect;
export type InsertExperienceSurvey = typeof experienceSurveys.$inferInsert;

// ─────────────────────────────────────────────
// Events（活動主體）
// ─────────────────────────────────────────────
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId"),
  hostUserId: int("hostUserId").notNull(),
  title: varchar("title", { length: 256 }),
  status: mysqlEnum("status", [
    "pending_review",
    "approved",
    "deposit_paid",
    "locked",
    "full_paid",
    "active",
    "completed",
    "cancelled",
  ]).default("pending_review").notNull(),
  eventDate: varchar("eventDate", { length: 16 }),
  eventType: mysqlEnum("eventType", ["weekday", "student", "holiday"]).default("weekday"),
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).default("0"),
  cost: decimal("cost", { precision: 12, scale: 2 }).default("0"),
  profit: decimal("profit", { precision: 12, scale: 2 }).default("0"),
  hostShare: decimal("hostShare", { precision: 12, scale: 2 }).default("0"),
  platformShare: decimal("platformShare", { precision: 12, scale: 2 }).default("0"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

// ─────────────────────────────────────────────
// Event Guests（活動參與者）
// ─────────────────────────────────────────────
export const eventGuests = mysqlTable("event_guests", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  inviteCode: varchar("inviteCode", { length: 32 }),
  roleTitle: varchar("roleTitle", { length: 64 }),
  status: mysqlEnum("status", ["active", "removed", "replaced"]).default("active").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type EventGuest = typeof eventGuests.$inferSelect;
export type InsertEventGuest = typeof eventGuests.$inferInsert;

// ─────────────────────────────────────────────
// Invite Codes（邀請碼）
// ─────────────────────────────────────────────
export const inviteCodes = mysqlTable("invite_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  eventId: int("eventId").notNull(),
  type: mysqlEnum("type", ["host", "guest"]).default("guest").notNull(),
  label: varchar("label", { length: 32 }).default(""),
  usedByUserId: int("usedByUserId"),
  used: boolean("used").default(false).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertInviteCode = typeof inviteCodes.$inferInsert;

// ─────────────────────────────────────────────
// Tasks（任務卡）
// ─────────────────────────────────────────────
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  eventId: int("eventId").notNull(),
  assignedUserId: int("assignedUserId"),
  roleTitle: varchar("roleTitle", { length: 64 }).notNull(),
  taskDescription: text("taskDescription"),
  status: mysqlEnum("status", ["pending", "done"]).default("pending").notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─────────────────────────────────────────────
// Videos（影片）
// ─────────────────────────────────────────────
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["selfie", "close", "medium", "wide", "behind", "fun"]).default("selfie"),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 512 }),
  duration: int("duration"),
  aiTag: varchar("aiTag", { length: 256 }),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

// ─────────────────────────────────────────────
// Payments（付款）
// ─────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["deposit", "full"]).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  method: varchar("method", { length: 64 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─────────────────────────────────────────────
// Finance Records（財務記錄）
// ─────────────────────────────────────────────
export const financeRecords = mysqlTable("finance_records", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().unique(),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0"),
  cost: decimal("cost", { precision: 12, scale: 2 }).default("0"),
  profit: decimal("profit", { precision: 12, scale: 2 }).default("0"),
  hostShare: decimal("hostShare", { precision: 12, scale: 2 }).default("0"),
  platformShare: decimal("platformShare", { precision: 12, scale: 2 }).default("0"),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});

export type FinanceRecord = typeof financeRecords.$inferSelect;
export type InsertFinanceRecord = typeof financeRecords.$inferInsert;

// ─────────────────────────────────────────────
// System Settings（系統設定 — key-value 持久化）
// ─────────────────────────────────────────────
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;

// ─────────────────────────────────────────────
// Menu Items（菜單管理）
// ─────────────────────────────────────────────
export const menuItems = mysqlTable("menu_items", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  category: varchar("category", { length: 64 }).notNull(), // "noCourse" | "cocktail"
  title: varchar("title", { length: 256 }),
  description: text("description"),
  imageUrl: text("imageUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;

// ─────────────────────────────────────────────
// Task Positions（部門任務卡職位 — 全域設定）
// ─────────────────────────────────────────────
export const taskPositions = mysqlTable("task_positions", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  roleTitle: varchar("roleTitle", { length: 64 }).notNull(),
  displayName: varchar("displayName", { length: 64 }),
  taskDescription: text("taskDescription"),
  sortOrder: int("sortOrder").default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TaskPosition = typeof taskPositions.$inferSelect;

// ─────────────────────────────────────────────
// Short Videos（短影音任務 — 依職位與分鏡）
// ─────────────────────────────────────────────
export const shortVideos = mysqlTable("short_videos", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  eventId: int("eventId"),
  position: varchar("position", { length: 64 }).notNull(), // 職位
  angle: varchar("angle", { length: 32 }).notNull(), // 中景/特寫/廣角/遠景/自拍
  videoUrl: text("videoUrl"),
  fileKey: varchar("fileKey", { length: 512 }),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShortVideo = typeof shortVideos.$inferSelect;

// ─────────────────────────────────────────────
// Booking Revenue（預約營業收入）
// ─────────────────────────────────────────────
export const bookingRevenue = mysqlTable("booking_revenue", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(),
  mealRevenue: varchar("mealRevenue", { length: 32 }).default("0"),
  drinkRevenue: varchar("drinkRevenue", { length: 32 }).default("0"),
  totalRevenue: varchar("totalRevenue", { length: 32 }).default("0"),
  cashback: varchar("cashback", { length: 32 }).default("0"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BookingRevenue = typeof bookingRevenue.$inferSelect;

// ─────────────────────────────────────────────
// Monthly King Entries（每月營業王）
// ─────────────────────────────────────────────
export const monthlyKingEntries = mysqlTable("monthly_king_entries", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  month: int("month").notNull(),
  name: varchar("name", { length: 64 }).notNull().default(""),
  eventDate: varchar("eventDate", { length: 32 }).default(""),
  revenue: varchar("revenue", { length: 32 }).default("0"),
  mvp: varchar("mvp", { length: 128 }).default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonthlyKingEntry = typeof monthlyKingEntries.$inferSelect;

// ─────────────────────────────────────────────
// NPC Items（我的 NPC 管理）
// ─────────────────────────────────────────────
export const npcItems = mysqlTable("npc_items", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  type: mysqlEnum("type", ["influencer", "kol", "anchor", "artist", "band", "singer"]).notNull(),
  label: varchar("label", { length: 64 }).notNull(), // e.g. "網紅", "KOL", etc.
  description: text("description"),
  imageUrl: text("imageUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NpcItem = typeof npcItems.$inferSelect;

// ── Homepage Banners (BUG 6: carousel with 6+ images) ──
export const homepageBanners = mysqlTable("homepage_banners", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  imageUrl: text("imageUrl").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HomepageBanner = typeof homepageBanners.$inferSelect;

// ── Visual Editor Elements (BUG 7: drag/resize/persist) ──
export const visualEditorElements = mysqlTable("visual_editor_elements", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  pageId: varchar("pageId", { length: 64 }).notNull().default("home"),
  type: mysqlEnum("type", ["text", "image"]).notNull(),
  content: text("content"), // text content or image URL
  x: int("x").default(0).notNull(),
  y: int("y").default(0).notNull(),
  width: int("width").default(200).notNull(),
  height: int("height").default(50).notNull(),
  fontSize: int("fontSize").default(16),
  color: varchar("color", { length: 32 }).default("#ffffff"),
  zIndex: int("zIndex").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VisualEditorElement = typeof visualEditorElements.$inferSelect;

// ─────────────────────────────────────────────
// Page Text Overrides（第14批次-5: 視覺編輯器可點選頁面內原生文字元素進行編輯）
// selector: CSS 選擇器路徑；originalText: 原始文字（備援匹配）；newText: 覆寫文字
// fontScale: 字體縮放百分比（100=原始）；color: 覆寫色彩；hidden: 刪除（隱藏）
// ─────────────────────────────────────────────
export const pageTextOverrides = mysqlTable("page_text_overrides", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  pageId: varchar("pageId", { length: 32 }).notNull(),
  selector: text("selector").notNull(),
  originalText: text("originalText").notNull(),
  newText: text("newText"),
  fontScale: int("fontScale").default(100).notNull(),
  color: varchar("color", { length: 32 }),
  hidden: boolean("hidden").default(false).notNull(),
  offsetX: int("offsetX").default(0).notNull(),
  offsetY: int("offsetY").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PageTextOverride = typeof pageTextOverrides.$inferSelect;

// ─────────────────────────────────────────────
// Ritual Images（慶生儀式圖片管理）
// ─────────────────────────────────────────────
export const ritualImages = mysqlTable("ritual_images", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  ritualType: mysqlEnum("ritualType", ["wish", "korean", "chinese"]).notNull(),
  imageUrl: text("imageUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RitualImage = typeof ritualImages.$inferSelect;

// ─────────────────────────────────────────────
// Task Card Images（部門任務卡圖片）
// ─────────────────────────────────────────────
export const taskCardImages = mysqlTable("task_card_images", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  positionKey: varchar("positionKey", { length: 64 }).notNull(), // boss, host, photo, etc. or "special"
  imageUrl: text("imageUrl").notNull(),
  visible: boolean("visible").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskCardImage = typeof taskCardImages.$inferSelect;

// ─────────────────────────────────────────────
// Special Task Cards（特殊任務卡）
// ─────────────────────────────────────────────
export const specialTaskCards = mysqlTable("special_task_cards", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  visible: boolean("visible").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpecialTaskCard = typeof specialTaskCards.$inferSelect;

// ─────────────────────────────────────────────
// Entity Images（通用多圖上傳 — 支援 menu/npc/ritual 等所有實體多張圖片）
// entityType: "menu" | "npc" | "ritual" | 未來任何新增類型
// entityKey: menu → menuItems.id、npc → npcItems.id、ritual → ritualType (wish/korean/chinese)
// ─────────────────────────────────────────────
export const entityImages = mysqlTable("entity_images", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  entityType: varchar("entityType", { length: 32 }).notNull(),
  entityKey: varchar("entityKey", { length: 64 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  visible: boolean("visible").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EntityImage = typeof entityImages.$inferSelect;

// ─────────────────────────────────────────────
// Branches（分店管理 — 城市地區分店分類，第13批次-15）
// 城市+地區+帳號+密碼 組合作為品牌管理登入憑證
// ─────────────────────────────────────────────
export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  city: varchar("city", { length: 64 }).notNull(),
  district: varchar("district", { length: 64 }).notNull(),
  username: varchar("username", { length: 64 }).notNull(),
  password: varchar("password", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  visible: int("visible").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Branch = typeof branches.$inferSelect;

// ─────────────────────────────────────────────
// Cashier Entries（收銀台 — 收入/支出記帳，第13批次-17）
// kind: income（收入，6類）/ expense（支出，10類）
// category: 收入=plan/food/drink/deposit/other；支出=ingredient/staff/reward/redpacket/rent/utility/ad/gas/other
// ─────────────────────────────────────────────
export const cashierEntries = mysqlTable("cashier_entries", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId"),
  entryDate: varchar("entryDate", { length: 16 }).notNull(), // YYYY-MM-DD
  kind: mysqlEnum("kind", ["income", "expense"]).notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  amount: int("amount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CashierEntry = typeof cashierEntries.$inferSelect;

// ─────────────────────────────────────────────
// Payment Channel Settings（線上付款管道設定 — 每間分店各自管理）
// channel: line_pay | jkopay | twqr
// QR 圖片沿用 entity_images，entityType="payment_qr"、entityKey=channel。
// ─────────────────────────────────────────────
export const paymentChannelSettings = mysqlTable("payment_channel_settings", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  channel: mysqlEnum("channel", ["line_pay", "jkopay", "twqr"]).notNull(),
  visible: boolean("visible").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("payment_channel_settings_branch_channel_unique").on(table.branchId, table.channel),
]);
export type PaymentChannelSetting = typeof paymentChannelSettings.$inferSelect;

// ─────────────────────────────────────────────
// Booking Payments（預約付款紀錄 — 壽星及十位親友各自可付款／退款）
// payerKey: host | host_prepay | host_refund | host_paid | role key
// status: unpaid | paid | refunded
// ─────────────────────────────────────────────
export const bookingPayments = mysqlTable("booking_payments", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  bookingId: int("bookingId").notNull(),
  payerKey: varchar("payerKey", { length: 64 }).notNull(),
  payerLabel: varchar("payerLabel", { length: 64 }).notNull(),
  method: mysqlEnum("method", ["line_pay", "jkopay", "twqr", "cash"]).notNull(),
  status: mysqlEnum("status", ["unpaid", "paid", "refunded"]).default("unpaid").notNull(),
  amount: int("amount").default(0).notNull(),
  contactPhone: varchar("contactPhone", { length: 32 }),
  paidAt: timestamp("paidAt"),
  refundedAt: timestamp("refundedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("booking_payments_booking_payer_unique").on(table.bookingId, table.payerKey),
  index("booking_payments_branch_method_idx").on(table.branchId, table.method),
]);
export type BookingPayment = typeof bookingPayments.$inferSelect;

// ─────────────────────────────────────────────
// Experience Media（第16批次-8: 真實體驗牆 活動照片/慶生影片）
// ─────────────────────────────────────────────
export const experienceMedia = mysqlTable("experience_media", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").default(1).notNull(),
  mediaType: mysqlEnum("mediaType", ["photo", "video"]).notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 256 }).notNull().default(""),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ExperienceMedia = typeof experienceMedia.$inferSelect;

// ── Booking Calendar (17-4/5) ──
export const bookingCalendar = mysqlTable("booking_calendar", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branch_id").notNull().default(1),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  status: varchar("status", { length: 50 }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(0),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().default(0),
});
