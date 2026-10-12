import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getFrontBranchId } from "@/lib/branch";

type ResultType = "payment_complete" | "guest_prepay" | "host_refund" | "guest_refund";

const RESULT_COPY: Record<ResultType, { title: string; greeting: string; body: string; closing: string }> = {
  payment_complete: {
    title: "付款完成・預約確認",
    greeting: "親愛的 壽星 您好：",
    body: "感謝您完成付款，您的壽星餐酒館活動預約已確認並鎖定席位。",
    closing: "感謝您的支持與參與。|期待與您一起度過一場|專屬、難忘又充滿驚喜的生日體驗。|壽星餐酒館|期待與您相見。",
  },
  guest_prepay: {
    title: "親友預繳・付款確認",
    greeting: "親愛的 親友 您好：",
    body: "感謝您完成預繳，您的親友席位已完成付款確認。",
    closing: "感謝您成為壽星的重要親友，|期待與您一起參與這場特別的生日體驗。|壽星餐酒館|期待與您相見。",
  },
  host_refund: {
    title: "退款完成・退款確認",
    greeting: "親愛的 壽星 您好：",
    body: "您申請的退款已完成處理。",
    closing: "感謝您曾選擇壽星餐酒館。|若日後有機會，我們期待再次與您相見。|壽星餐酒館",
  },
  guest_refund: {
    title: "親友退款・退款確認",
    greeting: "親愛的 親友 您好：",
    body: "您申請的退款已完成處理。",
    closing: "感謝您曾參與壽星餐酒館的生日體驗。|若日後有機會，期待再次與您相見。|壽星餐酒館",
  },
};

export default function PaymentResultPage() {
  const [, navigate] = useLocation();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const branchId = Number(params.get("branchId")) || getFrontBranchId();
  const bookingId = Number(params.get("bookingId")) || 0;
  const phone = params.get("phone") || "";
  const date = params.get("date") || "";
  const type = (params.get("type") || "payment_complete") as ResultType;
  const payerKey = params.get("payerKey") || "";
  const copy = RESULT_COPY[type] || RESULT_COPY.payment_complete;
  const [friendPhoneEditing, setFriendPhoneEditing] = useState(false);
  const [friendPhoneDraft, setFriendPhoneDraft] = useState(params.get("friendPhone") || "");
  const updateContactPhoneMut = trpc.bookingPayment.updateContactPhone.useMutation();
  const { data: bookings = [], isLoading } = trpc.booking.queryByPhoneDate.useQuery(
    { phone, date, branchId },
    { enabled: Boolean(phone && date) },
  );
  const { data: payments = [] } = trpc.bookingPayment.listForBooking.useQuery(
    { bookingId, branchId },
    { enabled: Boolean(bookingId) },
  );
  const booking = (bookings as any[]).find((item: any) => item.id === bookingId) || (bookings as any[])[0];
  const payment = (payments as any[]).find((item: any) => payerKey ? item.payerKey === payerKey : type === "guest_refund" ? item.payerKey.startsWith("guest_") && item.status === "refunded" : item.payerKey === "cash_notice") || (payments as any[]).find((item: any) => item.payerKey === "host_cash");
  const isRefund = type === "host_refund" || type === "guest_refund";
  const amountLabel = isRefund ? "退款金額" : type === "guest_prepay" ? "預繳金額" : "應付金額";
  const amount = Number(payment?.amount || 0);
  const dateValue = booking?.eventDate || date || "未提供";
  const phoneValue = booking?.phone || phone || "未提供";
  const showFriendPhone = type === "guest_prepay" || type === "guest_refund";
  const friendPayment = showFriendPhone ? payment : undefined;
  const friendPhoneValue = friendPhoneDraft || friendPayment?.contactPhone || "未提供";
  useEffect(() => {
    if (!friendPhoneDraft && friendPayment?.contactPhone) setFriendPhoneDraft(String(friendPayment.contactPhone));
  }, [friendPayment?.contactPhone, friendPhoneDraft]);
  const closingLines = copy.closing.split("|");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-8 text-white">
      <main className="mx-auto max-w-2xl rounded-xl border border-amber-500/30 bg-slate-900/70 p-6 shadow-2xl sm:p-10">
        <button type="button" onClick={() => navigate("/my-booking")} className="mb-8 rounded border border-amber-400 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/10">← 返回我的預約</button>
        {isLoading ? <p className="text-gray-300">正在載入付款結果…</p> : (
          <>
            <h1 className="text-2xl font-bold text-amber-300">{copy.title}</h1>
            <p className="mt-6">{copy.greeting}</p>
            <p className="mt-2">{copy.body}</p>
            <h2 className="mt-7 text-lg font-semibold text-amber-200">{isRefund ? "退款資訊" : "預約資訊"}</h2>
            <div className="mt-3 space-y-2 rounded-lg bg-slate-800/70 p-4 text-gray-100">
              <p>• 壽星姓名：{booking?.birthdayName || "未提供"}</p>
              <p>• 活動日期：{dateValue}</p>
              <p>• {showFriendPhone ? "壽星聯絡電話" : "聯絡電話"}：{phoneValue}</p>
              {showFriendPhone && (
                <div>
                  <button type="button" onClick={() => setFriendPhoneEditing((visible) => !visible)} className="text-left text-amber-200 hover:text-amber-100">• 親友聯絡電話：{friendPhoneValue}</button>
                  {friendPhoneEditing && (
                    <input
                      value={friendPhoneDraft}
                      onChange={(event) => setFriendPhoneDraft(event.target.value)}
                      onBlur={() => {
                        if (!friendPayment?.payerKey || !bookingId || !friendPhoneDraft.trim()) return;
                        updateContactPhoneMut.mutate({ bookingId, branchId, payerKey: friendPayment.payerKey, contactPhone: friendPhoneDraft.trim() });
                      }}
                      placeholder="輸入親友聯絡電話"
                      className="mt-2 w-full rounded border border-amber-500/30 bg-slate-700 px-3 py-2 text-sm text-white"
                    />
                  )}
                </div>
              )}
              <p>• {amountLabel}：NT${amount.toLocaleString()}</p>
              {isRefund && <p>• 退款日期：{payment?.refundedAt ? new Date(payment.refundedAt).toLocaleDateString("zh-TW") : new Date().toLocaleDateString("zh-TW")}</p>}
            </div>
            <div className="mt-7 space-y-1 text-gray-200">{closingLines.map((line) => <p key={line}>{line}</p>)}</div>
          </>
        )}
      </main>
    </div>
  );
}
