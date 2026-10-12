import { eq, and, gte, lte, desc, asc, sql, isNull, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  bookings,
  bookingNotifications,
  events,
  eventGuests,
  inviteCodes,
  tasks,
  videos,
  payments,
  financeRecords,
  systemSettings,
  menuItems,
  taskPositions,
  shortVideos,
  bookingRevenue,
  npcItems,
  experienceSurveys,
  bookingPayments,
  paymentChannelSettings,
} from "../drizzle/schema";
import { ENV } from './_core/env';

// ─── 第15批次-2: 分店資料隔離 ───
// 每組【城市+地區+帳號+密碼】= 一個獨立壽星餐酒館資料分類（branchId）
// branchId=1 為高雄市鳳山區總店（既有資料）。查詢時 branchId=1 亦涵蓋 NULL 舊資料。
export function branchWhere(col: any, branchId: number) {
  if (branchId === 1) return sql`(${col} = 1 OR ${col} IS NULL)`;
  return eq(col, branchId);
}
// system_settings 分店隔離：key 前綴 b{branchId}:（branchId=1 總店用原 key 向下相容）
export function settingsKeyFor(branchId: number, key: string) {
  return branchId === 1 ? key : `b${branchId}:${key}`;
}

// ─── Public Booking Query (no auth) ───────────
export async function queryBookingsByNameDate(name: string, date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(
    and(
      sql`${bookings.birthdayName} LIKE ${`%${name}%`}`,
      eq(bookings.eventDate, date)
    )
  );
}

export async function queryBookingsByPhoneDate(phone: string, date: string, branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(
    and(
      eq(bookings.phone, phone),
      eq(bookings.eventDate, date),
      branchWhere(bookings.branchId, branchId)
    )
  );
}

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Management ──────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "phone", "birthday", "job", "skills", "lineId"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.gender !== undefined) { values.gender = user.gender; updateSet.gender = user.gender; }
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) { values.lastSignedIn = new Date(); }
    if (Object.keys(updateSet).length === 0) { updateSet.lastSignedIn = new Date(); }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByMemberNumber(memberNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.memberNumber, memberNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchUsers(query: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(sql`${users.name} LIKE ${`%${query}%`} OR ${users.memberNumber} LIKE ${`%${query}%`}`);
}

export async function updateUserProfile(userId: number, data: {
  name?: string; phone?: string; birthday?: string; gender?: "male" | "female" | "other";
  job?: string; skills?: string; lineId?: string;
}) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, unknown> = {};
  if (data.name !== undefined) updateSet.name = data.name;
  if (data.phone !== undefined) updateSet.phone = data.phone;
  if (data.birthday !== undefined) updateSet.birthday = data.birthday;
  if (data.gender !== undefined) updateSet.gender = data.gender;
  if (data.job !== undefined) updateSet.job = data.job;
  if (data.skills !== undefined) updateSet.skills = data.skills;
  if (data.lineId !== undefined) updateSet.lineId = data.lineId;
  if (Object.keys(updateSet).length > 0) {
    await db.update(users).set(updateSet).where(eq(users.id, userId));
  }
}

export async function updateUserMemberInfo(userId: number, data: {
  memberNumber?: string; memberRole?: "general" | "friend" | "host" | "premium";
  premiumStatus?: "none" | "subscribed" | "expired"; premiumStartDate?: string; premiumEndDate?: string;
  blackCardMethod?: "host" | "friend" | "subscription" | "none"; blackCardDate?: string; blackCardExpiry?: string; blackCardNo?: string;
  blackCardImageUrl?: string; blackCardImageVisible?: boolean;
  subscriptionPlatform?: string; blackCardBenefit?: string; blackCardAcquiredBy?: string;
  appAutoRenew?: boolean; appCancelStatus?: string; appPromo?: string; birthdayWish?: string;
}) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, unknown> = {};
  if (data.memberNumber !== undefined) updateSet.memberNumber = data.memberNumber;
  if (data.memberRole !== undefined) updateSet.memberRole = data.memberRole;
  if (data.premiumStatus !== undefined) updateSet.premiumStatus = data.premiumStatus;
  if (data.premiumStartDate !== undefined) updateSet.premiumStartDate = data.premiumStartDate;
  if (data.premiumEndDate !== undefined) updateSet.premiumEndDate = data.premiumEndDate;
  if (data.blackCardMethod !== undefined) updateSet.blackCardMethod = data.blackCardMethod;
  if (data.blackCardDate !== undefined) updateSet.blackCardDate = data.blackCardDate;
  if (data.blackCardExpiry !== undefined) updateSet.blackCardExpiry = data.blackCardExpiry;
  if (data.blackCardNo !== undefined) updateSet.blackCardNo = data.blackCardNo;
  if (data.blackCardImageUrl !== undefined) updateSet.blackCardImageUrl = data.blackCardImageUrl;
  if (data.blackCardImageVisible !== undefined) updateSet.blackCardImageVisible = data.blackCardImageVisible;
  if (data.subscriptionPlatform !== undefined) updateSet.subscriptionPlatform = data.subscriptionPlatform;
  if (data.blackCardBenefit !== undefined) updateSet.blackCardBenefit = data.blackCardBenefit;
  if (data.blackCardAcquiredBy !== undefined) updateSet.blackCardAcquiredBy = data.blackCardAcquiredBy;
  if (data.appAutoRenew !== undefined) updateSet.appAutoRenew = data.appAutoRenew;
  if (data.birthdayWish !== undefined) updateSet.birthdayWish = data.birthdayWish;
  if (data.appCancelStatus !== undefined) updateSet.appCancelStatus = data.appCancelStatus;
  if (data.appPromo !== undefined) updateSet.appPromo = data.appPromo;
  if (Object.keys(updateSet).length > 0) {
    await db.update(users).set(updateSet).where(eq(users.id, userId));
  }
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

// ─── Experience Surveys（體驗調查表） ─────────
export const EXPERIENCE_SURVEY_ATTRACTIONS = [
  "包場慶生", "團隊遊戲", "當一日餐酒館老闆", "賺錢機制", "任務挑戰",
  "營業王競賽", "壽星與朋友共同完成活動", "美食", "調酒",
] as const;

type ExperienceSurveyInput = {
  memberId: number;
  phone: string;
  branchId: number;
  expectation: string;
  attendAgain: string;
  recommend: string;
  attractions: string[];
  activityMvp?: string;
  atmosphereMvp?: string;
};

async function validateExperienceSurveyMember(memberId: number, phone: string) {
  const db = await getDb();
  if (!db) return null;
  const normalizedPhone = phone.trim();
  const rows = await db.select({ id: users.id }).from(users).where(and(
    eq(users.id, memberId),
    eq(users.phone, normalizedPhone),
  )).limit(1);
  return rows[0] ?? null;
}

