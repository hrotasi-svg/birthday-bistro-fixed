import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addEventGuest,
  assignTask,
  confirmPayment,
  createBooking,
  createBookingNotification,
  bindUnassignedBookingsToUserByPhone,
  createDefaultTasks,
  createEvent,
  createInviteCodes,
  createPayment,
  createVideo,
  createShortVideo,
  getAllBookings,
  getAllEvents,
  getAllFinanceRecords,
  getAllTaskPositions,
  getBookingById,
  getBookingNotificationSummary,
  getBookingsByDateRange,
  getBookingsByUser,
  getBookingRevenue,
  getEventById,
  getEventByBookingId,
  getEventGuests,
  getEventsByHost,
  getFinanceByEvent,
  getGuestEventIds,
  getInviteCodesByEvent,
  getMenuItems,
  getPaymentsByEvent,
  getPaidPaymentsByEvent,
  getShortVideos,
  getTasksByEvent,
  getVideosByEvent,
  getUserById,
  getUserByMemberNumber,
  isGuestOfEvent,
  listUsers,
  markInviteCodeUsed,
  markAdminBookingSubmittedRead,
  markMemberBookingNotificationsRead,
  queryBookingsByPhoneDate,
  searchUsers,
  updateBookingHidden,
  updateBookingPaymentPlan,
  updateBookingStatus,
  updateEventFinance,
  updateEventStatus,
  updateTaskStatus,
  updateUserProfile,
  updateUserMemberInfo,
  upsertBookingRevenue,
  upsertMenuItem,
  deleteMenuItem,
  upsertTaskPosition,
  deleteBooking,
  deleteTaskPosition,
  validateInviteCode,
  upsertFinanceRecord,
  getMonthlyLeaderboard,
  getMonthlyLeaderboardWithNames,
  queryBookingsByNameDate,
  FIXED_POSITIONS,
  getAllBookingRevenues,
  deleteInviteCodesByEvent,
  getMonthlyKingEntries,
  upsertMonthlyKingEntry,
  getCurrentMonthBookingsWithRevenue,
  getNpcItems,
  upsertNpcItem,
  deleteNpcItem,
  getAllRitualImages,
  upsertRitualImage,
  deleteRitualImage,
  getTaskCardImages,
  addTaskCardImage,
  deleteTaskCardImage,
  toggleTaskCardImageVisible,
  getSpecialTaskCards,
  addSpecialTaskCard,
  deleteSpecialTaskCard,
  toggleSpecialTaskCardVisible,
  getBookingCalendarByMonth,
  upsertBookingCalendarStatus,
  getBookingCalendarStatus,
  getExperienceSurveyForMember,
  getExperienceSurveyStats,
  submitExperienceSurvey,
  deleteBookingPayments,
  deleteBookingPaymentByPayerKey,
  getBookingPayments,
  getBookingPaymentsByMethod,
  getAllSettings,
  getPaymentChannelSettings,
  upsertBookingPayment,
  upsertPaymentChannelSetting,
} from "./db";
import { storagePut } from "./storage";

// ─── Finance Calculation Engine ───────────────
const FULL_PRICE = { weekday: 39280, student: 29280, holiday: 49280 };
const DEPOSIT_AMOUNT = 1000;

function calculateFinance(revenue: number, cost: number) {
  const profit = revenue - cost;
  const hostShare = profit * 0.5;
  const platformShare = profit * 0.5;
  return { profit, hostShare, platformShare };
}

