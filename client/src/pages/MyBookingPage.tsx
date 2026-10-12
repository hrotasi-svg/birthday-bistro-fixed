import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getFrontBranchId } from "@/lib/branch";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MyBookingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [agreePayTerms, setAgreePayTerms] = useState(false);
  const [queryPhone, setQueryPhone] = useState("");
  const [queryDate, setQueryDate] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [selectedOnlineChannel, setSelectedOnlineChannel] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "online" | null>(null);

  // tRPC Queries — all DB-backed, no localStorage
  const branchId = getFrontBranchId();
  const memberLogin = useMemo(() => {
    try {
      const parsed = JSON.parse(sessionStorage.getItem("birthdayBistroMemberLogin") || "{}");
      return parsed?.branchId === branchId && parsed?.member?.id && parsed?.phone
        ? { memberId: Number(parsed.member.id), phone: String(parsed.phone) }
        : undefined;
    } catch {
      return undefined;
    }
  }, [branchId]);
  const [queryParams, setQueryParams] = useState<{ phone: string; date: string } | null>(null);
  const { data: queryResults = [], refetch: refetchQueryResults } = trpc.booking.queryByPhoneDate.useQuery(
    queryParams ? { ...queryParams, branchId } : { phone: "", date: "", branchId },
    { enabled: !!queryParams }
  );
  const { data: allEvents = [] } = trpc.admin.listEvents.useQuery();
  const { data: systemSettings = {} as any } = trpc.system.settings.get.useQuery({ branchId });
  const { data: notificationSummary } = trpc.booking.notificationSummary.useQuery({
    branchId,
    memberId: memberLogin?.memberId,
    phone: memberLogin?.phone,
  }, { enabled: isAuthenticated || Boolean(memberLogin) });
  const { data: paymentChannelSettings = [] } = trpc.bookingPayment.channelSettings.useQuery({ branchId }, { refetchOnMount: "always", refetchOnWindowFocus: true, staleTime: 0 });
  const { data: paymentQrImages = [] } = trpc.entityImage.list.useQuery({ entityType: "payment_qr", branchId }, { refetchOnMount: "always", refetchOnWindowFocus: true, staleTime: 0 });

  // Mutations
  const markActivityNotificationsReadMut = trpc.booking.markActivityNotificationsRead.useMutation();
  const completeCheckoutSelectionMut = trpc.bookingPayment.completeCheckoutSelection.useMutation();
  const bindCurrentMemberBookingsMut = trpc.booking.bindCurrentMemberBookings.useMutation({
    onSuccess: () => {
      void utils.booking.notificationSummary.invalidate({ branchId });
    },
  });

  const handleQuery = () => {
    if (queryPhone && queryDate) {
      setQueryParams({ phone: queryPhone, date: queryDate });
      setShowResult(true);
    } else {
      toast.error("請填寫所有查詢欄位");
    }
  };

  const getEventForBooking = (bookingId: number | null) => {
    if (!bookingId) return undefined;
    return allEvents.find((e: any) => e.bookingId === bookingId);
  };



  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`邀請碼 ${code} 已複製`);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success(`邀請碼 ${code} 已複製`);
    }
  };

  const getProgressSteps = (booking: any, event: any) => {
    const status = event?.status || booking?.status;
    const statusMap: Record<string, { label: string; completed: boolean }[]> = {
      "pending": [
        { label: "您的餐酒館正在籌備中，等待確認", completed: true },
        { label: "您的餐酒館籌備完成了", completed: false },
        { label: "您的餐酒館席位保留中，請儘速繳費", completed: false },
        { label: "您的餐酒館席位，預約繳費完成", completed: false },
        { label: "全額繳費完成，祝您生日快樂！開業大吉！", completed: false },
        { label: "邀請碼／開始邀請夥伴，一起準備開幕派對！", completed: false },
        { label: "恭喜！您的壽星餐酒館準備開幕了！", completed: false },
      ],
      "approved": [
        { label: "您的餐酒館正在籌備中，等待確認", completed: true },
        { label: "您的餐酒館籌備完成了", completed: true },
        { label: "您的餐酒館席位保留中，請儘速繳費", completed: false },
        { label: "您的餐酒館席位，預約繳費完成", completed: false },
        { label: "全額繳費完成，祝您生日快樂！開業大吉！", completed: false },
        { label: "邀請碼／開始邀請夥伴，一起準備開幕派對！", completed: false },
        { label: "恭喜！您的壽星餐酒館準備開幕了！", completed: false },
      ],
      "pending_review": [
        { label: "您的餐酒館正在籌備中，等待確認", completed: true },
        { label: "您的餐酒館籌備完成了", completed: true },
        { label: "您的餐酒館席位保留中，請儘速繳費", completed: true },
        { label: "您的餐酒館席位，預約繳費完成", completed: false },
        { label: "全額繳費完成，祝您生日快樂！開業大吉！", completed: false },
        { label: "邀請碼／開始邀請夥伴，一起準備開幕派對！", completed: false },
        { label: "恭喜！您的壽星餐酒館準備開幕了！", completed: false },
      ],
      "deposit_paid": [
        { label: "您的餐酒館正在籌備中，等待確認", completed: true },
        { label: "您的餐酒館籌備完成了", completed: true },
        { label: "您的餐酒館席位保留中，請儘速繳費", completed: true },
        { label: "您的餐酒館席位，預約繳費完成", completed: true },
        { label: "全額繳費完成，祝您生日快樂！開業大吉！", completed: false },
        { label: "邀請碼／開始邀請夥伴，一起準備開幕派對！", completed: false },
        { label: "恭喜！您的壽星餐酒館準備開幕了！", completed: false },
      ],
      "full_paid": [
        { label: "您的餐酒館正在籌備中，等待確認", completed: true },
        { label: "您的餐酒館籌備完成了", completed: true },
        { label: "您的餐酒館席位保留中，請儘速繳費", completed: true },
        { label: "您的餐酒館席位，預約繳費完成", completed: true },
        { label: "全額繳費完成，祝您生日快樂！開業大吉！", completed: true },
        { label: "邀請碼／開始邀請夥伴，一起準備開幕派對！", completed: true },
        { label: "恭喜！您的壽星餐酒館準備開幕了！", completed: false },
      ],
      "active": [
        { label: "您的餐酒館正在籌備中，等待確認", completed: true },
        { label: "您的餐酒館籌備完成了", completed: true },
        { label: "您的餐酒館席位保留中，請儘速繳費", completed: true },
        { label: "您的餐酒館席位，預約繳費完成", completed: true },
        { label: "全額繳費完成，祝您生日快樂！開業大吉！", completed: true },
        { label: "邀請碼／開始邀請夥伴，一起準備開幕派對！", completed: true },
        { label: "恭喜！您的壽星餐酒館準備開幕了！", completed: true },
      ],
    };
    return statusMap[status] || statusMap["pending"];
  };

 const currentBooking = selectedBookingId
   ? queryResults.find((b: any) => b.id === selectedBookingId)
   : (showResult && queryResults.length === 1 ? queryResults[0] : null);
 const currentEvent = currentBooking ? getEventForBooking(currentBooking.id ?? null) : null;
  // BUG 1: effectiveBookingId ensures invite codes query is enabled even when there's only one result
  const effectiveBookingId = selectedBookingId ?? (showResult && queryResults.length === 1 ? (queryResults[0]?.id ?? null) : null);
  const { data: bookingPayments = [] } = trpc.bookingPayment.listForBooking.useQuery(
    { bookingId: effectiveBookingId ?? 0, branchId },
    { enabled: Boolean(effectiveBookingId) }
  );
  // BUG 24: Generate unique invite codes from DB (must be after effectiveBookingId)
  const { data: inviteCodes = [] } = trpc.invite.listByBooking.useQuery(
    { bookingId: effectiveBookingId ?? 0 },
    { enabled: !!effectiveBookingId && ["full_paid", "active"].includes(getEventForBooking(effectiveBookingId)?.status ?? "") }
  );
 const progressSteps = currentBooking ? getProgressSteps(currentBooking, currentEvent) : [];

  useEffect(() => {
    if (!queryParams || queryResults.length === 0) return;
    localStorage.setItem("bookingActivityLookup", JSON.stringify({
      phone: queryParams.phone,
      eventDate: queryParams.date,
      branchId,
    }));
  }, [branchId, queryParams, queryResults.length]);

  useEffect(() => {
    if (!isAuthenticated || !queryParams || queryResults.length === 0) return;
    bindCurrentMemberBookingsMut.mutate({ phone: queryParams.phone, branchId });
  }, [bindCurrentMemberBookingsMut, branchId, isAuthenticated, queryParams, queryResults.length]);

  useEffect(() => {
    const hasMemberLoginForPhone = Boolean(memberLogin && memberLogin.phone === queryParams?.phone);
    if ((!isAuthenticated && !hasMemberLoginForPhone) || !currentBooking || !queryParams || notificationSummary?.hasCustomerUnread !== true) return;
    markActivityNotificationsReadMut.mutate({
      bookingId: currentBooking.id,
      memberId: memberLogin?.memberId,
      phone: queryParams.phone,
      eventDate: queryParams.date,
    });
  }, [currentBooking?.id, isAuthenticated, markActivityNotificationsReadMut, memberLogin, notificationSummary?.hasCustomerUnread, queryParams]);

  const handleSelectPlan = async (planKey: string, planLabel: string) => {
    if (!currentBooking) return;
    if (!selectedPaymentMethod) { toast.error("請先選擇門店現金繳納或線上付款"); return; }
    if (selectedPaymentMethod === "online" && !selectedOnlineChannel) { toast.error("請先選擇LINE Pay、街口支付或TWQR"); return; }
    if (!agreePayTerms) { toast.error("請先勾選同意《付款、取消及退款規範》"); return; }
    try {
      await completeCheckoutSelectionMut.mutateAsync({
        bookingId: currentBooking.id,
        branchId,
        plan: planKey as "deposit" | "student" | "weekday" | "holiday",
        method: selectedPaymentMethod,
        channel: selectedPaymentMethod === "online" ? selectedOnlineChannel as "line_pay" | "jkopay" | "twqr" : undefined,
      });
      await Promise.all([
        refetchQueryResults(),
        utils.bookingPayment.listForBooking.invalidate({ bookingId: currentBooking.id, branchId }),
        utils.admin.listBookings.invalidate(),
        utils.admin.listEvents.invalidate(),
      ]);
      toast.success(`已選擇：${planLabel}`);
      setSelectedBookingId(currentBooking.id);
    } catch { toast.error("選擇方案或付款方式失敗"); }
  };

  const planOptions = useMemo(() => [
    { key: "deposit", label: `預約金 NT$${systemSettings?.depositPrice ?? 1000}` },
    { key: "student", label: `學生 NT$${systemSettings?.studentPrice ?? 29280}` },
    { key: "weekday", label: `平日 NT$${systemSettings?.weekdayPrice ?? 39280}` },
    { key: "holiday", label: `假日 NT$${systemSettings?.holidayPrice ?? 49280}` },
  ], [systemSettings]);
  const onlinePaymentChannels = [
    { key: "line_pay", label: "LINE Pay", description: "付款說明：請使用 LINE Pay 掃描 QR Code 完成付款" },
    { key: "jkopay", label: "街口支付", description: "付款說明：請使用 街口支付 掃描 QR Code 完成付款" },
    { key: "twqr", label: "TWQR", description: "付款說明：請使用 TWQR掃描 QR Code 完成付款" },
  ] as const;
  const visibleOnlinePaymentChannels = onlinePaymentChannels.filter((channel) => {
    const setting = (paymentChannelSettings as any[]).find((item: any) => item.channel === channel.key);
    return setting?.visible !== false;
  });
  const getSelectedPlanAmount = () => {
    if (currentBooking?.paymentPlan === "student") return Number(systemSettings?.studentPrice ?? 29280);
    if (currentBooking?.paymentPlan === "weekday") return Number(systemSettings?.weekdayPrice ?? 39280);
    if (currentBooking?.paymentPlan === "holiday") return Number(systemSettings?.holidayPrice ?? 49280);
    return Number(systemSettings?.depositPrice ?? 1000);
  };
  const onlinePayment = (bookingPayments as any[]).find((payment: any) => payment.payerKey === "host_online");
  const cashPayment = (bookingPayments as any[]).find((payment: any) => payment.payerKey === "host_cash");
  const cashNotice = (bookingPayments as any[]).find((payment: any) => payment.payerKey === "cash_notice");
  const guestRefundPayment = (bookingPayments as any[]).find((payment: any) => payment.payerKey.startsWith("guest_") && payment.status === "refunded");
  const showPaymentCompleteNotice = onlinePayment?.status === "paid" || cashNotice?.payerLabel === "付款完成";
  const showGuestPrepayNotice = cashNotice?.payerLabel === "親友預繳" && cashNotice?.status === "paid";
  const showHostRefundNotice = cashNotice?.payerLabel === "壽星退款" && cashNotice?.status === "refunded";
  useEffect(() => {
    if (!currentBooking) setSelectedPaymentMethod(null);
  }, [currentBooking?.id]);
  useEffect(() => {
    if (onlinePayment) setSelectedPaymentMethod("online");
    else if (cashPayment) setSelectedPaymentMethod("cash");
  }, [onlinePayment?.id, cashPayment?.id]);
  useEffect(() => {
    if (onlinePayment?.method) setSelectedOnlineChannel(onlinePayment.method);
  }, [onlinePayment?.method]);
  const getPlanAmountByKey = (planKey: string) => {
    if (planKey === "student") return Number(systemSettings?.studentPrice ?? 29280);
    if (planKey === "weekday") return Number(systemSettings?.weekdayPrice ?? 39280);
    if (planKey === "holiday") return Number(systemSettings?.holidayPrice ?? 49280);
    return Number(systemSettings?.depositPrice ?? 1000);
  };
  const handleSelectOnlineChannel = async (channel: "line_pay" | "jkopay" | "twqr") => {
    if (!currentBooking) return;
    setSelectedPaymentMethod("online");
    setSelectedOnlineChannel(channel);
    if (!currentBooking.paymentPlan) {
      toast.success(`已選擇${onlinePaymentChannels.find((item) => item.key === channel)?.label || "線上付款"}，請繼續選擇費用方案`);
      return;
    }
    try {
      await completeCheckoutSelectionMut.mutateAsync({
        bookingId: currentBooking.id,
        branchId,
        plan: currentBooking.paymentPlan as "deposit" | "student" | "weekday" | "holiday",
        method: "online",
        channel,
      });
      await utils.bookingPayment.listForBooking.invalidate({ bookingId: currentBooking.id, branchId });
      await utils.admin.listBookings.invalidate();
      toast.success("已顯示付款QR Code，請完成掃描付款後等候店家確認");
    } catch (error: any) {
      toast.error(error?.message || "選擇付款方式失敗");
    }
  };
  const activeOnlineChannel = selectedOnlineChannel ?? onlinePayment?.method;
  const activeOnlineChannelMeta = onlinePaymentChannels.find((channel) => channel.key === activeOnlineChannel);
  const activeOnlineQrImages = (paymentQrImages as any[]).filter((image: any) => image.entityKey === activeOnlineChannel && image.visible !== false && image.visible !== 0);
  const handleSelectCashPayment = async () => {
    if (!currentBooking) return;
    setSelectedPaymentMethod("cash");
    if (!currentBooking.paymentPlan) {
      toast.success("已選擇門店現金繳納，請繼續選擇費用方案");
      return;
    }
    try {
      await completeCheckoutSelectionMut.mutateAsync({
        bookingId: currentBooking.id,
        branchId,
        plan: currentBooking.paymentPlan as "deposit" | "student" | "weekday" | "holiday",
        method: "cash",
      });
      await utils.bookingPayment.listForBooking.invalidate({ bookingId: currentBooking.id, branchId });
      await utils.admin.listBookings.invalidate();
      toast.success("已選擇門店現金繳納");
    } catch (error: any) {
      toast.error(error?.message || "選擇門店現金繳納失敗");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <button onClick={() => navigate("/main")}
              className="text-amber-400 border border-amber-400 rounded-lg px-4 py-2 hover:bg-amber-500/10 transition-colors text-sm">
              ← 返回主功能
            </button>
          </div>

          <h1 className="text-3xl font-bold text-white mb-8 text-center pt-4">我的預約</h1>

          {!showResult ? (
            <div className="bg-slate-900/50 p-8 rounded-lg border border-amber-500/30 max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-white mb-6">查詢您的預約資訊</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">聯絡電話</Label>
                  <Input value={queryPhone} onChange={(e) => setQueryPhone(e.target.value)}
                    placeholder="請輸入聯絡電話"
                    className="bg-slate-800 border-amber-500/30 text-white" />
                </div>
                <div>
                  <Label className="text-white">預約日期</Label>
                  <Input type="date" value={queryDate} onChange={(e) => setQueryDate(e.target.value)}
                    className="bg-slate-800 border-amber-500/30 text-white" />
                </div>
                <button onClick={handleQuery}
                  className="w-full px-4 py-3 bg-amber-600 text-white rounded font-semibold hover:bg-amber-700 transition">
                  查詢
                </button>
              </div>
            </div>
          ) : showResult && queryResults.length === 0 && queryParams ? (
            <div className="text-center text-gray-400 py-12">
              <p className="text-xl mb-4">查詢不到相應的預約資料</p>
              <button onClick={() => { setShowResult(false); setQueryParams(null); setSelectedBookingId(null); }}
                className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition">
                重新查詢
              </button>
            </div>
          ) : showResult && queryResults.length > 1 && !selectedBookingId ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-amber-400 mb-4">查詢結果</h2>
              {queryResults.filter((b: any) => !b.hidden).map((b: any) => (
                <div key={b.id} className="bg-slate-900/50 p-4 rounded-lg border border-amber-500/30 cursor-pointer hover:border-amber-400 transition"
                  onClick={() => setSelectedBookingId(b.id)}>
                  <p className="text-white font-semibold">{b.birthdayName} — {b.eventDate}</p>
                  <p className="text-gray-400 text-sm">{b.sessionType === "day" ? "日間場" : "晚間場"}</p>
                </div>
              ))}
              <button onClick={() => { setShowResult(false); setQueryParams(null); setSelectedBookingId(null); }}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition">
                重新查詢
              </button>
            </div>
          ) : currentBooking ? (
            <div className="space-y-6">
              <div className="bg-slate-900/50 p-6 rounded-lg border border-amber-500/30">
                <h2 className="text-xl font-semibold text-amber-400 mb-4">預約資訊</h2>
                <div className="grid grid-cols-2 gap-4 text-white">
                  <div>
                    <p className="text-gray-400 text-sm">壽星姓名</p>
                    <p className="font-semibold">{currentBooking.birthdayName || "未提供"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">預約日期</p>
                    <p className="font-semibold">{currentBooking.eventDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">時段</p>
                    <p className="font-semibold">{currentBooking.sessionType === "day" ? "日間場 10:00~16:00" : "晚間場 17:00~23:00"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">聯繫電話</p>
                    <p className="font-semibold">{currentBooking.phone || "未提供"}</p>
                  </div>
                </div>
              </div>

              {/* 活動進度 */}
              <div className="bg-slate-900/50 p-6 rounded-lg border border-amber-500/30">
                <h2 className="text-xl font-semibold text-amber-400 mb-6">活動進度</h2>
                <div className="space-y-3">
                  {progressSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm ${
                        step.completed ? "text-white" : "bg-slate-700 text-gray-400"
                      }`}
                        style={step.completed ? { background: "linear-gradient(135deg, #ff69b4, #ffd700)" } : {}}
                      >
                        {step.completed ? "✓" : idx + 1}
                      </div>
                      <p className={`pt-1 ${step.completed ? "text-white" : "text-gray-400"}`}>
                        {step.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* BUG 1: 費用方案 — 審核通過後，活動進度下方顯示完整PRD格式 */}
              {currentEvent && ["approved", "pending_review"].includes(currentEvent.status ?? "") && (
                <div className="bg-slate-900/50 p-6 rounded-lg border border-amber-500/30">
                  <h2 className="text-xl font-semibold text-amber-400 mb-4">費用方案</h2>
                  {currentBooking.paymentPlan ? (
                    <div className="space-y-4 text-white">
                      <p className="text-lg font-semibold text-amber-300">
                        已選擇: {planOptions.find(p => p.key === currentBooking.paymentPlan)?.label || currentBooking.paymentPlan}
                      </p>
                      <p className="text-gray-400 mt-2">您的餐酒館席位保留中，請儘速繳費</p>
                      {selectedPaymentMethod === "online" && (
                        <div className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-950/20 p-4">
                          <h3 className="mb-3 text-lg font-semibold text-fuchsia-200">線上付款</h3>
                          {visibleOnlinePaymentChannels.length === 0 ? (
                            <p className="text-sm text-gray-400">目前此門店尚未開放線上付款方式。</p>
                          ) : (
                            <div className="space-y-3">
                              {visibleOnlinePaymentChannels.map((channel) => (
                                <button key={channel.key} type="button" onClick={() => void handleSelectOnlineChannel(channel.key)} className={`w-full rounded-lg border p-4 text-left transition-colors ${activeOnlineChannel === channel.key ? "border-fuchsia-300 bg-fuchsia-700/30" : "border-slate-600 bg-slate-800/70 hover:border-fuchsia-400/70"}`}>
                                  <p className="font-semibold text-white">{channel.label}</p>
                                  <p className="mt-1 text-sm text-gray-300">{channel.description}</p>
                                </button>
                              ))}
                            </div>
                          )}
                          {activeOnlineChannelMeta && (
                            <div className="mt-4 rounded-lg border border-fuchsia-300/30 bg-slate-900/70 p-4">
                              <p className="font-semibold text-fuchsia-100">{activeOnlineChannelMeta.label}</p>
                              <p className="mt-1 text-sm text-gray-300">{activeOnlineChannelMeta.description}</p>
                              {activeOnlineQrImages.length > 0 ? (
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                  {activeOnlineQrImages.map((image: any) => <img key={image.id} src={image.imageUrl} alt={`${activeOnlineChannelMeta.label} QR Code`} className="mx-auto max-h-72 max-w-full rounded-lg bg-white p-2 object-contain" />)}
                                </div>
                              ) : (
                                <p className="mt-3 text-sm text-amber-200">店家尚未上傳此付款方式的 QR Code，請聯絡門店協助。</p>
                              )}
                              <p className="mt-3 text-xs text-gray-400">應付金額：NT${getSelectedPlanAmount().toLocaleString()}。掃描完成後，請等待店家確認付款狀態。</p>
                            </div>
                          )}
                          {onlinePayment && <p className={`mt-3 text-sm ${onlinePayment.status === "paid" ? "text-emerald-300" : "text-amber-200"}`}>目前付款狀態：{onlinePayment.status === "paid" ? "已付款" : "未付款"}</p>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* 第130批次：先選付款方式與通道，再選費用方案，避免流程順序相反 */}
                      <div className="bg-slate-800/30 p-4 rounded-lg">
                        <p className="text-white font-semibold mb-3">付款方式：</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button type="button" onClick={() => void handleSelectCashPayment()} className={`rounded-lg border p-4 text-left transition-colors ${selectedPaymentMethod === "cash" ? "border-amber-300 bg-amber-700/30" : "border-slate-600 bg-slate-800/70 hover:border-amber-400/70"}`}>
                            <p className="font-semibold text-white">門店現金繳納</p>
                          </button>
                          {visibleOnlinePaymentChannels.length > 0 && (
                            <button type="button" onClick={() => setSelectedPaymentMethod("online")} className={`rounded-lg border p-4 text-left transition-colors ${selectedPaymentMethod === "online" ? "border-fuchsia-300 bg-fuchsia-700/30" : "border-slate-600 bg-slate-800/70 hover:border-fuchsia-400/70"}`}>
                              <p className="font-semibold text-white">線上付款</p>
                            </button>
                          )}
                        </div>
                        {!selectedPaymentMethod && <p className="mt-3 text-sm text-amber-200">請先選擇付款方式，才能繼續下一步。</p>}
                        {selectedPaymentMethod === "online" && (
                          <div className="mt-4 space-y-3">
                            {visibleOnlinePaymentChannels.map((channel) => (
                              <button key={channel.key} type="button" onClick={() => void handleSelectOnlineChannel(channel.key)} className={`w-full rounded-lg border p-4 text-left transition-colors ${activeOnlineChannel === channel.key ? "border-fuchsia-300 bg-fuchsia-700/30" : "border-slate-600 bg-slate-800/70 hover:border-fuchsia-400/70"}`}>
                                <p className="font-semibold text-white">{channel.label}</p>
                                <p className="mt-1 text-sm text-gray-300">{channel.description}</p>
                              </button>
                            ))}
                            {activeOnlineChannelMeta && (
                              <div className="rounded-lg border border-fuchsia-300/30 bg-slate-900/70 p-4">
                                <p className="font-semibold text-fuchsia-100">{activeOnlineChannelMeta.label}</p>
                                <p className="mt-1 text-sm text-gray-300">{activeOnlineChannelMeta.description}</p>
                                {activeOnlineQrImages.length > 0 ? (
                                  <div className="mt-3 grid gap-3 sm:grid-cols-2">{activeOnlineQrImages.map((image: any) => <img key={image.id} src={image.imageUrl} alt={`${activeOnlineChannelMeta.label} QR Code`} className="mx-auto max-h-72 max-w-full rounded-lg bg-white p-2 object-contain" />)}</div>
                                ) : <p className="mt-3 text-sm text-amber-200">店家尚未上傳此付款方式的 QR Code，請聯絡門店協助。</p>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* A. 全額鎖定席位 */}
                      <div className="bg-slate-800/50 p-5 rounded-lg border border-amber-500/20">
                        <h3 className="text-lg font-bold text-pink-400 mb-1">A. 全額鎖定席位</h3>
                        <p className="text-pink-300 text-sm mb-4">建議選擇，可直接確保活動席位</p>
                        <div className="space-y-3">
                          <button onClick={() => handleSelectPlan("weekday", `平日 NT$${systemSettings?.weekdayPrice ?? 39280}`)}
                            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border-2 border-amber-500/30 hover:border-amber-500 hover:bg-slate-600 transition text-left font-semibold">
                            平日 NT${systemSettings?.weekdayPrice ?? 39280}
                          </button>
                          <button onClick={() => handleSelectPlan("student", `學生 NT$${systemSettings?.studentPrice ?? 29280}`)}
                            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border-2 border-amber-500/30 hover:border-amber-500 hover:bg-slate-600 transition text-left font-semibold">
                            學生 NT${systemSettings?.studentPrice ?? 29280}
                          </button>
                          <button onClick={() => handleSelectPlan("holiday", `假日 NT$${systemSettings?.holidayPrice ?? 49280}`)}
                            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border-2 border-amber-500/30 hover:border-amber-500 hover:bg-slate-600 transition text-left font-semibold">
                            假日 NT${systemSettings?.holidayPrice ?? 49280}
                          </button>
                        </div>
                        <p className="text-gray-400 text-sm mt-3">請於 7 日內完成付款</p>
                      </div>

                      {/* B. 預約金保留席位 */}
                      <div className="bg-slate-800/50 p-5 rounded-lg border border-amber-500/20">
                        <h3 className="text-lg font-bold text-amber-400 mb-1">B. 預約金保留席位</h3>
                        <p className="text-gray-300 text-sm mb-4">暫時保留席位，但須承擔被全額付款者優先鎖定之風險</p>
                        <button onClick={() => handleSelectPlan("deposit", `預約金 NT$${systemSettings?.depositPrice ?? 1000}`)}
                          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border-2 border-amber-500/30 hover:border-amber-500 hover:bg-slate-600 transition text-left font-semibold">
                          預約金 NT${systemSettings?.depositPrice ?? 1000}
                        </button>
                        <div className="mt-3 space-y-1">
                          <p className="text-gray-400 text-sm">請於 3 日內完成支付</p>
                          <p className="text-gray-400 text-sm">請於活動前 7 日完成尾款支付</p>
                          <p className="text-red-400 text-sm">逾期取消席位，訂金不予退還</p>
                        </div>
                      </div>

                      {/* 取消政策 */}
                      <div className="bg-slate-800/30 p-4 rounded-lg">
                        <p className="text-white font-semibold mb-1">活動前 3 日內取消：</p>
                        <p className="text-gray-300 text-sm">不提供退款</p>
                        <p className="text-gray-300 text-sm">可保留名額改約其他場次</p>
                      </div>

                      {/* 17-13: 同意付款條款 checkbox */}
                      <div className="flex items-start space-x-3 pt-2">
                        <Checkbox
                          id="agree-pay-terms"
                          checked={agreePayTerms}
                          onCheckedChange={(v) => setAgreePayTerms(!!v)}
                        />
                        <label htmlFor="agree-pay-terms" className="text-white text-sm cursor-pointer leading-relaxed">
                          我已閱讀並同意《付款、取消及退款規範》
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showPaymentCompleteNotice && (
                <div className="rounded-lg border border-emerald-400/40 bg-emerald-950/20 p-6 text-white">
                  <h2 className="mb-5 text-xl font-semibold text-emerald-200">付款完成・預約確認</h2>
                  <p>親愛的 {currentBooking.birthdayName || "壽星"} 您好：</p>
                  <p className="mt-2">感謝您完成付款，您的壽星餐酒館活動預約已確認並鎖定席位。</p>
                  <h3 className="mt-5 font-semibold text-emerald-100">預約資訊</h3>
                  <p>• 壽星姓名：{currentBooking.birthdayName || "未提供"}</p>
                  <p>• 活動日期：{currentBooking.eventDate}</p>
                  <p>• 聯絡電話：{currentBooking.phone || "未提供"}</p>
                  <p className="mt-5">感謝您的支持與參與。</p>
                  <p>期待與您一起度過一場<br />專屬、難忘又充滿驚喜的生日體驗。</p>
                  <p className="mt-5">壽星餐酒館<br />期待與您相見。</p>
                </div>
              )}

              {showGuestPrepayNotice && (
                <div className="rounded-lg border border-amber-400/40 bg-amber-950/20 p-6 text-white">
                  <h2 className="mb-5 text-xl font-semibold text-amber-200">親友預繳・付款確認</h2>
                  <p>親愛的 親友 您好：</p>
                  <p className="mt-2">感謝您完成預繳，您的親友席位已完成付款確認。</p>
                  <h3 className="mt-5 font-semibold text-amber-100">預約資訊</h3>
                  <p>• 壽星姓名：{currentBooking.birthdayName || "未提供"}</p>
                  <p>• 活動日期：{currentBooking.eventDate}</p>
                  <p>• 聯絡電話：{currentBooking.phone || "未提供"}</p>
                  <p>• 預繳金額：NT${Number(cashNotice?.amount || 0).toLocaleString()}</p>
                  <p className="mt-5">感謝您成為壽星的重要親友，<br />期待與您一起參與這場特別的生日體驗。</p>
                  <p className="mt-5">壽星餐酒館<br />期待與您相見。</p>
                </div>
              )}

              {showHostRefundNotice && (
                <div className="rounded-lg border border-rose-400/40 bg-rose-950/20 p-6 text-white">
                  <h2 className="mb-5 text-xl font-semibold text-rose-200">退款完成・退款確認</h2>
                  <p>親愛的 顧客 您好：</p>
                  <p className="mt-2">您申請的退款已完成處理。</p>
                  <h3 className="mt-5 font-semibold text-rose-100">退款資訊</h3>
                  <p>• 壽星姓名：{currentBooking.birthdayName || "未提供"}</p>
                  <p>• 活動日期：{currentBooking.eventDate}</p>
                  <p>• 聯絡電話：{currentBooking.phone || "未提供"}</p>
                  <p>• 退款金額：NT${Number(cashNotice?.amount || 0).toLocaleString()}</p>
                  <p>• 退款日期：{cashNotice?.refundedAt ? new Date(cashNotice.refundedAt).toLocaleDateString("zh-TW") : "未提供"}</p>
                  <p className="mt-5">感謝您曾選擇壽星餐酒館。<br />若日後有機會，我們期待再次與您相見。</p>
                  <p className="mt-5">壽星餐酒館</p>
                </div>
              )}

              {guestRefundPayment && (
                <div className="rounded-lg border border-rose-400/40 bg-rose-950/20 p-6 text-white">
                  <h2 className="mb-5 text-xl font-semibold text-rose-200">親友退款・退款確認</h2>
                  <p>親愛的 親友 您好：</p>
                  <p className="mt-2">您申請的退款已完成處理。</p>
                  <h3 className="mt-5 font-semibold text-rose-100">退款資訊</h3>
                  <p>• 壽星姓名：{currentBooking.birthdayName || "未提供"}</p>
                  <p>• 活動日期：{currentBooking.eventDate}</p>
                  <p>• 聯絡電話：{currentBooking.phone || "未提供"}</p>
                  <p>• 退款金額：NT${Number(guestRefundPayment.amount || 0).toLocaleString()}</p>
                  <p>• 退款日期：{guestRefundPayment.refundedAt ? new Date(guestRefundPayment.refundedAt).toLocaleDateString("zh-TW") : "未提供"}</p>
                  <p className="mt-5">感謝您曾參與壽星餐酒館的生日體驗。<br />若日後有機會，期待再次與您相見。</p>
                  <p className="mt-5">壽星餐酒館</p>
                </div>
              )}

              {/* BUG 24: 邀請碼 — 從 DB 讀取，一鍵複製 */}
              {(currentEvent?.status === "full_paid" || currentEvent?.status === "active") && inviteCodes.length > 0 && (
                <div className="bg-slate-900/50 p-6 rounded-lg border border-amber-500/30">
                  <h2 className="text-xl font-semibold text-amber-400 mb-4">邀請碼／開始邀請夥伴，一起準備開幕派對！</h2>
                  <div className="space-y-3 text-white">
                    {inviteCodes.filter((c: any) => c.type === "host").map((code: any) => (
                      <div key={code.id} className="bg-slate-800/50 p-3 rounded">
                        <p className="text-gray-400 text-sm">壽星邀請碼</p>
                        <p className="font-mono font-semibold text-lg text-amber-300">{code.code}</p>
                        <button onClick={() => handleCopyCode(code.code)}
                          className="mt-2 px-4 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 transition">
                          一鍵複製
                        </button>
                      </div>
                    ))}
                    <p className="text-gray-400 text-sm pt-2">親友邀請碼 ×10</p>
                    {inviteCodes.filter((c: any) => c.type === "guest").map((code: any, i: number) => (
                      <div key={code.id} className="bg-slate-800/50 p-3 rounded">
                        <p className="text-gray-400 text-sm">親友 {i + 1}</p>
                        <p className="font-mono font-semibold text-amber-300">{code.code}</p>
                        <button onClick={() => handleCopyCode(code.code)}
                          className="mt-1 px-4 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 transition">
                          一鍵複製
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BUG 4: 刪除最下方隱藏鍵選項 — 已移除 */}

              <button onClick={() => {
                setShowResult(false);
                setQueryPhone("");
                setQueryDate("");
                setSelectedBookingId(null);
                setQueryParams(null);
              }}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition">
                返回查詢
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p>查詢不到相應的預約資料</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
