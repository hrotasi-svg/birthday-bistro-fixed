import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const myBookingSource = readFileSync(resolve(projectRoot, "client/src/pages/MyBookingPage.tsx"), "utf8");
const adminSource = readFileSync(resolve(projectRoot, "client/src/pages/AdminDashboard.tsx"), "utf8");
const routerSource = readFileSync(resolve(projectRoot, "server/routers.ts"), "utf8");
const resultSource = readFileSync(resolve(projectRoot, "client/src/pages/PaymentResultPage.tsx"), "utf8");

describe("第130批次：付款資料鏈與十職位操作", () => {
  it("以單一後端程序同步寫入費用方案、付款方式、金額與活動進度", () => {
    expect(routerSource).toContain("completeCheckoutSelection: publicProcedure");
    expect(routerSource).toContain("await updateBookingPaymentPlan(input.bookingId, input.plan)");
    expect(routerSource).toContain('payerKey: input.method === "online" ? "host_online" : "host_cash"');
    expect(routerSource).toContain('deleteBookingPaymentByPayerKey(input.bookingId, input.branchId, input.method === "online" ? "host_cash" : "host_online")');
    expect(routerSource).toContain('if (event && event.status === "approved") await updateEventStatus(event.id, "pending_review")');
    expect(myBookingSource).toContain("completeCheckoutSelectionMut.mutateAsync");
    expect(myBookingSource).not.toContain("window.location.reload()");
  });

  it("前台先選付款方式與通道，立即以相同管道顯示後台上傳的可見QR圖片", () => {
    expect(myBookingSource).toContain("先選付款方式與通道，再選費用方案");
    expect(myBookingSource).toContain("activeOnlineQrImages.map");
    expect(myBookingSource).toContain("entityKey === activeOnlineChannel");
    expect(myBookingSource).toContain("refetchQueryResults()");
    expect(myBookingSource).toContain("utils.admin.listBookings.invalidate()");
  });

  it("後台每一個職位的退款前都有預繳，且壽星退款緊接在刪除之後", () => {
    expect(adminSource).toContain("openPaymentResult(booking, \"guest_prepay\", record.payerKey)");
    expect(adminSource).toContain("openPaymentResult(booking, \"guest_refund\", record.payerKey)");
    expect(adminSource).toContain('className="rounded bg-amber-600 px-2 py-1 text-xs text-white">預繳</button>');
    expect(adminSource).toContain('className="rounded bg-rose-700 px-3 py-1 text-xs text-white">退款</button>');
    expect(adminSource).not.toContain("friendContactPhoneEditing");
  });

  it("各職位結果頁以payerKey讀取指定付款紀錄，不會改為整筆現金付款", () => {
    expect(resultSource).toContain('const payerKey = params.get("payerKey") || ""');
    expect(resultSource).toContain("payerKey ? item.payerKey === payerKey");
  });
});