export async function getExperienceSurveyForMember(data: { memberId: number; branchId: number; phone?: string }) {
  const db = await getDb();
  // tRPC query 必須回傳可序列化資料；未提交調查表以 null 表示，
  // 不可回傳 undefined，否則前台會把正常的空資料視為 query error。
  if (!db) return null;
  if (data.phone && !await validateExperienceSurveyMember(data.memberId, data.phone)) return null;
  const rows = await db.select().from(experienceSurveys).where(and(
    eq(experienceSurveys.memberId, data.memberId),
    eq(experienceSurveys.branchId, data.branchId),
  )).limit(1);
  return rows[0] ?? null;
}

export async function submitExperienceSurvey(data: ExperienceSurveyInput) {
  const db = await getDb();
  if (!db) return false;
  if (!await validateExperienceSurveyMember(data.memberId, data.phone)) return false;
  await db.insert(experienceSurveys).values({
    memberId: data.memberId,
    branchId: data.branchId,
    expectation: data.expectation,
    attendAgain: data.attendAgain,
    recommend: data.recommend,
    attractions: JSON.stringify(data.attractions),
    activityMvp: data.activityMvp?.trim() || null,
    atmosphereMvp: data.atmosphereMvp?.trim() || null,
  }).onDuplicateKeyUpdate({
    set: {
      expectation: data.expectation,
      attendAgain: data.attendAgain,
      recommend: data.recommend,
      attractions: JSON.stringify(data.attractions),
      activityMvp: data.activityMvp?.trim() || null,
      atmosphereMvp: data.atmosphereMvp?.trim() || null,
      updatedAt: new Date(),
    },
  });
  return true;
}

export async function getExperienceSurveyStats(branchId: number) {
  const db = await getDb();
  if (!db) {
    return { total: 0, expectation: { yes: 0, no: 0 }, attendAgain: { yes: 0, no: 0 }, recommend: { yes: 0, no: 0 }, attractions: Object.fromEntries(EXPERIENCE_SURVEY_ATTRACTIONS.map((item) => [item, 0])) };
  }
  const rows = await db.select().from(experienceSurveys).where(branchWhere(experienceSurveys.branchId, branchId));
  const total = rows.length;
  const percent = (count: number) => total ? Math.round((count / total) * 100) : 0;
  const isPositive = (value: string) => value === "far_exceeds" || value === "exceeds" || value === "definitely" || value === "probably";
  const surveyAttractions = rows.flatMap((row) => {
    try {
      const parsed = JSON.parse(row.attractions || "[]");
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  });
  const attractionStats = Object.fromEntries(EXPERIENCE_SURVEY_ATTRACTIONS.map((item) => [
    item,
    percent(surveyAttractions.filter((answer) => answer === item).length),
  ]));
  return {
    total,
    expectation: { yes: percent(rows.filter((row) => isPositive(row.expectation)).length), no: percent(rows.filter((row) => !isPositive(row.expectation)).length) },
    attendAgain: { yes: percent(rows.filter((row) => isPositive(row.attendAgain)).length), no: percent(rows.filter((row) => !isPositive(row.attendAgain)).length) },
    recommend: { yes: percent(rows.filter((row) => isPositive(row.recommend)).length), no: percent(rows.filter((row) => !isPositive(row.recommend)).length) },
    attractions: attractionStats,
  };
}

// ─── Bookings ─────────────────────────────────
export async function createBooking(data: {
  userId: number; eventDate: string; timeSlot?: string; guestCount?: number;
  challengeMode?: boolean; themeType?: string; themeCustom?: string; specialRequests?: string;
  sourceChannel?: string; birthdayName?: string; birthdayDate?: string; phone?: string; lineId?: string;
  job?: string; skills?: string; sessionType?: "day" | "night"; ceremonyType?: "wish" | "chinese" | "korean";
  challengeLeader?: boolean; partyThemeChoice?: "store" | "custom"; partyThemeCustom?: string;
  sourceChannels?: string; paymentPlan?: string;
  city?: string; district?: string; branchId?: number;
}) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(bookings).values({
    userId: data.userId, eventDate: data.eventDate, timeSlot: data.timeSlot, guestCount: data.guestCount,
    challengeMode: data.challengeMode, themeType: data.themeType, themeCustom: data.themeCustom,
    specialRequests: data.specialRequests, sourceChannel: data.sourceChannel,
    birthdayName: data.birthdayName, birthdayDate: data.birthdayDate, phone: data.phone, lineId: data.lineId,
    job: data.job, skills: data.skills, sessionType: data.sessionType, ceremonyType: data.ceremonyType,
    challengeLeader: data.challengeLeader, partyThemeChoice: data.partyThemeChoice,
    partyThemeCustom: data.partyThemeCustom, sourceChannels: data.sourceChannels, paymentPlan: data.paymentPlan,
    city: data.city, district: data.district, branchId: data.branchId ?? 1,
  });
  return Number((result as any)[0]?.insertId ?? (result as any).insertId ?? 0);
}

// 第42批次：只有目前登入帳號的已驗證電話，才可將同電話、同分店的既有匿名預約
// 綁定到該 User ID。此關聯持久化於既有 bookings.userId，無須另建預約系統。
export async function bindUnassignedBookingsToUserByPhone(data: {
  userId: number;
  phone: string;
  branchId: number;
}) {
  const db = await getDb();
  if (!db) return 0;
  const user = await getUserById(data.userId);
  const normalizedPhone = data.phone.trim();
  if (!user?.phone || user.phone.trim() !== normalizedPhone) return 0;
  const result = await db.update(bookings).set({ userId: user.id }).where(and(
    eq(bookings.userId, 0),
    eq(bookings.phone, normalizedPhone),
    branchWhere(bookings.branchId, data.branchId),
  ));
  return Number((result as any)[0]?.affectedRows ?? (result as any).affectedRows ?? 0);
}

type BookingNotificationRecipient = "admin" | "customer";
type BookingNotificationKind = "booking_submitted" | "booking_approved" | "payment_confirmed";

