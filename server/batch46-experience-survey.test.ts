import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const schemaSource = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const memberSource = readFileSync(new URL("../client/src/pages/MemberPage.tsx", import.meta.url), "utf8");
const adminSource = readFileSync(new URL("../client/src/pages/AdminDashboard.tsx", import.meta.url), "utf8");

describe("第46批次體驗調查表資料鏈", () => {
  it("stores a single branch-scoped survey for each member", () => {
    expect(schemaSource).toContain('mysqlTable("experience_surveys"');
    expect(schemaSource).toContain('uniqueIndex("experience_surveys_member_branch_unique").on(table.memberId, table.branchId)');
    expect(schemaSource).toContain('index("experience_surveys_branch_idx").on(table.branchId)');
  });

  it("requires the existing member id and phone combination before exposing or submitting a survey", () => {
    expect(dbSource).toContain("validateExperienceSurveyMember");
    expect(dbSource).toContain("eq(users.id, memberId)");
    expect(dbSource).toContain("eq(users.phone, normalizedPhone)");
    expect(dbSource).toContain("return rows[0] ?? null");
    expect(dbSource).toContain("不可回傳 undefined");
    expect(routerSource).toContain("experienceSurvey: router");
    expect(routerSource).toContain("會員資料驗證失敗");
  });

  it("renders the requested form and hides its entry after a successful submission", () => {
    expect(memberSource).toContain("體驗調查表");
    expect(memberSource).toContain("壽星餐酒館活動問卷調查");
    expect(memberSource).toContain("請選出今日「活動 MVP」");
    expect(memberSource).toContain("最佳氣氛王MVP");
    expect(memberSource).toContain("提交問卷");
    expect(memberSource).toContain("感謝您參與本次 壽星餐酒館 活動！");
    expect(memberSource).toContain("您的每一份回饋，");
    expect(memberSource).toContain("都是我們持續進步的重要力量。");
    expect(memberSource).toContain("setShowExperienceSurvey(false)");
  });

  it("provides the member-center show-hide preview and requested branch percentage analysis", () => {
    expect(adminSource).toContain('label: "問卷管理"');
    expect(adminSource).toContain("顯示調查表");
    expect(adminSource).toContain("隱藏調查表");
    expect(adminSource).toContain("活動有沒有超出期待");
    expect(adminSource).toContain("願不願意再次參加");
    expect(adminSource).toContain("願不願意推薦朋友");
    expect(adminSource).toContain("客人真正被什麼吸引");
  });
});
