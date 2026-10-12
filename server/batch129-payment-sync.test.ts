import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const myBookingSource = readFileSync(resolve(projectRoot, "client/src/pages/MyBookingPage.tsx"), "utf8");
const adminSource = readFileSync(resolve(projectRoot, "client/src/pages/AdminDashboard.tsx"), "utf8");
const routerSource = readFileSync(resolve(projectRoot, "server/routers.ts"), "utf8");
const dbSource = readFileSync(resolve(projectRoot, "server/db.ts"), "utf8");
const schemaSource = readFileSync(resolve(projectRoot, "drizzle/schema.ts"), "utf8");
const resultSource = readFileSync(resolve(projectRoot, "client/src/pages/PaymentResultPage.tsx"), "utf8");

describe("第129批次：收銀台與預約付款同步、親友電話結果頁", () => {
  it("前台線上付款會強制同步付款管道與QR圖片，並排除隱藏圖片", () => {
    expect(myBookingSource).toContain('refetchOnMount: "always"');
    expect(myBookingSource).toContain("refetchOnWindowFocus: true");
    expect(myBookingSource).toContain("image.visible !== false && image.visible !== 0");
    expect(myBookingSource).toContain("entityKey === activeOnlineChannel");
  });

  it("後台壽星預約資訊會顯示收銀台付款方式、金額與狀態", () => {
    expect(adminSource).toContain("getAdminBookingPaymentRows");
    expect(adminSource).toContain("付款方式: {getAdminPaymentMethodLabel(primaryPayment.method)}");
    expect(adminSource).toContain("付款金額／狀態");
    expect(adminSource).toContain("付款狀態：</span>{getAdminPaymentStatusLabel(row.payment.status)}");
  });

  it("結果頁仍可輸入親友電話，現金付款操作則依最新規格改由十職位各自預繳", () => {
    expect(adminSource).not.toContain("friendContactPhoneEditing");
    expect(adminSource).not.toContain("輸入親友聯絡電話");
    expect(adminSource).toContain('openPaymentResult(booking, "guest_prepay", record.payerKey)');
    expect(resultSource).toContain("輸入親友聯絡電話");
  });

  it("付款紀錄與路由會保存親友電話，結果頁可編輯同步", () => {
    expect(schemaSource).toContain('contactPhone: varchar("contactPhone", { length: 32 })');
    expect(dbSource).toContain("contactPhone?: string | null");
    expect(routerSource).toContain("updateContactPhone: publicProcedure");
    expect(routerSource).toContain("contactPhone: input.contactPhone ?? current.contactPhone ?? undefined");
    expect(resultSource).toContain("親愛的 壽星 您好：");
    expect(resultSource).toContain('host_refund: {\n    title: "退款完成・退款確認",\n    greeting: "親愛的 壽星 您好："');
    expect(resultSource).toContain("壽星聯絡電話");
    expect(resultSource).toContain("親友聯絡電話");
    expect(resultSource).toContain("updateContactPhoneMut.mutate");
  });
});
