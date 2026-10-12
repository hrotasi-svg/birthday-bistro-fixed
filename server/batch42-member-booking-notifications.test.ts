import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createBookingNotification, deleteBooking } from "./db";

const schemaSource = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../client/src/pages/MainFunctionPage.tsx", import.meta.url), "utf8");
const myBookingSource = readFileSync(new URL("../client/src/pages/MyBookingPage.tsx", import.meta.url), "utf8");
const bookingSource = readFileSync(new URL("../client/src/pages/BookingPage.tsx", import.meta.url), "utf8");
const moreSource = readFileSync(new URL("../client/src/pages/MorePage.tsx", import.meta.url), "utf8");
const backgroundSource = readFileSync(new URL("../client/src/components/PageBackgroundApplier.tsx", import.meta.url), "utf8");
const editorSource = readFileSync(new URL("../client/src/pages/AdminDashboard.tsx", import.meta.url), "utf8");

describe("第42批次會員預約綁定與指定入口", () => {
  it("uses the existing bookings.userId as the permanent User ID to Booking ID relation", () => {
    expect(schemaSource).toContain('index("bookings_user_branch_idx").on(table.userId, table.branchId)');
    expect(dbSource).toContain("bindUnassignedBookingsToUserByPhone");
    expect(dbSource).toContain("eq(bookings.userId, 0)");
    expect(dbSource).toContain("eq(bookings.phone, normalizedPhone)");
  });

  it("binds a new booking only when the authenticated member phone matches and keeps the original phone-member login path available", () => {
    expect(routerSource).toContain("const bookingUserId = ctx.user && userPhone && input.phone?.trim() === userPhone ? ctx.user.id : 0");
    expect(routerSource).toContain("getBookingNotificationSummary({ ...input, userId: ctx.user?.id })");
    expect(routerSource).toContain("bindCurrentMemberBookings: protectedProcedure");
    expect(routerSource).toContain("markActivityNotificationsRead: publicProcedure");
  });

  it("shows activity red dots for either the retained phone-member login or an authenticated member and preserves public phone-date activity lookup", () => {
    expect(mainSource).toContain("const { isAuthenticated } = useAuth()");
    expect(mainSource).toContain("const hasActivityUnread = (Boolean(memberLogin) || isAuthenticated) && notificationSummary?.hasCustomerUnread === true");
    expect(myBookingSource).toContain("trpc.booking.queryByPhoneDate.useQuery");
    expect(myBookingSource).toContain("enabled: isAuthenticated || Boolean(memberLogin)");
    expect(myBookingSource).toContain("bindCurrentMemberBookingsMut.mutate");
  });

  it("keeps debug login only on the requested More heading and retains confirmation copy", () => {
    expect(moreSource).not.toContain('{ title: "偵錯報告", path: "/admin-login" }');
    expect(moreSource).toContain('onClick={() => navigate("/admin-login")}');
    expect(bookingSource).toContain("點選我的生日倒數，建立會員帳號，</p>");
    expect(bookingSource).toContain("隨時掌握您的的活動進度");
    expect(bookingSource).toContain('aria-label="活動通知紅點"');
  });

  it("keeps background persistence database-backed and adds an editor refresh signal for saved background URLs", () => {
    expect(backgroundSource).toContain("birthday-bistro-background-saved");
    expect(backgroundSource).toContain("veditorBackgroundUrl");
    expect(editorSource).toContain("setEditorBackgroundRevision(Date.now())");
    expect(editorSource).toContain("veditorBackgroundPageId");
  });

  it("persists activity notifications for only the linked member while retaining guest phone-date lookup", async () => {
    const suffix = `${Date.now()}`.slice(-8);
    const phone = `09${suffix}`.slice(0, 10);
    const eventDate = "2099-11-29";
    const memberA = appRouter.createCaller({ user: { id: 424242, phone, name: "第42批次會員A" } } as any);
    const memberB = appRouter.createCaller({ user: { id: 434343, phone: "0988888888", name: "第42批次會員B" } } as any);
    const guest = appRouter.createCaller({ user: null } as any);
    let bookingId = 0;

    try {
      const created = await memberA.booking.create({
        birthdayName: "第42批次會員綁定測試",
        birthdayDate: "2000-01-01",
        phone,
        eventDate,
        sessionType: "day",
        ceremonyType: "wish",
        branchId: 1,
      });
      bookingId = Number(created.bookingId);
      expect(bookingId).toBeGreaterThan(0);

      const publicLookup = await guest.booking.queryByPhoneDate({ phone, date: eventDate, branchId: 1 });
      expect(publicLookup.some((booking: any) => booking.id === bookingId)).toBe(true);

      await createBookingNotification({ bookingId, branchId: 1, recipient: "customer", kind: "booking_approved" });
      expect((await memberA.booking.notificationSummary({ branchId: 1 })).hasCustomerUnread).toBe(true);
      expect((await memberB.booking.notificationSummary({ branchId: 1 })).hasCustomerUnread).toBe(false);
      expect((await guest.booking.notificationSummary({ branchId: 1 })).hasCustomerUnread).toBe(false);

      expect((await memberA.booking.markActivityNotificationsRead({ bookingId, phone, eventDate })).success).toBe(true);
      expect((await memberA.booking.notificationSummary({ branchId: 1 })).hasCustomerUnread).toBe(false);

      await createBookingNotification({ bookingId, branchId: 1, recipient: "customer", kind: "payment_confirmed" });
      expect((await memberA.booking.notificationSummary({ branchId: 1 })).hasCustomerUnread).toBe(true);
      expect((await memberB.booking.notificationSummary({ branchId: 1 })).hasCustomerUnread).toBe(false);
    } finally {
      if (bookingId) await deleteBooking(bookingId);
    }
  }, 20_000);
});