export async function createBookingNotification(data: {
  bookingId: number;
  branchId: number;
  recipient: BookingNotificationRecipient;
  kind: BookingNotificationKind;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(bookingNotifications).values(data).onDuplicateKeyUpdate({
    set: { readAt: null, createdAt: new Date() },
  });
}

export async function getBookingNotificationSummary(data: {
  branchId: number;
  userId?: number;
  memberId?: number;
  phone?: string;
  eventDate?: string;
}) {
  const db = await getDb();
  if (!db) return { hasAdminUnread: false, hasCustomerUnread: false };
  const adminUnread = await db.select({ id: bookingNotifications.id })
    .from(bookingNotifications)
    .where(and(
      eq(bookingNotifications.branchId, data.branchId),
      eq(bookingNotifications.recipient, "admin"),
      isNull(bookingNotifications.readAt)
    ))
    .limit(1);

  const normalizedPhone = data.phone?.trim();
  // 「登入會員」沿用既有姓名＋電話查詢。僅當查出的會員編號與該電話
  // 再次吻合時，才允許此瀏覽器工作階段取得電話相符的活動通知。
  const phoneMember = !data.userId && data.memberId && normalizedPhone
    ? await db.select({ id: users.id }).from(users).where(and(
        eq(users.id, data.memberId),
        eq(users.phone, normalizedPhone),
      )).limit(1)
    : [];

  if (!data.userId && !phoneMember[0]) {
    return { hasAdminUnread: adminUnread.length > 0, hasCustomerUnread: false };
  }

  const customerIdentityWhere = data.userId
    ? eq(bookings.userId, data.userId)
    : and(
        eq(bookings.phone, normalizedPhone!),
        or(eq(bookings.userId, 0), eq(bookings.userId, data.memberId!)),
      );
  const customerUnread = await db.select({ id: bookingNotifications.id })
    .from(bookingNotifications)
    .innerJoin(bookings, eq(bookingNotifications.bookingId, bookings.id))
    .where(and(
      eq(bookingNotifications.branchId, data.branchId),
      eq(bookingNotifications.recipient, "customer"),
      isNull(bookingNotifications.readAt),
      customerIdentityWhere
    ))
    .limit(1);

  return {
    hasAdminUnread: adminUnread.length > 0,
    hasCustomerUnread: customerUnread.length > 0,
  };
}

export async function markMemberBookingNotificationsRead(data: {
  bookingId: number;
  userId?: number;
  memberId?: number;
  phone: string;
  eventDate: string;
}) {
  const db = await getDb();
  if (!db) return false;
  const normalizedPhone = data.phone.trim();
  const phoneMember = !data.userId && data.memberId
    ? await db.select({ id: users.id }).from(users).where(and(
        eq(users.id, data.memberId),
        eq(users.phone, normalizedPhone),
      )).limit(1)
    : [];
  if (!data.userId && !phoneMember[0]) return false;
  const customerIdentityWhere = data.userId
    ? eq(bookings.userId, data.userId)
    : and(
        eq(bookings.phone, normalizedPhone),
        or(eq(bookings.userId, 0), eq(bookings.userId, data.memberId!)),
      );
  const booking = await db.select({ id: bookings.id })
    .from(bookings)
    .where(and(
      eq(bookings.id, data.bookingId),
      customerIdentityWhere,
      eq(bookings.eventDate, data.eventDate),
    ))
    .limit(1);
  if (!booking[0]) return false;

  await db.update(bookingNotifications)
    .set({ readAt: new Date() })
    .where(and(
      eq(bookingNotifications.bookingId, data.bookingId),
      eq(bookingNotifications.recipient, "customer"),
      isNull(bookingNotifications.readAt)
    ));
  return true;
}

export async function markAdminBookingSubmittedRead(bookingId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(bookingNotifications)
    .set({ readAt: new Date() })
    .where(and(
      eq(bookingNotifications.bookingId, bookingId),
      eq(bookingNotifications.recipient, "admin"),
      eq(bookingNotifications.kind, "booking_submitted"),
      isNull(bookingNotifications.readAt)
    ));
}

export async function getBookingsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.userId, userId));
}

export async function getBookingsByDateRange(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(and(gte(bookings.eventDate, startDate), lte(bookings.eventDate, endDate)));
}

export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings);
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0];
}

export async function updateBookingStatus(id: number, status: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return;
  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
}

export async function updateBookingHidden(id: number, hidden: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(bookings).set({ hidden }).where(eq(bookings.id, id));
}

export async function updateBookingPaymentPlan(id: number, plan: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(bookings).set({ paymentPlan: plan }).where(eq(bookings.id, id));
}

// ─── Events ───────────────────────────────────
export async function createEvent(data: {
  bookingId?: number; hostUserId: number; title?: string; eventDate?: string; eventType?: "weekday" | "student" | "holiday";
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(events).values({
    bookingId: data.bookingId, hostUserId: data.hostUserId, title: data.title,
    eventDate: data.eventDate, eventType: data.eventType,
  });
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result[0];
}

export async function getEventByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(eq(events.bookingId, bookingId)).limit(1);
  return result[0];
}

export async function getEventsByHost(hostUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).where(eq(events.hostUserId, hostUserId));
}

export async function getAllEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events);
}

export async function updateEventStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(events).set({ status: status as any }).where(eq(events.id, id));
}

export async function updateEventFinance(id: number, data: {
  totalRevenue?: string; cost?: string; profit?: string; hostShare?: string; platformShare?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(events).set(data as any).where(eq(events.id, id));
}

// ─── Event Guests ─────────────────────────────
export async function addEventGuest(data: {
  eventId: number; userId: number; inviteCode?: string; roleTitle?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(eventGuests).values({
    eventId: data.eventId, userId: data.userId, inviteCode: data.inviteCode, roleTitle: data.roleTitle,
  });
}

export async function getEventGuests(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventGuests).where(eq(eventGuests.eventId, eventId));
}

export async function getGuestEventIds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ eventId: eventGuests.eventId }).from(eventGuests).where(eq(eventGuests.userId, userId));
  return result.map(r => r.eventId);
}

export async function isGuestOfEvent(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(eventGuests).where(and(eq(eventGuests.eventId, eventId), eq(eventGuests.userId, userId))).limit(1);
  return result.length > 0;
}

// ─── Invite Codes ─────────────────────────────
function generateUniqueCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createInviteCodes(eventId: number, count: number = 11) {
  const db = await getDb();
  if (!db) return [];
  const codes: { code: string; eventId: number; type: "host" | "guest"; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const code = generateUniqueCode();
    codes.push({
      code, eventId,
      type: i === 0 ? "host" : "guest",
      label: i === 0 ? "壽星邀請碼" : `親友邀請碼 ${i}`,
    });
  }
  await db.insert(inviteCodes).values(codes);
  return codes.map(c => ({ code: c.code, label: c.label, type: c.type }));
}

export async function getInviteCodesByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inviteCodes).where(eq(inviteCodes.eventId, eventId));
}

export async function validateInviteCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code)).limit(1);
  return result[0];
}

export async function markInviteCodeUsed(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(inviteCodes).set({ used: true }).where(eq(inviteCodes.id, id));
}

// ─── Tasks ────────────────────────────────────
// 11 fixed positions per PRD BUG 25-26
export const FIXED_POSITIONS = [
  "老闆／壽星",
  "主持",
  "攝影",
  "吧檯",
  "收銀",
  "領檯",
  "外場",
  "營運助理",
  "行政主廚",
  "主廚",
  "副主廚",
];

const DEFAULT_TASKS = FIXED_POSITIONS.map((roleTitle) => ({
  roleTitle,
  taskDescription: "",
}));

export async function createDefaultTasks(eventId: number) {
  const db = await getDb();
  if (!db) return;
  const taskData = DEFAULT_TASKS.map((t, i) => ({
    eventId, roleTitle: t.roleTitle, taskDescription: t.taskDescription, sortOrder: i,
  }));
  await db.insert(tasks).values(taskData);
}

export async function getTasksByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.eventId, eventId));
}

export async function updateTaskStatus(id: number, done: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set({ status: done ? "done" : "pending" }).where(eq(tasks.id, id));
}

export async function assignTask(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set({ assignedUserId: userId }).where(eq(tasks.id, id));
}

