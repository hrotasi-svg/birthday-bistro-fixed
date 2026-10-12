import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const myBookingSource = readFileSync(resolve(projectRoot, "client/src/pages/MyBookingPage.tsx"), "utf8");
const adminSource = readFileSync(resolve(projectRoot, "client/src/pages/AdminDashboard.tsx"), "utf8");
const appSource = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
const resultSource = readFileSync(resolve(projectRoot, "client/src/pages/PaymentResultPage.tsx"), "utf8");

describe("第128批次：付款方式與付款結果頁", () => {
  it("前台移除指定提示、提供現金／線上二選一並阻擋未選付款方式的下一步", () => {
    expect(myBookingSource).not.toContain("請親自至門店繳納");
    expect(myBookingSource).toContain("門店現金繳納");
    expect(myBookingSource).toContain("線上付款");
    expect(myBookingSource).toContain("if (!selectedPaymentMethod)");
    expect(myBookingSource).toContain("if (selectedPaymentMethod === \"online\" && !selectedOnlineChannel)");
    expect(myBookingSource).toContain("付款說明：請使用 LINE Pay 掃描 QR Code 完成付款");
    expect(myBookingSource).toContain("付款說明：請使用 街口支付 掃描 QR Code 完成付款");
    expect(myBookingSource).toContain("付款說明：請使用 TWQR掃描 QR Code 完成付款");
  });

  it("後台線上付款總開關與現金付款電話同步均存在", () => {
    expect(adminSource).toContain("const onlinePaymentsVisible");
    expect(adminSource).toContain("const toggleOnlinePayments");
    expect(adminSource).toContain("線上付款已${nextVisible ? \"顯示\" : \"隱藏\"}");
    expect(adminSource).toContain("聯絡電話：{booking.phone || \"未提供\"}");
    expect(adminSource).toContain("openPaymentResult(booking, \"payment_complete\")");
    expect(adminSource).toContain("openPaymentResult(booking, \"guest_prepay\", record.payerKey)");
    expect(adminSource).toContain("openPaymentResult(booking, \"host_refund\")");
    expect(adminSource).toContain("openPaymentResult(booking, \"guest_refund\", record.payerKey)");
  });

  it("獨立結果頁路由與四類指定文字均存在", () => {
    expect(appSource).toContain('<Route path="/payment-result" component={PaymentResultPage} />');
    expect(resultSource).toContain("付款完成・預約確認");
    expect(resultSource).toContain("親友預繳・付款確認");
    expect(resultSource).toContain("退款完成・退款確認");
    expect(resultSource).toContain("親友退款・退款確認");
    expect(resultSource).toContain('phoneValue}</p>');
    expect(resultSource).toContain("壽星聯絡電話");
    expect(resultSource).toContain("親友聯絡電話");
  });
});