// ─── Router ───────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  // ── Auth ──────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          birthday: z.string().optional(),
          gender: z.enum(["male", "female", "other"]).optional(),
          job: z.string().optional(),
          skills: z.string().optional(),
          lineId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ── Bookings ──────────────────────────────
  booking: router({
    create: publicProcedure
      .input(
        z.object({
          eventDate: z.string(),
          timeSlot: z.string().optional(),
          guestCount: z.number().min(1).max(100).optional(),
          challengeMode: z.boolean().optional(),
          themeType: z.string().optional(),
          themeCustom: z.string().optional(),
          specialRequests: z.string().optional(),
          sourceChannel: z.string().optional(),
          birthdayName: z.string().optional(),
          birthdayDate: z.string().optional(),
          phone: z.string().optional(),
          lineId: z.string().optional(),
          job: z.string().optional(),
          skills: z.string().optional(),
          sessionType: z.enum(["day", "night"]).optional(),
          ceremonyType: z.enum(["wish", "chinese", "korean"]).optional(),
          challengeLeader: z.boolean().optional(),
          partyThemeChoice: z.enum(["store", "custom"]).optional(),
          partyThemeCustom: z.string().optional(),
          sourceChannels: z.string().optional(),
          paymentPlan: z.string().optional(),
          city: z.string().optional(),
          district: z.string().optional(),
          branchId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // 已登入會員僅在預約電話與本人會員電話相同時綁定；非會員預約維持 userId=0，
        // 原有表單、電話日期查詢與所有預約欄位不變。
        const userPhone = ctx.user?.phone?.trim();
        const bookingUserId = ctx.user && userPhone && input.phone?.trim() === userPhone ? ctx.user.id : 0;
        const bookingId = await createBooking({ ...input, userId: bookingUserId });
        if (bookingId) {
          await createBookingNotification({
            bookingId,
            branchId: input.branchId ?? 1,
            recipient: "admin",
            kind: "booking_submitted",
          });
        }
        return { success: true, bookingId };
      }),

    myList: publicProcedure.query(async () => {
      return getAllBookings();
    }),

    // Public query by name + date (no login required per PRD)
    queryByNameDate: publicProcedure
      .input(z.object({ name: z.string(), date: z.string() }))
      .query(async ({ input }) => {
        return queryBookingsByNameDate(input.name, input.date);
      }),

    // 保留無登入的活動查詢：以日期＋電話取得自己的預約，不讀取其他客人資料。
    queryByPhoneDate: publicProcedure
      .input(z.object({ phone: z.string(), date: z.string(), branchId: z.number().default(1) }))
      .query(async ({ input }) => {
        return queryBookingsByPhoneDate(input.phone, input.date, input.branchId);
      }),

    notificationSummary: publicProcedure
      .input(z.object({
        branchId: z.number().default(1),
        memberId: z.number().optional(),
        phone: z.string().optional(),
        eventDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return getBookingNotificationSummary({ ...input, userId: ctx.user?.id });
      }),

    bindCurrentMemberBookings: protectedProcedure
      .input(z.object({ phone: z.string(), branchId: z.number().default(1) }))
      .mutation(async ({ ctx, input }) => {
        const count = await bindUnassignedBookingsToUserByPhone({
          userId: ctx.user.id,
          phone: input.phone,
          branchId: input.branchId,
        });
        return { success: true, count };
      }),

    markActivityNotificationsRead: publicProcedure
      .input(z.object({ bookingId: z.number(), memberId: z.number().optional(), phone: z.string(), eventDate: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const marked = await markMemberBookingNotificationsRead({ ...input, userId: ctx.user?.id });
        return { success: marked };
      }),

    getCalendar: protectedProcedure
      .input(z.object({ startDate: z.string(), endDate: z.string() }))
      .query(async ({ input }) => {
        return getBookingsByDateRange(input.startDate, input.endDate);
      }),

    // BUG 18: 隱藏鍵
    setHidden: publicProcedure
      .input(z.object({ id: z.number(), hidden: z.boolean() }))
      .mutation(async ({ input }) => {
        await updateBookingHidden(input.id, input.hidden);
        return { success: true };
      }),

    // BUG 20-21: 壽星選擇費用方案後同步到後台
    setPaymentPlan: publicProcedure
      .input(z.object({ id: z.number(), plan: z.string() }))
      .mutation(async ({ input }) => {
        await updateBookingPaymentPlan(input.id, input.plan);
        // Auto-advance linked event to pending_review when plan is selected
        const booking = await getBookingById(input.id);
        if (booking) {
          const event = await getEventByBookingId(booking.id);
          if (event && event.status === "approved") {
            await updateEventStatus(event.id, "pending_review");
          }
        }
        return { success: true };
      }),
  }),

  // ── Events ────────────────────────────────
  event: router({
    create: protectedProcedure
      .input(
        z.object({
          bookingId: z.number().optional(),
          title: z.string().optional(),
          eventDate: z.string().optional(),
          eventType: z.enum(["weekday", "student", "holiday"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createEvent({ ...input, hostUserId: ctx.user.id });
        return { success: true };
      }),

    myList: protectedProcedure.query(async ({ ctx }) => {
      const hosted = await getEventsByHost(ctx.user.id);
      const guestIds = await getGuestEventIds(ctx.user.id);
      return { hosted, guestEventIds: guestIds };
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const event = await getEventById(input.id);
        if (!event) throw new TRPCError({ code: "NOT_FOUND" });
        return event;
      }),

    getByBookingId: publicProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        return await getEventByBookingId(input.bookingId);
      }),

    updateStatus: publicProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending_review", "approved", "deposit_paid", "locked", "full_paid", "active", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateEventStatus(input.id, input.status);
        return { success: true };
      }),

    getGuests: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return getEventGuests(input.eventId);
      }),
  }),

  // ── Invite Codes ──────────────────────────
  invite: router({
    generate: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ input }) => {
        const existing = await getInviteCodesByEvent(input.eventId);
        if (existing.length === 0) {
          await createInviteCodes(input.eventId, 11);
        }
        return { success: true };
      }),

    list: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return getInviteCodesByEvent(input.eventId);
      }),

    listByBooking: publicProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        const event = await getEventByBookingId(input.bookingId);
        if (!event) return [];
        return getInviteCodesByEvent(event.id);
      }),

    validate: publicProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input }) => {
        const invite = await validateInviteCode(input.code);
        if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "邀請碼不存在" });
        if (invite.expiresAt && invite.expiresAt < new Date())
          throw new TRPCError({ code: "BAD_REQUEST", message: "邀請碼已過期" });
        return { success: true, eventId: invite.eventId };
      }),

    deleteByEvent: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteInviteCodesByEvent(input.eventId);
        return { success: true };
      }),
  }),

  // ── Tasks ─────────────────────────────────
  task: router({
    listByEvent: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return getTasksByEvent(input.eventId);
      }),

    createDefaults: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ input }) => {
        await createDefaultTasks(input.eventId);
        return { success: true };
      }),

    complete: publicProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "done"]) }))
      .mutation(async ({ input }) => {
        await updateTaskStatus(input.id, input.status === "done");
        return { success: true };
      }),

    assign: publicProcedure
      .input(z.object({ id: z.number(), userId: z.number().nullable() }))
      .mutation(async ({ input }) => {
        if (input.userId) await assignTask(input.id, input.userId);
        return { success: true };
      }),

    // BUG 25-26: 部門任務卡職位管理
    listPositions: publicProcedure
      .input(z.object({ branchId: z.number().default(1) }).optional())
      .query(async ({ input }) => {
        return getAllTaskPositions(input?.branchId ?? 1);
      }),

    fixedPositions: publicProcedure.query(() => FIXED_POSITIONS),

    updatePosition: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        roleTitle: z.string(),
        displayName: z.string().optional(),
        taskDescription: z.string().optional(),
        sortOrder: z.number().optional(),
        branchId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertTaskPosition(input);
        return { success: true };
      }),

    deletePosition: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTaskPosition(input.id);
        return { success: true };
      }),
  }),

  // ── Videos ────────────────────────────────
  video: router({
    upload: protectedProcedure
      .input(
        z.object({
          eventId: z.number(),
          type: z.enum(["selfie", "close", "medium", "wide", "behind", "fun"]).optional(),
          url: z.string(),
          fileKey: z.string().optional(),
          duration: z.number().optional(),
          message: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createVideo({ eventId: input.eventId, userId: ctx.user.id, url: input.url, type: input.type, fileKey: input.fileKey, duration: input.duration, message: input.message });
        return { success: true };
      }),

    listByEvent: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return getVideosByEvent(input.eventId);
      }),

    getUploadUrl: protectedProcedure
      .input(z.object({ filename: z.string(), contentType: z.string() }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        const key = `videos/${Date.now()}-${input.filename}`;
        const result = await storagePut(key, Buffer.alloc(0), input.contentType);
        return { uploadUrl: result.url, key };
      }),
  }),

  // ── Short Videos (BUG 27-31) ──────────────
  shortVideo: router({
    list: publicProcedure
      .input(z.object({ position: z.string().optional(), eventId: z.number().optional(), branchId: z.number().default(1) }))
      .query(async ({ input }) => {
        if (input.eventId) {
          const { getShortVideosByEvent } = await import("./db");
          return getShortVideosByEvent(input.eventId, input.position);
        }
        return getShortVideos(input.position, input.branchId);
      }),

    upload: publicProcedure
      .input(z.object({
        eventId: z.number().optional(),
        position: z.string(),
        angle: z.string(),
        videoUrl: z.string().optional(),
        fileKey: z.string().optional(),
        branchId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await createShortVideo({ eventId: input.eventId, position: input.position, angle: input.angle, videoUrl: input.videoUrl, fileKey: input.fileKey, branchId: input.branchId });
        return { success: true };
      }),
    getDownloadUrl: publicProcedure
      .input(z.object({ fileKey: z.string() }))
      .query(async ({ input }) => {
        const { storageGetSignedUrl } = await import("./storage");
        const url = await storageGetSignedUrl(input.fileKey);
        return { url };
      }),
    uploadFile: publicProcedure
      .input(z.object({
        eventId: z.number().optional(),
        position: z.string(),
        angle: z.string(),
        base64: z.string(),
        contentType: z.string().default("video/mp4"),
        filename: z.string().default("video.mp4"),
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        const buf = Buffer.from(input.base64, "base64");
        // Use ASCII-only key to avoid S3 presign errors with Chinese characters
        const safeFilename = input.filename.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "video.mp4";
        const key = `videos/evt${input.eventId || 0}_${Date.now()}_${safeFilename}`;
        const result = await storagePut(key, buf, input.contentType);
        await createShortVideo({ eventId: input.eventId, position: input.position, angle: input.angle, videoUrl: result.url, fileKey: result.key, branchId: (input as any).branchId });
        return { success: true, videoUrl: result.url };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteShortVideo } = await import("./db");
        await deleteShortVideo(input.id);
        return { success: true };
      }),
    deleteByPosition: publicProcedure
      .input(z.object({ eventId: z.number(), position: z.string() }))
      .mutation(async ({ input }) => {
        const { deleteShortVideosByPosition } = await import("./db");
        await deleteShortVideosByPosition(input.eventId, input.position);
        return { success: true };
      }),
    batchDelete: publicProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const { batchDeleteShortVideos } = await import("./db");
        await batchDeleteShortVideos(input.ids);
        return { success: true };
      }),
  }),

  // ── Payments ──────────────────────────────
  payment: router({
    create: publicProcedure
      .input(z.object({
        eventId: z.number(),
        type: z.enum(["deposit", "full"]),
        method: z.string().optional(),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const event = await getEventById(input.eventId);
        if (!event) throw new TRPCError({ code: "NOT_FOUND" });
        const eventType = (event.eventType ?? "weekday") as keyof typeof FULL_PRICE;
        const amount = input.type === "deposit"
          ? DEPOSIT_AMOUNT.toString()
          : FULL_PRICE[eventType].toString();
        await createPayment({ ...input, userId: event.hostUserId, amount });
        return { success: true, amount };
      }),

    confirm: publicProcedure
      .input(z.object({ paymentId: z.number() }))
      .mutation(async ({ input }) => {
        await confirmPayment(input.paymentId);
        return { success: true };
      }),

    listByEvent: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return getPaymentsByEvent(input.eventId);
      }),
  }),

  // ── Finance ───────────────────────────────
  finance: router({
    getByEvent: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        const paidPayments = await getPaidPaymentsByEvent(input.eventId);
        const revenue = paidPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const cost = 0;
        const { profit, hostShare, platformShare } = calculateFinance(revenue, cost);
        await upsertFinanceRecord({
          eventId: input.eventId,
          revenue: revenue.toString(),
          cost: cost.toString(),
          profit: profit.toString(),
          hostShare: hostShare.toString(),
          platformShare: platformShare.toString(),
        });
        return { revenue, cost, profit, hostShare, platformShare };
      }),

    priceTable: publicProcedure.query(() => ({
      deposit: DEPOSIT_AMOUNT,
      weekday: FULL_PRICE.weekday,
      student: FULL_PRICE.student,
      holiday: FULL_PRICE.holiday,
    })),

    monthlyLeaderboard: publicProcedure
      .input(z.object({ month: z.string().optional() }))
      .query(async ({ input }) => {
        return getMonthlyLeaderboard(input.month);
      }),

    // BUG 47-49: leaderboard with real names and challenge dates
    monthlyLeaderboardWithNames: publicProcedure
      .input(z.object({ month: z.string().optional() }))
      .query(async ({ input }) => {
        return getMonthlyLeaderboardWithNames(input.month);
      }),
  }),

  // ── Menu Items (精選菜單) ─────────────────
  menu: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional(), branchId: z.number().default(1) }).optional())
      .query(async ({ input }) => {
        return getMenuItems(input?.category, input?.branchId ?? 1);
      }),

    upsert: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        category: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        branchId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertMenuItem(input);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteMenuItem(input.id);
        return { success: true };
      }),
  }),

  // ── Booking Revenue (BUG 5-9) ─────────────
  revenue: router({
    get: publicProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        const result = await getBookingRevenue(input.bookingId);
        // BUG 2: Return empty object instead of null to prevent tRPC "data is undefined" error
        return result || { bookingId: input.bookingId, mealRevenue: "", drinkRevenue: "", totalRevenue: "", cashback: "" };
      }),

    upsert: publicProcedure
      .input(z.object({
        bookingId: z.number(),
        mealRevenue: z.string().optional(),
        drinkRevenue: z.string().optional(),
        totalRevenue: z.string().optional(),
        cashback: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertBookingRevenue(input);
        return { success: true };
      }),

    listAll: publicProcedure.query(async () => {
      return getAllBookingRevenues();
    }),
  }),

  // ── 第16批次-8: 真實體驗牆 ─────────────────
  experienceWall: router({
    list: publicProcedure
      .input(z.object({ mediaType: z.enum(["photo", "video"]), branchId: z.number().default(1) }))
      .query(async ({ input }) => {
        const { listExperienceMedia } = await import("./db");
        return listExperienceMedia(input.mediaType, input.branchId);
      }),
    upload: publicProcedure
      .input(z.object({ mediaType: z.enum(["photo", "video"]), base64: z.string(), contentType: z.string(), filename: z.string(), branchId: z.number().optional() }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        const { addExperienceMedia } = await import("./db");
        const buf = Buffer.from(input.base64, "base64");
        const safe = input.filename.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || (input.mediaType === "photo" ? "photo.jpg" : "video.mp4");
        const key = `experience/${input.mediaType}/${Date.now()}_${safe}`;
        const result = await storagePut(key, buf, input.contentType);
        await addExperienceMedia({ mediaType: input.mediaType, url: result.url, fileKey: result.key, branchId: input.branchId ?? 1 });
        return { url: result.url };
      }),
    remove: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteExperienceMedia } = await import("./db");
        await deleteExperienceMedia(input.id);
        return { success: true };
      }),
  }),

  // ── Monthly King (每月營業王) ─────────────────
  monthlyKing: router({
    list: publicProcedure
      .input(z.object({ branchId: z.number().default(1) }).optional())
      .query(async ({ input }) => {
        return getMonthlyKingEntries(input?.branchId ?? 1);
      }),
    upsert: publicProcedure
      .input(z.object({ month: z.number(), name: z.string(), eventDate: z.string(), revenue: z.string(), mvp: z.string().optional(), branchId: z.number().optional() }))
      .mutation(async ({ input }) => {
        await upsertMonthlyKingEntry(input);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteMonthlyKingEntry } = await import("./db");
        await deleteMonthlyKingEntry(input.id);
        return { success: true };
      }),
    currentMonth: publicProcedure
      .input(z.object({ branchId: z.number().default(1) }).optional())
      .query(async ({ input }) => {
        return getCurrentMonthBookingsWithRevenue(input?.branchId ?? 1);
      }),
  }),
  // ── Booking Calendar (17-4/5) ──
  bookingCalendar: router({
    listMonth: publicProcedure
      .input(z.object({ branchId: z.number().default(1), yearMonth: z.string() }))
      .query(async ({ input }) => {
        return getBookingCalendarByMonth(input.branchId, input.yearMonth);
      }),
    getDate: publicProcedure
      .input(z.object({ branchId: z.number().default(1), date: z.string() }))
      .query(async ({ input }) => {
        return getBookingCalendarStatus(input.branchId, input.date);
      }),
    upsert: publicProcedure
      .input(z.object({ branchId: z.number().default(1), date: z.string(), status: z.string().nullable() }))
      .mutation(async ({ input }) => {
        await upsertBookingCalendarStatus(input.branchId, input.date, input.status);
        return { success: true };
      }),
  }),

  // ── Member System (BUG 32-46) ─────────────
  member: router({
    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return searchUsers(input.query);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getUserById(input.id);
      }),

    // Public member lookup by name + phone (no OAuth required per PRD BUG 40-46)
    lookupByNamePhone: publicProcedure
      .input(z.object({ name: z.string(), phone: z.string() }))
      .query(async ({ input }) => {
        const all = await searchUsers(input.name);
        return all.filter((u: any) => u.phone === input.phone);
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        memberRole: z.enum(["general", "friend", "host", "premium"]).optional(),
        premiumStatus: z.enum(["none", "subscribed", "expired"]).optional(),
        premiumStartDate: z.string().optional(),
        premiumEndDate: z.string().optional(),
        blackCardMethod: z.enum(["host", "friend", "subscription", "none"]).optional(),
        blackCardDate: z.string().optional(),
        blackCardExpiry: z.string().optional(),
        blackCardNo: z.string().optional(),
        blackCardImageUrl: z.string().optional(),
        blackCardImageVisible: z.boolean().optional(),
        memberNumber: z.string().optional(),
        subscriptionPlatform: z.string().optional(),
        blackCardBenefit: z.string().optional(),
        blackCardAcquiredBy: z.string().optional(),
        appAutoRenew: z.boolean().optional(),
        appCancelStatus: z.string().optional(),
        appPromo: z.string().optional(),
        birthdayWish: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateUserMemberInfo(input.id, input);
        return { success: true };
      }),

    uploadBlackCardImage: publicProcedure
      .input(z.object({ base64: z.string(), contentType: z.string(), filename: z.string() }))
      .mutation(async ({ input }) => {
        const buf = Buffer.from(input.base64, "base64");
        const safeFilename = input.filename.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "black-card.jpg";
        const { url } = await storagePut(`member-black-cards/${Date.now()}_${safeFilename}`, buf, input.contentType);
        return { url };
      }),

    // Register new member (no OAuth required per PRD BUG 40)
    register: publicProcedure
      .input(z.object({
        name: z.string(),
        birthday: z.string(),
        phone: z.string(),
        lineId: z.string(),
        birthdayWish: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { upsertUser } = await import("./db");
        const memberNumber = `MEM${Date.now().toString().slice(-6)}`;
        if (ctx.user) {
          await updateUserProfile(ctx.user.id, {
            name: input.name,
            phone: input.phone,
            birthday: input.birthday,
            lineId: input.lineId,
          });
          await updateUserMemberInfo(ctx.user.id, {
            memberNumber,
            memberRole: "general",
            birthdayWish: input.birthdayWish ?? "",
          });
          await bindUnassignedBookingsToUserByPhone({ userId: ctx.user.id, phone: input.phone, branchId: 1 });
          return { success: true, memberNumber, userId: ctx.user.id };
        }
        await upsertUser({
          openId: `local_${input.phone}_${Date.now()}`,
          name: input.name,
          phone: input.phone,
          birthday: input.birthday,
          lineId: input.lineId,
        });
        const users = await searchUsers(input.name);
        const user = users.find((u: any) => u.phone === input.phone);
        if (user) {
          await updateUserMemberInfo(user.id, { memberNumber, memberRole: "general", birthdayWish: input.birthdayWish ?? "" });
          await bindUnassignedBookingsToUserByPhone({ userId: user.id, phone: input.phone, branchId: 1 });
          return { success: true, memberNumber, userId: user.id };
        }
        return { success: true, memberNumber };
      }),

    count: publicProcedure.query(async () => {
      const all = await listUsers();
      return { total: all.length };
    }),
  }),

  // ── Experience Survey（登入會員體驗調查表） ──
  experienceSurvey: router({
    getForMember: publicProcedure
      .input(z.object({ memberId: z.number(), phone: z.string(), branchId: z.number().default(1) }))
      .query(async ({ input }) => getExperienceSurveyForMember(input)),

    submit: publicProcedure
      .input(z.object({
        memberId: z.number(),
        phone: z.string(),
        branchId: z.number().default(1),
        expectation: z.enum(["far_exceeds", "exceeds", "slightly_below", "not_meet"]),
        attendAgain: z.enum(["definitely", "probably", "maybe", "no"]),
        recommend: z.enum(["definitely", "probably", "maybe", "no"]),
        attractions: z.array(z.enum(["包場慶生", "團隊遊戲", "當一日餐酒館老闆", "賺錢機制", "任務挑戰", "營業王競賽", "壽星與朋友共同完成活動", "美食", "調酒"])),
        activityMvp: z.string().max(128).optional(),
        atmosphereMvp: z.string().max(128).optional(),
      }))
      .mutation(async ({ input }) => {
        const success = await submitExperienceSurvey(input);
        if (!success) throw new TRPCError({ code: "FORBIDDEN", message: "會員資料驗證失敗" });
        return { success: true };
      }),

    adminGetForMember: publicProcedure
      .input(z.object({ memberId: z.number(), branchId: z.number().default(1) }))
      .query(async ({ input }) => getExperienceSurveyForMember(input)),

    stats: publicProcedure
      .input(z.object({ branchId: z.number().default(1) }))
      .query(async ({ input }) => getExperienceSurveyStats(input.branchId)),
  }),

  // ── Admin ─────────────────────────────────
  admin: router({
    fixedPositions: publicProcedure.query(() => FIXED_POSITIONS),

    listEvents: publicProcedure.query(async () => {
      return getAllEvents();
    }),

    listBookings: publicProcedure
      .input(z.object({ city: z.string().optional(), district: z.string().optional(), branchId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const all = await getAllBookings();
        // 第15批次-2: 優先依 branchId 過濾（分店資料完全獨立）。
        // 總店（branchId=1）同時涵蓋未標記的舊資料；其他分店僅顯示自己 branchId 的資料。
        const branchId = input?.branchId;
        if (branchId) {
          return (all as any[]).filter((b: any) => {
            const bid = b.branchId ?? null;
            if (bid) return bid === branchId;
            // 無 branchId 的舊資料：依 city/district 判斷，否則歸總店
            const bCity = (b.city || "").trim();
            const bDistrict = (b.district || "").trim();
            if (!bCity && !bDistrict) return branchId === 1;
            if (input?.city && input?.district) {
              return bCity === input.city.trim() && bDistrict === input.district.trim();
            }
            return branchId === 1;
          });
        }
        const city = input?.city?.trim();
        const district = input?.district?.trim();
        // 第13批次-15: 資料依城市地區分類歸屬。
        // 預設分店（高雄市/鳳山區）同時涵蓋未標記城市地區的舊資料；其他分店僅顯示相符資料。
        if (!city || !district) return all;
        const isDefaultBranch = city === "高雄市" && district === "鳳山區";
        return (all as any[]).filter((b: any) => {
          const bCity = (b.city || "").trim();
          const bDistrict = (b.district || "").trim();
          if (!bCity && !bDistrict) return isDefaultBranch;
          return bCity === city && bDistrict === district;
        });
      }),

    approveBooking: publicProcedure
      .input(z.object({ id: z.number(), status: z.enum(["approved", "rejected"]) }))
      .mutation(async ({ input }) => {
        await updateBookingStatus(input.id, input.status);
        if (input.status === "approved") {
          const booking = await getBookingById(input.id);
          if (booking) {
            await markAdminBookingSubmittedRead(booking.id);
            const existingEvent = await getEventByBookingId(booking.id);
            if (!existingEvent) {
              await createEvent({
                bookingId: booking.id,
                hostUserId: booking.userId,
                title: `${booking.eventDate} 生日活動`,
                eventDate: booking.eventDate,
              });
            }
            await createBookingNotification({
              bookingId: booking.id,
              branchId: booking.branchId ?? 1,
              recipient: "customer",
              kind: "booking_approved",
            });
          }
        }
        return { success: true };
      }),

    updateEventStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending_review", "approved", "deposit_paid", "locked", "full_paid", "active", "completed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        await updateEventStatus(input.id, input.status);
        // BUG 22: Auto-generate unique invite codes when full_paid
        if (input.status === "full_paid") {
          const existing = await getInviteCodesByEvent(input.id);
          if (existing.length === 0) {
            await createInviteCodes(input.id, 11);
          }
          const existingTasks = await getTasksByEvent(input.id);
          if (existingTasks.length === 0) {
            await createDefaultTasks(input.id);
          }
          const event = await getEventById(input.id);
          if (event?.bookingId) {
            const booking = await getBookingById(event.bookingId);
            if (booking) {
              await createBookingNotification({
                bookingId: booking.id,
                branchId: booking.branchId ?? 1,
                recipient: "customer",
                kind: "payment_confirmed",
              });
            }
          }
        }
        return { success: true };
      }),

    listUsers: publicProcedure.query(async () => {
      return listUsers();
    }),

    report: publicProcedure.query(async () => {
      const allEvents = await getAllEvents();
      const allFinance = await getAllFinanceRecords();
      const allBookings = await getAllBookings();
      const totalRevenue = allFinance.reduce((s, f) => s + parseFloat(f.revenue ?? "0"), 0);
      const totalProfit = allFinance.reduce((s, f) => s + parseFloat(f.profit ?? "0"), 0);
      const totalHostShare = allFinance.reduce((s, f) => s + parseFloat(f.hostShare ?? "0"), 0);
      const eventsByStatus = allEvents.reduce((acc, e) => {
        acc[e.status] = (acc[e.status] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return {
        totalEvents: allEvents.length,
        totalBookings: allBookings.length,
        totalRevenue, totalProfit, totalHostShare,
        eventsByStatus,
        recentEvents: allEvents.slice(0, 10),
      };
    }),

    confirmPayment: publicProcedure
      .input(z.object({ paymentId: z.number() }))
      .mutation(async ({ input }) => {
        await confirmPayment(input.paymentId);
        return { success: true };
      }),

    leaderboard: publicProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ input }) => {
        return getMonthlyLeaderboardWithNames(`${input.year}-${String(input.month).padStart(2, "0")}`);
      }),
    deleteBooking: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteBooking(input.id);
        return { success: true };
      }),
    uploadMenuImage: publicProcedure
      .input(z.object({ base64: z.string(), contentType: z.string(), filename: z.string() }))
      .mutation(async ({ input }) => {
        const buf = Buffer.from(input.base64, "base64");
        const key = `menu-images/${input.filename}`;
        const { url } = await storagePut(key, buf, input.contentType);
        return { url };
      }),
    uploadNpcImage: publicProcedure
      .input(z.object({ base64: z.string(), contentType: z.string(), filename: z.string() }))
      .mutation(async ({ input }) => {
        const buf = Buffer.from(input.base64, "base64");
        const key = `npc-images/${Date.now()}_${input.filename}`;
        const { url } = await storagePut(key, buf, input.contentType);
        return { url };
      }),
  }),

  // ── NPC Items (我的 NPC) ─────────────────────
  npc: router({
    list: publicProcedure
      .input(z.object({ branchId: z.number().default(1) }).optional())
      .query(async ({ input }) => {
        return getNpcItems(input?.branchId ?? 1);
      }),
    upsert: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        type: z.string(),
        label: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        branchId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertNpcItem(input);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteNpcItem(input.id);
        return { success: true };
      }),
  }),

  // ── Homepage Banners (BUG 6) ─────────────────
  banner: router({
    list: publicProcedure
      .input(z.object({ branchId: z.number().default(1) }).optional())
      .query(async ({ input }) => {
        const { getHomepageBanners } = await import("./db");
        return getHomepageBanners(input?.branchId ?? 1);
      }),
    add: publicProcedure
      .input(z.object({ imageUrl: z.string(), sortOrder: z.number().default(0), branchId: z.number().default(1) }))
      .mutation(async ({ input }) => {
        const { addHomepageBanner } = await import("./db");
        await addHomepageBanner(input.imageUrl, input.sortOrder, input.branchId);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteHomepageBanner } = await import("./db");
        await deleteHomepageBanner(input.id);
        return { success: true };
      }),
    updateOrder: publicProcedure
      .input(z.object({ items: z.array(z.object({ id: z.number(), sortOrder: z.number() })) }))
      .mutation(async ({ input }) => {
        const { updateHomepageBannerOrder } = await import("./db");
        await updateHomepageBannerOrder(input.items);
        return { success: true };
      }),
    upload: publicProcedure
      .input(z.object({ base64: z.string(), contentType: z.string(), filename: z.string() }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        const buf = Buffer.from(input.base64, "base64");
        const key = `banners/${Date.now()}_${input.filename.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "banner.jpg"}`;
        const result = await storagePut(key, buf, input.contentType);
        return { url: result.url };
      }),
  }),

  // ── Visual Editor (BUG 7) ─────────────────
  visualEditor: router({
    list: publicProcedure
      .input(z.object({ pageId: z.string().default("home"), branchId: z.number().default(1) }))
      .query(async ({ input }) => {
        const { getVisualEditorElements } = await import("./db");
        return getVisualEditorElements(input.pageId, input.branchId);
      }),
    upsert: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        pageId: z.string().default("home"),
        type: z.enum(["text", "image"]),
        content: z.string().optional(),
        x: z.number(), y: z.number(),
        width: z.number(), height: z.number(),
        fontSize: z.number().optional(),
        color: z.string().optional(),
        zIndex: z.number().optional(),
        branchId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { upsertVisualEditorElement } = await import("./db");
        const id = await upsertVisualEditorElement(input);
        return { success: true, id };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteVisualEditorElement } = await import("./db");
        await deleteVisualEditorElement(input.id);
        return { success: true };
      }),
    uploadImage: publicProcedure
      .input(z.object({ base64: z.string(), contentType: z.string(), filename: z.string() }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        const buf = Buffer.from(input.base64, "base64");
        const key = `editor/${Date.now()}_${input.filename.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "img.jpg"}`;
        const result = await storagePut(key, buf, input.contentType);
        return { url: result.url };
      }),
    // ── 第14批次-5: 頁面原生文字元素覆寫（點選頁面文字直接編輯） ──
    listTextOverrides: publicProcedure
      .input(z.object({ pageId: z.string().optional(), branchId: z.number().default(1) }))
      .query(async ({ input }) => {
        const { getPageTextOverrides } = await import("./db");
        return getPageTextOverrides(input.pageId, input.branchId);
      }),
    upsertTextOverride: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        pageId: z.string(),
        selector: z.string(),
        originalText: z.string(),
        newText: z.string().nullable().optional(),
        fontScale: z.number().optional(),
        color: z.string().nullable().optional(),
        hidden: z.boolean().optional(),
        offsetX: z.number().optional(),
        offsetY: z.number().optional(),
        branchId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { upsertPageTextOverride } = await import("./db");
        const id = await upsertPageTextOverride(input);
        return { success: true, id };
      }),
    deleteTextOverride: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deletePageTextOverride } = await import("./db");
        await deletePageTextOverride(input.id);
        return { success: true };
      }),
  }),

  // ── Ritual Images ──
  ritual: router({
    list: publicProcedure
      .input(z.object({ branchId: z.number().default(1) }).optional())
      .query(async ({ input }) => {
        return await getAllRitualImages(input?.branchId ?? 1);
      }),
    get: publicProcedure.input(z.object({ type: z.string(), branchId: z.number().default(1) })).query(async ({ input }) => {
      const { getRitualImage } = await import("./db");
      return await getRitualImage(input.type, input.branchId);
    }),
    upload: publicProcedure
      .input(z.object({ type: z.string(), base64: z.string(), contentType: z.string(), filename: z.string(), branchId: z.number().default(1) }))
      .mutation(async ({ input }) => {
        const buf = Buffer.from(input.base64, "base64");
        const key = `ritual/${input.type}_${Date.now()}_${input.filename.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "img.jpg"}`;
        const result = await storagePut(key, buf, input.contentType);
        await upsertRitualImage(input.type, result.url, input.branchId);
        return { url: result.url };
      }),
    delete: publicProcedure.input(z.object({ type: z.string(), branchId: z.number().default(1) })).mutation(async ({ input }) => {
      await deleteRitualImage(input.type, input.branchId);
      return { success: true };
    }),
  }),

  // ── Task Card Images ──
  taskCardImage: router({
    list: publicProcedure.input(z.object({ positionKey: z.string().optional(), branchId: z.number().default(1) }).optional()).query(async ({ input }) => {
      return await getTaskCardImages(input?.positionKey, input?.branchId ?? 1);
    }),
    add: publicProcedure
      .input(z.object({ positionKey: z.string(), imageUrl: z.string(), branchId: z.number().default(1) }))
      .mutation(async ({ input }) => {
        await addTaskCardImage(input.positionKey, input.imageUrl, input.branchId);
        return { success: true };
      }),
    upload: publicProcedure
      .input(z.object({ base64: z.string(), contentType: z.string(), filename: z.string() }))
      .mutation(async ({ input }) => {
        const buf = Buffer.from(input.base64, "base64");
        const key = `taskcard/${Date.now()}_${input.filename.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "img.jpg"}`;
        const result = await storagePut(key, buf, input.contentType);
        return { url: result.url };
      }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteTaskCardImage(input.id);
      return { success: true };
    }),
    toggleVisible: publicProcedure.input(z.object({ id: z.number(), visible: z.boolean() })).mutation(async ({ input }) => {
      await toggleTaskCardImageVisible(input.id, input.visible);
      return { success: true };
    }),
  }),

  // ── Special Task Cards ──
  specialTaskCard: router({
    list: publicProcedure
      .input(z.object({ branchId: z.number().default(1) }).optional())
      .query(async ({ input }) => {
        return await getSpecialTaskCards(input?.branchId ?? 1);
      }),
    add: publicProcedure
      .input(z.object({ title: z.string(), imageUrl: z.string(), branchId: z.number().default(1) }))
      .mutation(async ({ input }) => {
        await addSpecialTaskCard(input.title, input.imageUrl, input.branchId);
        return { success: true };
      }),
    upload: publicProcedure
      .input(z.object({ base64: z.string(), contentType: z.string(), filename: z.string() }))
      .mutation(async ({ input }) => {
        const buf = Buffer.from(input.base64, "base64");
        const key = `specialcard/${Date.now()}_${input.filename.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "img.jpg"}`;
        const result = await storagePut(key, buf, input.contentType);
        return { url: result.url };
      }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteSpecialTaskCard(input.id);
      return { success: true };
    }),
    toggleVisible: publicProcedure.input(z.object({ id: z.number(), visible: z.boolean() })).mutation(async ({ input }) => {
      await toggleSpecialTaskCardVisible(input.id, input.visible);
      return { success: true };
    }),
  }),
  // ── Entity Images（通用多圖上傳：menu/npc/ritual 及未來新增類型）──
  entityImage: router({
    list: publicProcedure
      .input(z.object({ entityType: z.string(), entityKey: z.string().optional(), branchId: z.number().default(1) }))
      .query(async ({ input }) => {
        const { getEntityImages } = await import("./db");
        return await getEntityImages(input.entityType, input.entityKey, input.branchId);
      }),
    upload: publicProcedure
      .input(z.object({
        entityType: z.string(),
        entityKey: z.string(),
        base64: z.string(),
        contentType: z.string(),
        filename: z.string(),
        sortOrder: z.number().default(0),
        branchId: z.number().default(1),
      }))
      .mutation(async ({ input }) => {
        const { addEntityImage } = await import("./db");
        const buf = Buffer.from(input.base64, "base64");
        const safeName = input.filename.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "img.jpg";
        const key = `entity/${input.entityType}_${input.entityKey}_${Date.now()}_${safeName}`;
        const result = await storagePut(key, buf, input.contentType);
        await addEntityImage(input.entityType, input.entityKey, result.url, input.sortOrder, input.branchId);
        return { url: result.url };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteEntityImage } = await import("./db");
        await deleteEntityImage(input.id);
        return { success: true };
      }),
    // 第14批次-4: 圖片 顯示/隱藏
    setVisible: publicProcedure
      .input(z.object({ id: z.number(), visible: z.boolean() }))
      .mutation(async ({ input }) => {
        const { setEntityImageVisible } = await import("./db");
        await setEntityImageVisible(input.id, input.visible);
        return { success: true };
      }),
  }),

  // ─── 分店管理（第13批次-15）───────────────────
  branch: router({
    list: publicProcedure.query(async () => {
      const { getBranches } = await import("./db");
      return getBranches();
    }),
    add: publicProcedure
      .input(z.object({
        city: z.string().min(1),
        district: z.string().min(1),
        username: z.string().min(1),
        password: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { addBranch } = await import("./db");
        await addBranch(input);
        return { success: true };
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        city: z.string().min(1),
        district: z.string().min(1),
        username: z.string().min(1),
        password: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { updateBranch } = await import("./db");
        const { id, ...data } = input;
        await updateBranch(id, data);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteBranch } = await import("./db");
        await deleteBranch(input.id);
        return { success: true };
      }),
    toggleVisible: publicProcedure
      .input(z.object({ id: z.number(), visible: z.boolean() }))
      .mutation(async ({ input }) => {
        const { toggleBranchVisible } = await import("./db");
        await toggleBranchVisible(input.id, input.visible);
        return { success: true };
      }),
    verifyLogin: publicProcedure
      .input(z.object({
        city: z.string(),
        district: z.string(),
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { verifyBranchLogin } = await import("./db");
        const branch = await verifyBranchLogin(input.city, input.district, input.username, input.password);
        if (!branch) return { success: false as const };
        return { success: true as const, branchId: branch.id, city: branch.city, district: branch.district };
      }),
    // ─── 第14批次-7：總部儀表板 ───
    hqSummary: publicProcedure.query(async () => {
      const { getBranches, getAllBookingsRaw, getCashierNetByBranch, getAllBookingRevenues } = await import("./db");
      const [branches, bookings, cashierNet, revenues] = await Promise.all([
        getBranches(),
        getAllBookingsRaw(),
        getCashierNetByBranch(),
        getAllBookingRevenues(),
      ]);
      const revByBooking = new Map<number, number>();
      for (const r of revenues as any[]) {
        revByBooking.set(r.bookingId, Number(r.totalRevenue) || 0);
      }
      const bookingRev = (b: any) => revByBooking.get(b.id) ?? 0;
      const today = new Date();
      const tzOffset = 8 * 60 * 60 * 1000; // GMT+8
      const todayStr = new Date(today.getTime() + tzOffset).toISOString().slice(0, 10);
      const visible = bookings.filter((b: any) => !b.hidden);
      const totalBookings = visible.length;
      const todayBookings = visible.filter((b: any) => {
        const created = b.createdAt ? new Date(new Date(b.createdAt).getTime() + tzOffset).toISOString().slice(0, 10) : "";
        return created === todayStr;
      }).length;
      const totalRevenue = visible.reduce((sum: number, b: any) => sum + bookingRev(b), 0);
      // 18-4: 總營收改為收銀台累計收入金額
      const totalCashierRevenue = cashierNet.reduce((sum: number, c: any) => sum + Math.max(0, Number(c.net || 0)), 0);
      // 各分店統計：優先以 branchId 歸屬；預設分店（id=1 鳳山總店）同時涵蓋未標記的舊資料
      const perBranch = branches.map((br: any) => {
        const isDefault = br.id === 1;
        const branchBookings = visible.filter((b: any) => {
          if (b.branchId != null) {
            return Number(b.branchId) === Number(br.id);
          }
          const bCity = (b.city || "").trim();
          const bDistrict = (b.district || "").trim();
          if (isDefault && !bCity && !bDistrict) return true;
          return bCity.startsWith(br.city) && bDistrict.startsWith(br.district);
        });
        const revenue = cashierNet.filter((c: any) => (isDefault ? c.branchId == null || c.branchId === br.id : c.branchId === br.id)).reduce((sum: number, c: any) => sum + Math.max(0, Number(c.net || 0)), 0);
        const net = cashierNet.find((c: any) => (isDefault ? c.branchId == null || c.branchId === br.id : c.branchId === br.id));
        const netProfit = cashierNet
          .filter((c: any) => (isDefault ? c.branchId == null || c.branchId === br.id : c.branchId === br.id))
          .reduce((sum: number, c: any) => sum + Number(c.net || 0), 0);
        void net;
        return {
          branchId: br.id,
          city: br.city,
          district: br.district,
          bookingCount: branchBookings.length,
          revenue,
          netProfit,
        };
      });
      perBranch.sort((a: any, b: any) => b.revenue - a.revenue);
      return { totalBookings, todayBookings, totalRevenue: totalCashierRevenue, branches: perBranch };
    }),
  }),

  // ─── 收銀台（第13批次-17）─────────────────────
  cashier: router({
    listByMonth: publicProcedure
      .input(z.object({ year: z.number(), month: z.number(), branchId: z.number().nullable().optional() }))
      .query(async ({ input }) => {
        const { getCashierEntriesByMonth } = await import("./db");
        return getCashierEntriesByMonth(input.year, input.month, input.branchId ?? null);
      }),
    addEntries: publicProcedure
      .input(z.object({
        entries: z.array(z.object({
          entryDate: z.string().min(8),
          kind: z.enum(["income", "expense"]),
          category: z.string().min(1),
          amount: z.number(),
          branchId: z.number().nullable().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { addCashierEntries } = await import("./db");
        await addCashierEntries(input.entries.filter((e) => e.amount > 0));
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteCashierEntry } = await import("./db");
        await deleteCashierEntry(input.id);
        return { success: true };
      }),
  }),

  // ─── 第127批次：我的預約付款／收銀台付款管理 ──────
  bookingPayment: router({
    channelSettings: publicProcedure
      .input(z.object({ branchId: z.number().default(1) }))
      .query(async ({ input }) => getPaymentChannelSettings(input.branchId)),
    setChannelVisible: publicProcedure
      .input(z.object({
        branchId: z.number().default(1),
        channel: z.enum(["line_pay", "jkopay", "twqr"]),
        visible: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await upsertPaymentChannelSetting(input);
        return { success: true };
      }),
    listForBooking: publicProcedure
      .input(z.object({ bookingId: z.number(), branchId: z.number().default(1) }))
      .query(async ({ input }) => getBookingPayments(input.bookingId, input.branchId)),
    listByMethod: publicProcedure
      .input(z.object({
        branchId: z.number().default(1),
        method: z.enum(["line_pay", "jkopay", "twqr", "cash"]),
      }))
      .query(async ({ input }) => getBookingPaymentsByMethod(input.branchId, input.method)),
    selectOnlineChannel: publicProcedure
      .input(z.object({
        bookingId: z.number(),
        branchId: z.number().default(1),
        channel: z.enum(["line_pay", "jkopay", "twqr"]),
        amount: z.number().int().nonnegative().default(0),
      }))
      .mutation(async ({ input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking || booking.branchId !== input.branchId) throw new Error("查無指定分店的預約資料");
        await deleteBookingPaymentByPayerKey(input.bookingId, input.branchId, "host_cash");
        await upsertBookingPayment({
          branchId: input.branchId,
          bookingId: input.bookingId,
          payerKey: "host_online",
          payerLabel: "壽星線上付款",
          method: input.channel,
          status: "unpaid",
          amount: input.amount,
        });
        return { success: true };
      }),
    selectCashPayment: publicProcedure
      .input(z.object({
        bookingId: z.number(),
        branchId: z.number().default(1),
        amount: z.number().int().nonnegative().default(0),
      }))
      .mutation(async ({ input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking || booking.branchId !== input.branchId) throw new Error("查無指定分店的預約資料");
        await deleteBookingPaymentByPayerKey(input.bookingId, input.branchId, "host_online");
        await upsertBookingPayment({
          branchId: input.branchId,
          bookingId: input.bookingId,
          payerKey: "host_cash",
          payerLabel: "壽星門店現金繳納",
          method: "cash",
          status: "unpaid",
          amount: input.amount,
        });
        return { success: true };
      }),
    completeCheckoutSelection: publicProcedure
      .input(z.object({
        bookingId: z.number(),
        branchId: z.number().default(1),
        plan: z.enum(["deposit", "student", "weekday", "holiday"]),
        method: z.enum(["cash", "online"]),
        channel: z.enum(["line_pay", "jkopay", "twqr"]).optional(),
      }))
      .mutation(async ({ input }) => {
        if (input.method === "online" && !input.channel) throw new Error("線上付款必須選擇LINE Pay、街口支付或TWQR");
        const booking = await getBookingById(input.bookingId);
        if (!booking || booking.branchId !== input.branchId) throw new Error("查無指定分店的預約資料");
        const settings = await getAllSettings(input.branchId);
        const amountKey = input.plan === "deposit" ? "depositPrice" : input.plan === "student" ? "studentPrice" : input.plan === "weekday" ? "weekdayPrice" : "holidayPrice";
        const defaultAmount = input.plan === "deposit" ? 1000 : input.plan === "student" ? 29280 : input.plan === "weekday" ? 39280 : 49280;
        const amount = Number(settings[amountKey] ?? defaultAmount) || defaultAmount;
        await updateBookingPaymentPlan(input.bookingId, input.plan);
        const event = await getEventByBookingId(input.bookingId);
        if (event && event.status === "approved") await updateEventStatus(event.id, "pending_review");
        await deleteBookingPaymentByPayerKey(input.bookingId, input.branchId, input.method === "online" ? "host_cash" : "host_online");
        await upsertBookingPayment({
          branchId: input.branchId,
          bookingId: input.bookingId,
          payerKey: input.method === "online" ? "host_online" : "host_cash",
          payerLabel: input.method === "online" ? "壽星線上付款" : "壽星門店現金繳納",
          method: input.method === "online" ? input.channel! : "cash",
          status: "unpaid",
          amount,
        });
        return { success: true, amount, method: input.method === "online" ? input.channel : "cash" };
      }),
    setPaymentStatus: publicProcedure
      .input(z.object({
        bookingId: z.number(),
        branchId: z.number().default(1),
        payerKey: z.string().min(1),
        status: z.enum(["unpaid", "paid", "refunded"]),
        contactPhone: z.string().trim().max(32).optional(),
      }))
      .mutation(async ({ input }) => {
        const current = (await getBookingPayments(input.bookingId, input.branchId)).find((item: any) => item.payerKey === input.payerKey);
        if (!current) throw new Error("查無付款紀錄");
        await upsertBookingPayment({
          branchId: input.branchId,
          bookingId: input.bookingId,
          payerKey: current.payerKey,
          payerLabel: current.payerLabel,
          method: current.method,
          status: input.status,
          amount: current.amount,
          contactPhone: input.contactPhone ?? current.contactPhone ?? undefined,
        });
        return { success: true };
      }),
    saveCashAllocations: publicProcedure
      .input(z.object({
        bookingId: z.number(),
        branchId: z.number().default(1),
        roleAllocations: z.array(z.object({ key: z.string().min(1), label: z.string().min(1), amount: z.number().int() })).length(10),
      }))
      .mutation(async ({ input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking || booking.branchId !== input.branchId) throw new Error("查無指定分店的預約資料");
        const validAmounts = [2928, 3928, 4928];
        const firstAmount = input.roleAllocations[0]?.amount;
        if (!validAmounts.includes(firstAmount) || input.roleAllocations.some((item) => item.amount !== firstAmount)) {
          throw new Error("十個職位金額必須相同，且僅可選擇學生2928、一般3928或假日4928");
        }
        await deleteBookingPayments(input.bookingId, input.branchId, "cash");
        for (const item of input.roleAllocations) {
          await upsertBookingPayment({
            branchId: input.branchId,
            bookingId: input.bookingId,
            payerKey: `guest_${item.key}`,
            payerLabel: item.label,
            method: "cash",
            status: "paid",
            amount: item.amount,
          });
        }
        return { success: true, total: firstAmount * 10 };
      }),
    clearCashAllocations: publicProcedure
      .input(z.object({ bookingId: z.number(), branchId: z.number().default(1) }))
      .mutation(async ({ input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking || booking.branchId !== input.branchId) throw new Error("查無指定分店的預約資料");
        await deleteBookingPayments(input.bookingId, input.branchId, "cash");
        return { success: true };
      }),
    updateContactPhone: publicProcedure
      .input(z.object({
        bookingId: z.number(),
        branchId: z.number().default(1),
        payerKey: z.string().min(1),
        contactPhone: z.string().trim().max(32),
      }))
      .mutation(async ({ input }) => {
        const current = (await getBookingPayments(input.bookingId, input.branchId)).find((item: any) => item.payerKey === input.payerKey);
        if (!current) throw new Error("查無付款紀錄");
        await upsertBookingPayment({
          branchId: input.branchId,
          bookingId: input.bookingId,
          payerKey: current.payerKey,
          payerLabel: current.payerLabel,
          method: current.method,
          status: current.status,
          amount: current.amount,
          contactPhone: input.contactPhone,
        });
        return { success: true };
      }),
    setCashNotice: publicProcedure
      .input(z.object({
        bookingId: z.number(),
        branchId: z.number().default(1),
        notice: z.enum(["payment_complete", "guest_prepay", "host_refund"]),
        contactPhone: z.string().trim().max(32).optional(),
      }))
      .mutation(async ({ input }) => {
        const payments = await getBookingPayments(input.bookingId, input.branchId);
        const guestTotal = payments.filter((item: any) => item.method === "cash" && item.payerKey.startsWith("guest_")).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
        const mapping = {
          payment_complete: { payerKey: "cash_notice", payerLabel: "付款完成", status: "paid" as const },
          guest_prepay: { payerKey: "cash_notice", payerLabel: "親友預繳", status: "paid" as const },
          host_refund: { payerKey: "cash_notice", payerLabel: "壽星退款", status: "refunded" as const },
        };
        const target = mapping[input.notice];
        await upsertBookingPayment({
          branchId: input.branchId,
          bookingId: input.bookingId,
          payerKey: target.payerKey,
          payerLabel: target.payerLabel,
          method: "cash",
          status: target.status,
          amount: guestTotal,
          contactPhone: input.contactPhone || undefined,
        });
        return { success: true, amount: guestTotal };
      }),
  }),
});

export type AppRouter = typeof appRouter;
      // 18-4: 總營收改為收銀台累計金額（非當日營業額累計）