// ─── Videos ───────────────────────────────────
export async function createVideo(data: {
  eventId: number; userId: number; url: string;
  type?: "selfie" | "close" | "medium" | "wide" | "behind" | "fun";
  fileKey?: string; duration?: number; message?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(videos).values({
    eventId: data.eventId, userId: data.userId, url: data.url, type: data.type,
    fileKey: data.fileKey, duration: data.duration, message: data.message,
  });
}

export async function getVideosByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos).where(eq(videos.eventId, eventId));
}

// ─── Payments ─────────────────────────────────
export async function createPayment(data: {
  eventId: number; userId: number; amount: string; type: "deposit" | "full"; method?: string; note?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(payments).values({
    eventId: data.eventId, userId: data.userId, amount: data.amount, type: data.type, method: data.method, note: data.note,
  });
}

export async function confirmPayment(paymentId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(payments).set({ status: "paid" }).where(eq(payments.id, paymentId));
}

export async function getPaymentsByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.eventId, eventId));
}

export async function getPaidPaymentsByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(and(eq(payments.eventId, eventId), eq(payments.status, "paid")));
}

// ─── Finance Records ──────────────────────────
export async function upsertFinanceRecord(data: {
  eventId: number; revenue: string; cost: string; profit: string; hostShare: string; platformShare: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(financeRecords).values(data).onDuplicateKeyUpdate({
    set: {
      revenue: data.revenue, cost: data.cost, profit: data.profit,
      hostShare: data.hostShare, platformShare: data.platformShare, calculatedAt: new Date(),
    },
  });
}

export async function getFinanceByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(financeRecords).where(eq(financeRecords.eventId, eventId)).limit(1);
  return result[0];
}

export async function getAllFinanceRecords() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(financeRecords);
}

// ─── Leaderboard ──────────────────────────────
export async function getMonthlyLeaderboard(monthStr?: string) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const year = monthStr ? parseInt(monthStr.split("-")[0]) : now.getFullYear();
  const month = monthStr ? parseInt(monthStr.split("-")[1]) : now.getMonth() + 1;
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
  const result = await db
    .select({
      hostUserId: events.hostUserId,
      totalRevenue: sql<number>`SUM(${events.totalRevenue})`,
      totalProfit: sql<number>`SUM(${events.profit})`,
      eventCount: sql<number>`COUNT(*)`,
    })
    .from(events)
    .leftJoin(bookings, eq(events.bookingId, bookings.id))
    .where(and(gte(events.eventDate, startDate), lte(events.eventDate, endDate)))
    .groupBy(events.hostUserId)
    .orderBy(desc(sql`SUM(${events.totalRevenue})`));
  return result;
}

export async function getMonthlyLeaderboardWithNames(monthStr?: string) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const year = monthStr ? parseInt(monthStr.split("-")[0]) : now.getFullYear();
  const month = monthStr ? parseInt(monthStr.split("-")[1]) : now.getMonth() + 1;
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
  const result = await db
    .select({
      hostUserId: events.hostUserId,
      totalRevenue: sql<number>`SUM(COALESCE(${events.totalRevenue}, 0))`,
      eventCount: sql<number>`COUNT(*)`,
      birthdayName: sql<string>`MAX(${bookings.birthdayName})`,
      challengeDate: sql<string>`MAX(${events.eventDate})`,
    })
    .from(events)
    .leftJoin(bookings, eq(events.bookingId, bookings.id))
    .where(and(gte(events.eventDate, startDate), lte(events.eventDate, endDate)))
    .groupBy(events.hostUserId)
    .orderBy(desc(sql`SUM(COALESCE(${events.totalRevenue}, 0))`));
  return result;
}

// ─── System Settings (key-value persistent) ───
export async function getSetting(key: string, branchId = 1): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(systemSettings).where(eq(systemSettings.key, settingsKeyFor(branchId, key))).limit(1);
  return result.length > 0 ? result[0].value : null;
}

export async function getAllSettings(branchId = 1): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(systemSettings);
  const map: Record<string, string> = {};
  const prefix = `b${branchId}:`;
  for (const row of rows) {
    if (branchId === 1) {
      // 總店：只取無前綴 key
      if (!/^b\d+:/.test(row.key)) map[row.key] = row.value ?? "";
    } else if (row.key.startsWith(prefix)) {
      map[row.key.slice(prefix.length)] = row.value ?? "";
    }
  }
  return map;
}

export async function upsertSetting(key: string, value: string, branchId = 1): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(systemSettings).values({ key: settingsKeyFor(branchId, key), value }).onDuplicateKeyUpdate({
    set: { value },
  });
}

export async function upsertSettings(settings: Record<string, string>, branchId = 1): Promise<void> {
  const db = await getDb();
  if (!db) return;
  for (const [key, value] of Object.entries(settings)) {
    await db.insert(systemSettings).values({ key: settingsKeyFor(branchId, key), value }).onDuplicateKeyUpdate({
      set: { value },
    });
  }
}

// ─── Menu Items ───────────────────────────────
export async function getMenuItems(category?: string, branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  if (category) {
    return db.select().from(menuItems).where(and(eq(menuItems.category, category), branchWhere(menuItems.branchId, branchId)));
  }
  return db.select().from(menuItems).where(branchWhere(menuItems.branchId, branchId));
}

export async function upsertMenuItem(data: {
  id?: number; category: string; title?: string; description?: string; imageUrl?: string;
  branchId?: number;
}) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    const updateSet: Record<string, unknown> = {};
    if (data.category !== undefined) updateSet.category = data.category;
    if (data.title !== undefined) updateSet.title = data.title;
    if (data.description !== undefined) updateSet.description = data.description;
    if (data.imageUrl !== undefined) updateSet.imageUrl = data.imageUrl;
    await db.update(menuItems).set(updateSet).where(eq(menuItems.id, data.id));
  } else {
    await db.insert(menuItems).values({
      category: data.category, title: data.title, description: data.description, imageUrl: data.imageUrl,
      branchId: data.branchId ?? 1,
    });
  }
}

export async function deleteMenuItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(menuItems).where(eq(menuItems.id, id));
}

// ─── Task Positions (global department tasks) ─
export async function getAllTaskPositions(branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taskPositions).where(branchWhere(taskPositions.branchId, branchId)).orderBy(taskPositions.sortOrder);
}

export async function upsertTaskPosition(data: {
  id?: number; roleTitle: string; displayName?: string; taskDescription?: string; sortOrder?: number;
  branchId?: number;
}) {
  const db = await getDb();
  if (!db) return;
  const branchId = data.branchId ?? 1;
  // BUG 14: Check if a position with the same roleTitle already exists
  const existing = await db.select().from(taskPositions).where(and(eq(taskPositions.roleTitle, data.roleTitle), branchWhere(taskPositions.branchId, branchId))).limit(1);
  if (data.id || existing.length > 0) {
    const id = data.id ?? existing[0].id;
    const updateSet: Record<string, unknown> = {};
    if (data.displayName !== undefined) updateSet.displayName = data.displayName;
    if (data.taskDescription !== undefined) updateSet.taskDescription = data.taskDescription;
    if (data.sortOrder !== undefined) updateSet.sortOrder = data.sortOrder;
    await db.update(taskPositions).set(updateSet).where(eq(taskPositions.id, id));
  } else {
    await db.insert(taskPositions).values({
      roleTitle: data.roleTitle, displayName: data.displayName,
      taskDescription: data.taskDescription, sortOrder: data.sortOrder ?? 0,
      branchId,
    });
  }
}

