import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const adminSource = readFileSync(new URL("../client/src/pages/AdminDashboard.tsx", import.meta.url), "utf8");
const bookingSource = readFileSync(new URL("../client/src/pages/BookingPage.tsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../client/src/pages/MainFunctionPage.tsx", import.meta.url), "utf8");
const memberSource = readFileSync(new URL("../client/src/pages/MemberPage.tsx", import.meta.url), "utf8");

describe("第40批次會員卡號、黑卡圖片與主功能雨滴", () => {
  it("keeps the backend-entered black-card number visible even when a card image exists", () => {
    const blackCardSection = memberSource.slice(memberSource.indexOf("黑卡卡號"), memberSource.indexOf("黑卡取得方式"));
    expect(blackCardSection).toContain('<p className="text-amber-400">{blackCardNo}</p>');
    expect(blackCardSection).toContain("{blackCardImageUrl && (");
  });

  it("offers a conditional delete control that clears only the black-card image URL", () => {
    expect(adminSource).toContain("{memberNumResult.blackCardImageUrl && (");
    expect(adminSource).toContain('handleUpdateMember(memberNumResult.id, { blackCardImageUrl: "", blackCardImageVisible: true })');
    expect(adminSource).toContain("刪除");
  });

  it("renders the booking title as plain white text without a gradient fill override", () => {
    const bookingTitle = bookingSource.slice(bookingSource.indexOf("壽星報名表") - 140, bookingSource.indexOf("壽星報名表") + 30);
    expect(bookingTitle).toContain("text-white");
    expect(bookingTitle).not.toContain("WebkitTextFillColor");
  });

  it("shares the exact existing glass-rain component and respects its existing setting on the main menu", () => {
    expect(homeSource).toContain("export function GlassRainEffect()");
    expect(mainSource).toContain('import { GlassRainEffect } from "@/pages/Home";');
    expect(mainSource).toContain("const rainEffectEnabled = settings?.rainEffect !== false;");
    expect(mainSource).toContain("{rainEffectEnabled && <GlassRainEffect />}");
  });
});

