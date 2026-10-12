import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schemaSource = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../client/src/pages/MainFunctionPage.tsx", import.meta.url), "utf8");
const bookingSource = readFileSync(new URL("../client/src/pages/BookingPage.tsx", import.meta.url), "utf8");
const myBookingSource = readFileSync(new URL("../client/src/pages/MyBookingPage.tsx", import.meta.url), "utf8");
const moreSource = readFileSync(new URL("../client/src/pages/MorePage.tsx", import.meta.url), "utf8");
const brandInfoSource = readFileSync(new URL("../client/src/pages/BrandInfoPage.tsx", import.meta.url), "utf8");
const backgroundEditorSource = readFileSync(new URL("../client/src/pages/AdminDashboard.tsx", import.meta.url), "utf8");

describe("第41批次預約通知、使用者條款與背景保存", () => {
  it("stores notification state independently for each booking and notification step", () => {
    expect(schemaSource).toContain('booking_notifications');
    expect(schemaSource).toContain('booking_notifications_booking_kind_unique');
    expect(schemaSource).toContain('"booking_submitted", "booking_approved", "payment_confirmed"');
    expect(schemaSource).toContain('readAt: timestamp("readAt")');
  });

  it("creates the three persistent notifications at submission, approval, and completed-payment transitions", () => {
    expect(routerSource).toContain('kind: "booking_submitted"');
    expect(routerSource).toContain('kind: "booking_approved"');
    expect(routerSource).toContain('kind: "payment_confirmed"');
    expect(routerSource).toContain("markAdminBookingSubmittedRead(booking.id)");
  });

  it("retains date-and-phone activity lookup while notification read access validates either linked User ID or the existing member number and phone", () => {
    expect(dbSource).toContain("queryBookingsByPhoneDate(phone: string, date: string, branchId = 1)");
    expect(dbSource).toContain("markMemberBookingNotificationsRead");
    expect(dbSource).toContain("eq(bookings.userId, data.userId)");
    expect(dbSource).toContain("eq(bookings.phone, normalizedPhone)");
    expect(dbSource).toContain("eq(users.phone, normalizedPhone)");
    expect(dbSource).toContain("eq(bookings.eventDate, data.eventDate)");
    expect(myBookingSource).toContain("trpc.booking.queryByPhoneDate.useQuery");
    expect(myBookingSource).toContain("markActivityNotificationsReadMut.mutate");
  });

  it("renders only the requested red-dot badges on the existing booking and activity entry areas", () => {
    expect(mainSource).toContain("hasBookingUnread");
    expect(mainSource).toContain("hasActivityUnread");
    expect(mainSource).toContain('aria-label="有新的預約通知"');
    expect(mainSource).toContain('aria-label="有新的活動通知"');
    expect(bookingSource).toContain('localStorage.setItem("bookingActivityLookup"');
  });

  it("sets the More-page text to user terms in code and verifies page-background persistence before reloading the iframe", () => {
    expect(moreSource).toContain('{ title: "使用者條款", path: "/brand?tab=terms" }');
    expect(moreSource).not.toContain('{ title: "品牌管理", path: "/admin-login" }');
    expect(brandInfoSource).toContain("function getRequestedTab()");
    expect(brandInfoSource).toContain("const requestedTab = getRequestedTab()");
    expect(brandInfoSource).toContain("if (requestedTab) setActiveTab(requestedTab)");
    expect(backgroundEditorSource).toContain("const latestSettings = await refetchSettings()");
    expect(backgroundEditorSource).toContain("const persistedSettings = await refetchSettings()");
    expect(backgroundEditorSource).toContain('persistedMap[editorPageId] !== res.url');
    expect(backgroundEditorSource).toContain('reloadUrl.searchParams.set("veditorBackgroundRev"');
  });
});
