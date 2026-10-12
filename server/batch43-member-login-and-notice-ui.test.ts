import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const memberSource = readFileSync(new URL("../client/src/pages/MemberPage.tsx", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../client/src/pages/MainFunctionPage.tsx", import.meta.url), "utf8");
const myBookingSource = readFileSync(new URL("../client/src/pages/MyBookingPage.tsx", import.meta.url), "utf8");
const bookingSource = readFileSync(new URL("../client/src/pages/BookingPage.tsx", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("../server/db.ts", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("../server/routers.ts", import.meta.url), "utf8");

describe("第44批次電話會員登入與通知顯示", () => {
  it("keeps the original name-phone member lookup as the login action without an OAuth interface", () => {
    expect(memberSource).not.toContain('import { useAuth } from "@/_core/hooks/useAuth"');
    expect(memberSource).not.toContain('import { startLogin } from "@/const"');
    expect(memberSource).toContain("登入會員");
    expect(memberSource).toContain('const MEMBER_LOGIN_SESSION_KEY = "birthdayBistroMemberLogin"');
    expect(memberSource).toContain("sessionStorage.setItem(MEMBER_LOGIN_SESSION_KEY");
    expect(memberSource).toContain("登入會員帳號，隨時掌握您的活動進度");
    expect(memberSource).toContain("審核通過、席位保留、邀請碼等重要通知");
    expect(memberSource).toContain("將直接顯示在「我的活動」");
  });

  it("validates the saved member number and phone before showing or clearing that member's activity notifications", () => {
    expect(dbSource).toContain("memberId?: number");
    expect(dbSource).toContain("eq(users.phone, normalizedPhone)");
    expect(dbSource).toContain("or(eq(bookings.userId, 0), eq(bookings.userId, data.memberId!))");
    expect(routerSource).toContain("markActivityNotificationsRead: publicProcedure");
    expect(myBookingSource).toContain('sessionStorage.getItem("birthdayBistroMemberLogin")');
    expect(myBookingSource).toContain("memberLogin?.memberId");
  });

  it("uses pure red dots at the reference-image positions and retains the confirmation copy placement", () => {
    expect(mainSource).toContain("right-[7%] top-[28%]");
    expect(mainSource).toContain("right-[7%] top-[66%]");
    expect(mainSource).toContain("h-[1.4cqw] w-[1.4cqw]");
    expect(mainSource).not.toContain("ring-2 ring-white");
    expect(bookingSource).toContain('aria-label="活動通知紅點"');
    expect(bookingSource).toContain("absolute -right-0.5 -top-1");
  });

  it("extends the hotspot canvas together with its controls and recolors interactive amber borders pink", () => {
    expect(mainSource).toContain("[transform:scaleX(1.08)]");
    expect(styleSource).toContain('button[class*="border-amber-"]');
    expect(styleSource).toContain("border-color: #ec4899 !important");
  });
});