export async function deleteTaskPosition(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(taskPositions).where(eq(taskPositions.id, id));
}

// ─── Short Videos ─────────────────────────────
export async function getShortVideos(position?: string, branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  if (position) {
    return db.select().from(shortVideos).where(and(eq(shortVideos.position, position), branchWhere(shortVideos.branchId, branchId)));
  }
  return db.select().from(shortVideos).where(branchWhere(shortVideos.branchId, branchId));
}

export async function getShortVideosByEvent(eventId: number, position?: string) {
  const db = await getDb();
  if (!db) return [];
  if (position) {
    return db.select().from(shortVideos).where(
      and(eq(shortVideos.eventId, eventId), eq(shortVideos.position, position))
    );
  }
  return db.select().from(shortVideos).where(eq(shortVideos.eventId, eventId));
}

export async function createShortVideo(data: {
  eventId?: number; position: string; angle: string; videoUrl?: string; fileKey?: string; uploadedBy?: number;
  branchId?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(shortVideos).values({
    eventId: data.eventId, position: data.position, angle: data.angle, videoUrl: data.videoUrl,
    fileKey: data.fileKey, uploadedBy: data.uploadedBy,
    branchId: data.branchId ?? 1,
  });
}

export async function deleteShortVideosByPosition(eventId: number, position: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(shortVideos).where(
    and(eq(shortVideos.eventId, eventId), eq(shortVideos.position, position))
  );
}

export async function deleteShortVideo(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(shortVideos).where(eq(shortVideos.id, id));
}

// ─── Booking Revenue ──────────────────────────
export async function getBookingRevenue(bookingId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(bookingRevenue).where(eq(bookingRevenue.bookingId, bookingId)).limit(1);
  return result[0] ?? null;
}

export async function upsertBookingRevenue(data: {
  bookingId: number; mealRevenue?: string; drinkRevenue?: string; totalRevenue?: string; cashback?: string;
}) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, unknown> = {};
  if (data.mealRevenue !== undefined) updateSet.mealRevenue = data.mealRevenue;
  if (data.drinkRevenue !== undefined) updateSet.drinkRevenue = data.drinkRevenue;
  if (data.totalRevenue !== undefined) updateSet.totalRevenue = data.totalRevenue;
  if (data.cashback !== undefined) updateSet.cashback = data.cashback;
  await db.insert(bookingRevenue).values({
    bookingId: data.bookingId, ...updateSet as any,
  }).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getAllBookingRevenues() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookingRevenue);
}

export async function deleteInviteCodesByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(inviteCodes).where(eq(inviteCodes.eventId, eventId));
}

// ─── Monthly King Entries ────────────────────────
export async function getMonthlyKingEntries(branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  const { monthlyKingEntries } = await import("../drizzle/schema");
  return db.select().from(monthlyKingEntries).where(branchWhere(monthlyKingEntries.branchId, branchId)).orderBy(monthlyKingEntries.month);
}

// ── 第16批次-8: 真實體驗牆 ──────────────────────
export async function listExperienceMedia(mediaType: "photo" | "video", branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  const { experienceMedia } = await import("../drizzle/schema");
  return db.select().from(experienceMedia)
    .where(and(eq(experienceMedia.mediaType, mediaType), branchWhere(experienceMedia.branchId, branchId)))
    .orderBy(experienceMedia.sortOrder, experienceMedia.id);
}

export async function addExperienceMedia(data: { mediaType: "photo" | "video"; url: string; fileKey: string; branchId?: number }) {
  const db = await getDb();
  if (!db) return;
  const { experienceMedia } = await import("../drizzle/schema");
  await db.insert(experienceMedia).values({
    mediaType: data.mediaType, url: data.url, fileKey: data.fileKey, branchId: data.branchId ?? 1,
  });
}

export async function deleteExperienceMedia(id: number) {
  const db = await getDb();
  if (!db) return;
  const { experienceMedia } = await import("../drizzle/schema");
  await db.delete(experienceMedia).where(eq(experienceMedia.id, id));
}

export async function upsertMonthlyKingEntry(data: { month: number; name: string; eventDate: string; revenue: string; mvp?: string; branchId?: number }) {
  const db = await getDb();
  if (!db) return;
  const { monthlyKingEntries } = await import("../drizzle/schema");
  const branchId = data.branchId ?? 1;
  const existing = await db.select().from(monthlyKingEntries)
    .where(and(eq(monthlyKingEntries.month, data.month), branchWhere(monthlyKingEntries.branchId, branchId))).limit(1);
  if (existing[0]) {
    await db.update(monthlyKingEntries).set({ name: data.name, eventDate: data.eventDate, revenue: data.revenue, mvp: data.mvp ?? existing[0].mvp ?? "" })
      .where(eq(monthlyKingEntries.id, existing[0].id));
  } else {
    await db.insert(monthlyKingEntries).values({
      month: data.month, name: data.name, eventDate: data.eventDate, revenue: data.revenue, mvp: data.mvp ?? "", branchId,
    });
  }
}

export async function deleteMonthlyKingEntry(id: number) {
  const db = await getDb();
  if (!db) return;
  const { monthlyKingEntries } = await import("../drizzle/schema");
  await db.delete(monthlyKingEntries).where(eq(monthlyKingEntries.id, id));
}

export async function getCurrentMonthBookingsWithRevenue(branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  // Get all bookings for this month with revenue
  const allBookings = await db.select().from(bookings).where(branchWhere(bookings.branchId, branchId));
  const allRevenues = await db.select().from(bookingRevenue);
  const revenueMap = new Map(allRevenues.map(r => [r.bookingId, r]));
  const result = allBookings
    .filter(b => b.eventDate && b.eventDate.startsWith(monthStr))
    .map(b => ({
      bookingId: b.id,
      birthdayName: b.birthdayName || "",
      eventDate: b.eventDate || "",
      totalRevenue: revenueMap.get(b.id)?.totalRevenue || "0",
    }))
    .filter(b => parseInt(b.totalRevenue) > 0)
    .sort((a, c) => parseInt(c.totalRevenue) - parseInt(a.totalRevenue));
  return result;
}

export async function deleteBooking(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(bookingNotifications).where(eq(bookingNotifications.bookingId, id));
  await db.delete(bookings).where(eq(bookings.id, id));
}

// ─── NPC Items ──────────────────────────────────
export async function getNpcItems(branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(npcItems).where(branchWhere(npcItems.branchId, branchId));
}

