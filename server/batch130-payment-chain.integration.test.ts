import { afterAll, describe, expect, it } from "vitest";
import { appRouter } from "./routers";

function caller() {
  return appRouter.createCaller({ user: null } as any);
}

const createdBookingIds: number[] = [];

afterAll(async () => {
  const c = caller();
  for (const bookingId of createdBookingIds) {
    await c.admin.deleteBooking({ id: bookingId }).catch(() => undefined);
  }
});

describe("第130批次：原子化付款資料鏈", () => {
  it("一次選擇會同步費用方案與付款紀錄，切換付款方式後僅保留目前選擇", async () => {
    const c = caller();
    const created = await c.booking.create({
      branchId: 1,
      eventDate: "2099-12-30",
      birthdayName: "第130批次同步測試壽星",
      phone: "0900130130",
      sessionType: "night",
    });
    const bookingId = Number(created.bookingId);
    createdBookingIds.push(bookingId);

    await c.bookingPayment.completeCheckoutSelection({
      bookingId,
      branchId: 1,
      plan: "student",
      method: "online",
      channel: "line_pay",
    });
    let bookings = await c.booking.queryByPhoneDate({ phone: "0900130130", date: "2099-12-30", branchId: 1 });
    let payments = await c.bookingPayment.listForBooking({ bookingId, branchId: 1 });
    expect(bookings.find((item: any) => item.id === bookingId)?.paymentPlan).toBe("student");
    expect(payments.filter((item: any) => ["host_online", "host_cash"].includes(item.payerKey))).toMatchObject([
      { payerKey: "host_online", method: "line_pay", status: "unpaid" },
    ]);

    await c.bookingPayment.completeCheckoutSelection({
      bookingId,
      branchId: 1,
      plan: "weekday",
      method: "cash",
    });
    bookings = await c.booking.queryByPhoneDate({ phone: "0900130130", date: "2099-12-30", branchId: 1 });
    payments = await c.bookingPayment.listForBooking({ bookingId, branchId: 1 });
    expect(bookings.find((item: any) => item.id === bookingId)?.paymentPlan).toBe("weekday");
    expect(payments.filter((item: any) => ["host_online", "host_cash"].includes(item.payerKey))).toMatchObject([
      { payerKey: "host_cash", method: "cash", status: "unpaid" },
    ]);
  }, 20000);
});
