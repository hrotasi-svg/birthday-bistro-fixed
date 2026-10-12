import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schemaSource = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const adminSource = readFileSync(new URL("../client/src/pages/AdminDashboard.tsx", import.meta.url), "utf8");
const memberSource = readFileSync(new URL("../client/src/pages/MemberPage.tsx", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../client/src/pages/MainFunctionPage.tsx", import.meta.url), "utf8");
const upgradeSource = readFileSync(new URL("../client/src/pages/MyNpcPage.tsx", import.meta.url), "utf8");

describe("第38批次會員黑卡與升級體驗", () => {
  it("persists black-card image and visibility through the existing member update chain", () => {
    expect(schemaSource).toContain('blackCardImageUrl: varchar("blackCardImageUrl", { length: 1024 })');
    expect(schemaSource).toContain('blackCardImageVisible: boolean("blackCardImageVisible").default(true).notNull()');
    expect(dbSource).toContain("updateSet.blackCardImageUrl = data.blackCardImageUrl");
    expect(dbSource).toContain("updateSet.blackCardImageVisible = data.blackCardImageVisible");
    expect(routerSource).toContain("uploadBlackCardImage");
    expect(adminSource).toContain("選擇圖片");
    expect(memberSource).toContain("blackCardImageVisible &&");
  });

  it("uses the new uploaded main-menu asset and birthday-countdown hit zone", () => {
    expect(mainSource).toContain("Screenshot_20260814-003844_ZArchiver_f4a19117.jpg");
    expect(mainSource).toContain('{ id: "H", left: "25%", top: "69.5%", width: "31%", height: "12%" }');
    expect(mainSource).toContain('{ id: "I", title: "升級體驗", desc: "【升級會員】", path: "/npc" }');
  });

  it("keeps the original NPC view available under the new upgrade entry flow", () => {
    expect(upgradeSource).toContain("加入高級會員，搶先解鎖限定體驗");
    expect(upgradeSource).toContain("打造屬於你的專屬餐酒館");
    expect(upgradeSource).toContain("老闆風格");
    expect(upgradeSource).toContain("老闆實驗室");
    expect(upgradeSource).toContain('const openOriginalNpc = () => setView("npc")');
  });
});