export async function upsertNpcItem(data: {
  id?: number; type: string; label: string; description?: string; imageUrl?: string;
  branchId?: number;
}) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    const updateSet: Record<string, unknown> = {};
    if (data.type !== undefined) updateSet.type = data.type;
    if (data.label !== undefined) updateSet.label = data.label;
    if (data.description !== undefined) updateSet.description = data.description;
    if (data.imageUrl !== undefined) updateSet.imageUrl = data.imageUrl;
    await db.update(npcItems).set(updateSet).where(eq(npcItems.id, data.id));
  } else {
    await db.insert(npcItems).values({
      type: data.type as any, label: data.label, description: data.description, imageUrl: data.imageUrl,
      branchId: data.branchId ?? 1,
    });
  }
}

export async function deleteNpcItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(npcItems).where(eq(npcItems.id, id));
}

export async function batchDeleteShortVideos(ids: number[]) {
  const db = await getDb();
  if (!db || ids.length === 0) return;
  const { inArray } = await import("drizzle-orm");
  await db.delete(shortVideos).where(inArray(shortVideos.id, ids));
}

// ─── Homepage Banners ──────────────────────────────────
export async function getHomepageBanners(branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  const { homepageBanners } = await import("../drizzle/schema");
  return db.select().from(homepageBanners).where(branchWhere(homepageBanners.branchId, branchId)).orderBy(homepageBanners.sortOrder);
}

export async function addHomepageBanner(imageUrl: string, sortOrder: number, branchId = 1) {
  const db = await getDb();
  if (!db) return;
  const { homepageBanners } = await import("../drizzle/schema");
  await db.insert(homepageBanners).values({ imageUrl, sortOrder, branchId });
}

export async function deleteHomepageBanner(id: number) {
  const db = await getDb();
  if (!db) return;
  const { homepageBanners } = await import("../drizzle/schema");
  await db.delete(homepageBanners).where(eq(homepageBanners.id, id));
}

export async function updateHomepageBannerOrder(items: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db) return;
  const { homepageBanners } = await import("../drizzle/schema");
  for (const item of items) {
    await db.update(homepageBanners).set({ sortOrder: item.sortOrder }).where(eq(homepageBanners.id, item.id));
  }
}

// ─── Visual Editor Elements ──────────────────────────────────
export async function getVisualEditorElements(pageId: string, branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  const { visualEditorElements } = await import("../drizzle/schema");
  return db.select().from(visualEditorElements).where(and(eq(visualEditorElements.pageId, pageId), branchWhere(visualEditorElements.branchId, branchId)));
}

export async function upsertVisualEditorElement(data: {
  id?: number; pageId: string; type: "text" | "image"; content?: string;
  x: number; y: number; width: number; height: number;
  fontSize?: number; color?: string; zIndex?: number;
  branchId?: number;
}) {
  const db = await getDb();
  if (!db) return;
  const { visualEditorElements } = await import("../drizzle/schema");
  if (data.id) {
    await db.update(visualEditorElements).set({
      type: data.type, content: data.content || null,
      x: data.x, y: data.y, width: data.width, height: data.height,
      fontSize: data.fontSize ?? 16, color: data.color ?? "#ffffff", zIndex: data.zIndex ?? 1,
    }).where(eq(visualEditorElements.id, data.id));
    return data.id;
  } else {
    const result = await db.insert(visualEditorElements).values({
      pageId: data.pageId, type: data.type, content: data.content || null,
      x: data.x, y: data.y, width: data.width, height: data.height,
      fontSize: data.fontSize ?? 16, color: data.color ?? "#ffffff", zIndex: data.zIndex ?? 1,
      branchId: data.branchId ?? 1,
    });
    return (result as any)[0]?.insertId ?? null;
  }
}

export async function deleteVisualEditorElement(id: number) {
  const db = await getDb();
  if (!db) return;
  const { visualEditorElements } = await import("../drizzle/schema");
  await db.delete(visualEditorElements).where(eq(visualEditorElements.id, id));
}

// ─── Ritual Images ────────────────────────────
export async function getRitualImage(type: string, branchId = 1) {
  const db = await getDb();
  if (!db) return undefined;
  const { ritualImages } = await import("../drizzle/schema");
  const result = await db.select().from(ritualImages).where(and(eq(ritualImages.ritualType, type as any), branchWhere(ritualImages.branchId, branchId))).limit(1);
  return result[0];
}

export async function getAllRitualImages(branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  const { ritualImages } = await import("../drizzle/schema");
  return db.select().from(ritualImages).where(branchWhere(ritualImages.branchId, branchId));
}

export async function upsertRitualImage(type: string, imageUrl: string, branchId = 1) {
  const db = await getDb();
  if (!db) return;
  const { ritualImages } = await import("../drizzle/schema");
  const existing = await db.select().from(ritualImages).where(and(eq(ritualImages.ritualType, type as any), branchWhere(ritualImages.branchId, branchId))).limit(1);
  if (existing[0]) {
    await db.update(ritualImages).set({ imageUrl }).where(eq(ritualImages.id, existing[0].id));
  } else {
    await db.insert(ritualImages).values({ ritualType: type as any, imageUrl, branchId });
  }
}

export async function deleteRitualImage(type: string, branchId = 1) {
  const db = await getDb();
  if (!db) return;
  const { ritualImages } = await import("../drizzle/schema");
  await db.delete(ritualImages).where(and(eq(ritualImages.ritualType, type as any), branchWhere(ritualImages.branchId, branchId)));
}

// ─── Task Card Images ─────────────────────────
export async function getTaskCardImages(positionKey?: string, branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  const { taskCardImages } = await import("../drizzle/schema");
  if (positionKey) {
    return db.select().from(taskCardImages).where(and(eq(taskCardImages.positionKey, positionKey), branchWhere(taskCardImages.branchId, branchId)));
  }
  return db.select().from(taskCardImages).where(branchWhere(taskCardImages.branchId, branchId));
}

export async function addTaskCardImage(positionKey: string, imageUrl: string, branchId = 1) {
  const db = await getDb();
  if (!db) return;
  const { taskCardImages } = await import("../drizzle/schema");
  await db.insert(taskCardImages).values({ positionKey, imageUrl, branchId });
}

export async function deleteTaskCardImage(id: number) {
  const db = await getDb();
  if (!db) return;
  const { taskCardImages } = await import("../drizzle/schema");
  await db.delete(taskCardImages).where(eq(taskCardImages.id, id));
}

export async function toggleTaskCardImageVisible(id: number, visible: boolean) {
  const db = await getDb();
  if (!db) return;
  const { taskCardImages } = await import("../drizzle/schema");
  await db.update(taskCardImages).set({ visible }).where(eq(taskCardImages.id, id));
}

// ─── Special Task Cards ────────────────────────
export async function getSpecialTaskCards(branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  const { specialTaskCards } = await import("../drizzle/schema");
  return db.select().from(specialTaskCards).where(branchWhere(specialTaskCards.branchId, branchId));
}

export async function addSpecialTaskCard(title: string, imageUrl: string, branchId = 1) {
  const db = await getDb();
  if (!db) return;
  const { specialTaskCards } = await import("../drizzle/schema");
  await db.insert(specialTaskCards).values({ title, imageUrl, branchId });
}

