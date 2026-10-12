import { afterAll, describe, expect, it } from "vitest";
import { appRouter } from "./routers";

function caller() {
  return appRouter.createCaller({ user: null } as any);
}

const createdBookingIds: number[] = [];

afterAll(async () => {
  const c = caller();
  for (const id of createdBookingIds) {
    await c.admin.deleteBooking({ id }).catch(() => undefined);
  }
});

describe("第127批次：我的預約付款與收銀台同步", () => {
  it("線上付款管道、付款狀態、十職位現金金額與通知可依分店同步", async () => {
    const c = caller();
    const created = await c.booking.create({
      branchId: 1,
      eventDate: "2099-12-31",
      birthdayName: "第127批次測試壽星",
      phone: "0900127127",
      sessionType: "night",
    });
    expect(created.bookingId).toBeTruthy();
    const bookingId = Number(created.bookingId);
    createdBookingIds.push(bookingId);

    await c.bookingPayment.setChannelVisible({ branchId: 1, channel: "line_pay", visible: true });
    await c.bookingPayment.selectCashPayment({ bookingId, branchId: 1, amount: 39280 });
    let payments = await c.bookingPayment.listForBooking({ bookingId, branchId: 1 });
    expect(payments.find((payment: any) => payment.payerKey === "host_cash")).toMatchObject({ method: "cash", status: "unpaid", amount: 39280 });
    const channels = await c.bookingPayment.channelSettings({ branchId: 1 });
    expect(channels.find((channel: any) => channel.channel === "line_pay")?.visible).toBe(true);

    await c.bookingPayment.selectOnlineChannel({ bookingId, branchId: 1, channel: "line_pay", amount: 39280 });
    payments = await c.bookingPayment.listForBooking({ bookingId, branchId: 1 });
    expect(payments.find((payment: any) => payment.payerKey === "host_online")).toMatchObject({
      method: "line_pay", status: "unpaid", amount: 39280,
    });

    await c.bookingPayment.setPaymentStatus({ bookingId, branchId: 1, payerKey: "host_online", status: "paid" });
    payments = await c.bookingPayment.listForBooking({ bookingId, branchId: 1 });
    expect(payments.find((payment: any) => payment.payerKey === "host_online")?.status).toBe("paid");

    const roles = ["host", "photo", "greeter", "floor", "cashier", "bar", "exec_chef", "chef", "sous_chef", "ops"];
    await c.bookingPayment.saveCashAllocations({
      bookingId,
      branchId: 1,
      roleAllocations: roles.map((key) => ({ key, label: key, amount: 2928 })),
    });
    payments = await c.bookingPayment.listForBooking({ bookingId, branchId: 1 });
    const guestPayments = payments.filter((payment: any) => payment.payerKey.startsWith("guest_"));
    expect(guestPayments).toHaveLength(10);
    expect(guestPayments.every((payment: any) => payment.amount === 2928 && payment.status === "paid")).toBe(true);

    await expect(c.bookingPayment.saveCashAllocations({
      bookingId,
      branchId: 1,
      roleAllocations: roles.map((key, index) => ({ key, label: key, amount: index === 0 ? 2928 : 3928 })),
    })).rejects.toThrow("十個職位金額必須相同");

    await c.bookingPayment.setCashNotice({ bookingId, branchId: 1, notice: "guest_prepay" });
    payments = await c.bookingPayment.listForBooking({ bookingId, branchId: 1 });
    expect(payments.find((payment: any) => payment.payerKey === "cash_notice")).toMatchObject({
      payerLabel: "親友預繳", status: "paid", amount: 29280,
    });

    await c.bookingPayment.setPaymentStatus({ bookingId, branchId: 1, payerKey: "guest_host", status: "refunded" });
    payments = await c.bookingPayment.listForBooking({ bookingId, branchId: 1 });
    expect(payments.find((payment: any) => payment.payerKey === "guest_host")?.status).toBe("refunded");

    await c.bookingPayment.setCashNotice({ bookingId, branchId: 1, notice: "host_refund" });
    payments = await c.bookingPayment.listForBooking({ bookingId, branchId: 1 });
    expect(payments.find((payment: any) => payment.payerKey === "cash_notice")).toMatchObject({
      payerLabel: "壽星退款", status: "refunded",
    });

    await c.bookingPayment.clearCashAllocations({ bookingId, branchId: 1 });
    payments = await c.bookingPayment.listForBooking({ bookingId, branchId: 1 });
    expect(payments.some((payment: any) => payment.method === "cash")).toBe(false);
  }, 20000);
});