export async function deleteSpecialTaskCard(id: number) {
  const db = await getDb();
  if (!db) return;
  const { specialTaskCards } = await import("../drizzle/schema");
  await db.delete(specialTaskCards).where(eq(specialTaskCards.id, id));
}

export async function toggleSpecialTaskCardVisible(id: number, visible: boolean) {
  const db = await getDb();
  if (!db) return;
  const { specialTaskCards } = await import("../drizzle/schema");
  await db.update(specialTaskCards).set({ visible }).where(eq(specialTaskCards.id, id));
}

// ─────────────────────────────────────────────
// Entity Images（通用多圖上傳）
// ─────────────────────────────────────────────
export async function getEntityImages(entityType: string, entityKey?: string, branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  const { entityImages } = await import("../drizzle/schema");
  const { and, asc } = await import("drizzle-orm");
  if (entityKey !== undefined) {
    return db.select().from(entityImages)
      .where(and(eq(entityImages.entityType, entityType), eq(entityImages.entityKey, entityKey), branchWhere(entityImages.branchId, branchId)))
      .orderBy(asc(entityImages.sortOrder), asc(entityImages.id));
  }
  return db.select().from(entityImages)
    .where(and(eq(entityImages.entityType, entityType), branchWhere(entityImages.branchId, branchId)))
    .orderBy(asc(entityImages.sortOrder), asc(entityImages.id));
}
export async function addEntityImage(entityType: string, entityKey: string, imageUrl: string, sortOrder = 0, branchId = 1) {
  const db = await getDb();
  if (!db) return;
  const { entityImages } = await import("../drizzle/schema");
  await db.insert(entityImages).values({ entityType, entityKey, imageUrl, sortOrder, branchId });
}
// 第14批次-4: 慶生儀式管理圖片 顯示/隱藏
export async function setEntityImageVisible(id: number, visible: boolean) {
  const db = await getDb();
  if (!db) return;
  const { entityImages } = await import("../drizzle/schema");
  await db.update(entityImages).set({ visible }).where(eq(entityImages.id, id));
}
export async function deleteEntityImage(id: number) {
  const db = await getDb();
  if (!db) return;
  const { entityImages } = await import("../drizzle/schema");
  await db.delete(entityImages).where(eq(entityImages.id, id));
}

// ─── Branches（分店管理 — 第13批次-15）───────────
export async function getBranches() {
  const db = await getDb();
  if (!db) return [];
  const { branches } = await import("../drizzle/schema");
  return db.select().from(branches).orderBy(asc(branches.id));
}
export async function addBranch(data: { city: string; district: string; username: string; password: string }) {
  const db = await getDb();
  if (!db) return;
  const { branches } = await import("../drizzle/schema");
  await db.insert(branches).values(data);
}
export async function updateBranch(id: number, data: { city: string; district: string; username: string; password: string }) {
  const db = await getDb();
  if (!db) return;
  const { branches } = await import("../drizzle/schema");
  await db.update(branches).set(data).where(eq(branches.id, id));
}
export async function deleteBranch(id: number) {
  const db = await getDb();
  if (!db) return;
  const { branches } = await import("../drizzle/schema");
  await db.delete(branches).where(eq(branches.id, id));
}
export async function toggleBranchVisible(id: number, visible: boolean) {
  const db = await getDb();
  if (!db) return;
  const { branches } = await import("../drizzle/schema");
  await db.update(branches).set({ visible: visible ? 1 : 0 }).where(eq(branches.id, id));
}
export async function verifyBranchLogin(city: string, district: string, username: string, password: string) {
  const db = await getDb();
  if (!db) return null;
  const { branches } = await import("../drizzle/schema");
  // 城市/地區容錯比對：「高雄市」與「高雄」、「鳳山區」與「鳳山」視為相同（去除行政區後綴後比對）
  const norm = (s: string) => (s || "").trim().replace(/[市縣區鄉鎮]/g, "");
  const rows = await db.select().from(branches).where(
    and(
      eq(branches.username, username),
      eq(branches.password, password),
    )
  );
  const match = rows.find((b) => norm(b.city) === norm(city) && norm(b.district) === norm(district));
  return match || null;
}

// ─── Cashier Entries（收銀台 — 第13批次-17）──────
export async function getCashierEntriesByMonth(year: number, month: number, branchId?: number | null) {
  const db = await getDb();
  if (!db) return [];
  const { cashierEntries } = await import("../drizzle/schema");
  const prefix = `${year}-${String(month).padStart(2, "0")}-%`;
  // 第14批次-6：依分店隔離收銀資料。branchId 未提供（預設店）時涵蓋 NULL 舊資料
  const rows = await db.select().from(cashierEntries)
    .where(sql`${cashierEntries.entryDate} LIKE ${prefix}`)
    .orderBy(asc(cashierEntries.entryDate), asc(cashierEntries.id));
  if (branchId === undefined) return rows;
  if (branchId === null) return rows.filter((r) => r.branchId == null);
  return rows.filter((r) => r.branchId === branchId || (branchId === 1 && r.branchId == null));
}

/** 第14批次-7：全部預約原始資料（供總部儀表板統計） */
export async function getAllBookingsRaw() {
  const db = await getDb();
  if (!db) return [];
  const { bookings } = await import("../drizzle/schema");
  return db.select().from(bookings);
}

/** 第14批次-7：各分店收銀淨利（收入-支出，全期間） */
export async function getCashierNetByBranch() {
  const db = await getDb();
  if (!db) return [];
  const { cashierEntries } = await import("../drizzle/schema");
  const rows = await db.select().from(cashierEntries);
  const map = new Map<string, { branchId: number | null; net: number }>();
  for (const r of rows) {
    const key = String(r.branchId ?? "null");
    const cur = map.get(key) || { branchId: r.branchId ?? null, net: 0 };
    cur.net += r.kind === "income" ? r.amount : -r.amount;
    map.set(key, cur);
  }
  return Array.from(map.values());
}
export async function addCashierEntries(entries: { entryDate: string; kind: "income" | "expense"; category: string; amount: number; branchId?: number | null }[]) {
  const db = await getDb();
  if (!db) return;
  const { cashierEntries } = await import("../drizzle/schema");
  if (entries.length === 0) return;
  await db.insert(cashierEntries).values(entries);
}
export async function deleteCashierEntry(id: number) {
  const db = await getDb();
  if (!db) return;
  const { cashierEntries } = await import("../drizzle/schema");
  await db.delete(cashierEntries).where(eq(cashierEntries.id, id));
}

// ─── 第127批次：線上付款設定與預約付款紀錄 ──────
export type PaymentChannel = "line_pay" | "jkopay" | "twqr";
export type BookingPaymentMethod = PaymentChannel | "cash";
export type BookingPaymentStatus = "unpaid" | "paid" | "refunded";

export async function getPaymentChannelSettings(branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentChannelSettings).where(branchWhere(paymentChannelSettings.branchId, branchId));
}

export async function upsertPaymentChannelSetting(data: { branchId: number; channel: PaymentChannel; visible: boolean }) {
  const db = await getDb();
  if (!db) return;
  const current = await db.select().from(paymentChannelSettings).where(and(
    eq(paymentChannelSettings.branchId, data.branchId),
    eq(paymentChannelSettings.channel, data.channel),
  )).limit(1);
  if (current[0]) {
    await db.update(paymentChannelSettings).set({ visible: data.visible }).where(eq(paymentChannelSettings.id, current[0].id));
    return current[0].id;
  }
  const result = await db.insert(paymentChannelSettings).values(data);
  return Number(result[0].insertId);
}

export async function getBookingPayments(bookingId: number, branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookingPayments).where(and(
    eq(bookingPayments.bookingId, bookingId),
    branchWhere(bookingPayments.branchId, branchId),
  )).orderBy(asc(bookingPayments.id));
}

export async function getBookingPaymentsByMethod(branchId: number, method: BookingPaymentMethod) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ payment: bookingPayments, booking: bookings })
    .from(bookingPayments)
    .innerJoin(bookings, eq(bookingPayments.bookingId, bookings.id))
    .where(and(branchWhere(bookingPayments.branchId, branchId), eq(bookingPayments.method, method)))
    .orderBy(desc(bookingPayments.updatedAt));
}

export async function upsertBookingPayment(data: {
  branchId: number;
  bookingId: number;
  payerKey: string;
  payerLabel: string;
  method: BookingPaymentMethod;
  status: BookingPaymentStatus;
  amount: number;
  contactPhone?: string | null;
}) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(bookingPayments).where(and(
    eq(bookingPayments.bookingId, data.bookingId),
    eq(bookingPayments.payerKey, data.payerKey),
  )).limit(1);
  const paidAt = data.status === "paid" ? new Date() : null;
  const refundedAt = data.status === "refunded" ? new Date() : null;
  const values = {
    ...data,
    ...(data.contactPhone !== undefined ? { contactPhone: data.contactPhone } : {}),
    paidAt,
    refundedAt,
  };
  if (existing[0]) {
    await db.update(bookingPayments).set(values).where(eq(bookingPayments.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(bookingPayments).values(values);
  return Number(result[0].insertId);
}

export async function deleteBookingPayments(bookingId: number, branchId: number, method?: BookingPaymentMethod) {
  const db = await getDb();
  if (!db) return;
  const conditions = [eq(bookingPayments.bookingId, bookingId), branchWhere(bookingPayments.branchId, branchId)];
  if (method) conditions.push(eq(bookingPayments.method, method));
  await db.delete(bookingPayments).where(and(...conditions));
}

export async function deleteBookingPaymentByPayerKey(bookingId: number, branchId: number, payerKey: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(bookingPayments).where(and(
    eq(bookingPayments.bookingId, bookingId),
    eq(bookingPayments.payerKey, payerKey),
    branchWhere(bookingPayments.branchId, branchId),
  ));
}

// ─── 第14批次-5: 頁面文字覆寫（視覺編輯器可點選頁面內原生文字元素） ───
export async function getPageTextOverrides(pageId?: string, branchId = 1) {
  const db = await getDb();
  if (!db) return [];
  const { pageTextOverrides } = await import("../drizzle/schema");
  if (pageId) {
    return db.select().from(pageTextOverrides).where(and(eq(pageTextOverrides.pageId, pageId), branchWhere(pageTextOverrides.branchId, branchId)));
  }
  return db.select().from(pageTextOverrides).where(branchWhere(pageTextOverrides.branchId, branchId));
}
export async function upsertPageTextOverride(data: {
  id?: number; pageId: string; selector: string; originalText: string;
  newText?: string | null; fontScale?: number; color?: string | null; hidden?: boolean;
  branchId?: number; offsetX?: number; offsetY?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const { pageTextOverrides } = await import("../drizzle/schema");
  const branchId = data.branchId ?? 1;
  if (data.id) {
    await db.update(pageTextOverrides).set({
      newText: data.newText ?? null,
      fontScale: data.fontScale ?? 100,
      color: data.color ?? null,
      offsetX: data.offsetX ?? 0,
      offsetY: data.offsetY ?? 0,
      hidden: data.hidden ?? false,
    }).where(eq(pageTextOverrides.id, data.id));
    return data.id;
  }
  // 同 pageId+selector 已存在則更新（避免重複記錄）
  const { and } = await import("drizzle-orm");
  const existing = await db.select().from(pageTextOverrides)
    .where(and(eq(pageTextOverrides.pageId, data.pageId), eq(pageTextOverrides.originalText, data.originalText), branchWhere(pageTextOverrides.branchId, branchId)));
  const match = existing.find((r) => r.selector === data.selector);
  if (match) {
    await db.update(pageTextOverrides).set({
      newText: data.newText ?? null,
      fontScale: data.fontScale ?? 100,
      color: data.color ?? null,
      hidden: data.hidden ?? false,
      offsetX: data.offsetX ?? 0,
      offsetY: data.offsetY ?? 0,
    }).where(eq(pageTextOverrides.id, match.id));
    return match.id;
  }
  const result = await db.insert(pageTextOverrides).values({
    pageId: data.pageId,
    selector: data.selector,
    originalText: data.originalText,
    newText: data.newText ?? null,
    fontScale: data.fontScale ?? 100,
    color: data.color ?? null,
    hidden: data.hidden ?? false,
    offsetX: data.offsetX ?? 0,
    offsetY: data.offsetY ?? 0,
    branchId,
  });
  return (result as any)[0]?.insertId ?? null;
}
export async function deletePageTextOverride(id: number) {
  const db = await getDb();
  if (!db) return;
  const { pageTextOverrides } = await import("../drizzle/schema");
  await db.delete(pageTextOverrides).where(eq(pageTextOverrides.id, id));
}

// ── Booking Calendar (17-4/5) ──
export async function getBookingCalendarByMonth(branchId: number, yearMonth: string) {
  const db = await getDb();
  if (!db) return [];
  const { bookingCalendar } = await import("../drizzle/schema");
  return db.select().from(bookingCalendar)
    .where(and(eq(bookingCalendar.branchId, branchId), like(bookingCalendar.date, `${yearMonth}%`)));
}

export async function upsertBookingCalendarStatus(branchId: number, date: string, status: string | null) {
  const db = await getDb();
  if (!db) return;
  const { bookingCalendar } = await import("../drizzle/schema");
  const now = Date.now();
  if (!status) {
    await db.delete(bookingCalendar).where(and(eq(bookingCalendar.branchId, branchId), eq(bookingCalendar.date, date)));
    return;
  }
  await db.insert(bookingCalendar).values({ branchId, date, status, createdAt: now, updatedAt: now })
    .onDuplicateKeyUpdate({ set: { status, updatedAt: now } });
}

export async function getBookingCalendarStatus(branchId: number, date: string) {
  const db = await getDb();
  if (!db) return null;
  const { bookingCalendar } = await import("../drizzle/schema");
  const rows = await db.select().from(bookingCalendar)
    .where(and(eq(bookingCalendar.branchId, branchId), eq(bookingCalendar.date, date)));
  return rows[0] || null;
}
