import { useLocation } from "wouter";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { getFrontBranchId } from "@/lib/branch";
import { GlassRainEffect } from "@/pages/Home";
import { useAuth } from "@/_core/hooks/useAuth";
import MAIN_FUNCTION_BACKGROUND_LOCAL from "../Screenshot_20260814-003844_ZArchiver_f4a19117.jpg";

type FunctionItem = {
  id: string;
  title: string;
  desc: string;
  path: string;
};

const MAIN_FUNCTION_BACKGROUND = MAIN_FUNCTION_BACKGROUND_LOCAL;
const overlayText = "absolute z-10 flex touch-manipulation select-none items-center justify-center bg-transparent p-0 text-center font-bold leading-tight text-white transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/90";

const FUNCTIONS: FunctionItem[] = [
  { id: "A", title: "開始預約", desc: "Make a Reservation", path: "/booking" },
  { id: "B", title: "我的活動", desc: "【預約進度】", path: "/my-booking" },
  { id: "C", title: "我的任務", desc: "【輸入邀請碼】", path: "/invite" },
  { id: "D", title: "壽星營業王", desc: "Birthday Sales Champion", path: "/leaderboard" },
  { id: "E", title: "精選菜單", desc: "", path: "/menu" },
  { id: "M", title: "真實體驗牆", desc: "Testimonial Wall", path: "/experience" },
  { id: "N", title: "預約查詢", desc: "", path: "/booking-calendar" },
  { id: "H", title: "我的生日倒數", desc: "準備好了嗎？", path: "/member" },
  { id: "I", title: "升級體驗", desc: "【升級會員】", path: "/npc" },
  { id: "L", title: "我的 SOP", desc: "", path: "/sop" },
  { id: "J", title: "慶生儀式", desc: "", path: "/ritual" },
  { id: "K", title: "了解更多", desc: "", path: "/more" },
];

type ImageHitArea = {
  id: FunctionItem["id"] | "RETURN";
  left: string;
  top: string;
  width: string;
  height: string;
};

// The uploaded image already contains the visible labels. These buttons are intentionally transparent.
const IMAGE_HIT_AREAS: ImageHitArea[] = [
  { id: "A", left: "3%", top: "7%", width: "38%", height: "18%" },
  { id: "B", left: "40%", top: "8%", width: "29%", height: "14%" },
  { id: "C", left: "64%", top: "8%", width: "33%", height: "14%" },
  { id: "D", left: "48%", top: "27%", width: "49%", height: "16%" },
  { id: "M", left: "13%", top: "47%", width: "74%", height: "16%" },
  { id: "E", left: "3%", top: "56%", width: "31%", height: "14%" },
  { id: "J", left: "32%", top: "56%", width: "34%", height: "14%" },
  { id: "I", left: "62%", top: "56%", width: "36%", height: "14%" },
  { id: "H", left: "25%", top: "69.5%", width: "31%", height: "12%" },
  { id: "K", left: "63%", top: "69%", width: "35%", height: "15%" },
  { id: "RETURN", left: "26.5%", top: "86%", width: "47%", height: "6.6%" },
];

export default function MainFunctionPage() {
  const [, navigate] = useLocation();
  const branchId = getFrontBranchId();
  const { isAuthenticated } = useAuth();
  const activityLookup = useMemo(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("bookingActivityLookup") || "{}");
      return parsed?.branchId === branchId && parsed?.phone && parsed?.eventDate
        ? { phone: String(parsed.phone), eventDate: String(parsed.eventDate) }
        : undefined;
    } catch {
      return undefined;
    }
  }, [branchId]);
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
  const { data: settings = {} as any } = trpc.system.settings.get.useQuery({ branchId });
  const { data: notificationSummary } = trpc.booking.notificationSummary.useQuery({
    branchId,
    memberId: memberLogin?.memberId,
    phone: memberLogin?.phone,
  });
  const rainEffectEnabled = settings?.rainEffect !== false;
  const hasBookingUnread = notificationSummary?.hasAdminUnread === true;
  // 查詢會員資料即登入會員：由本次工作階段保存的會員編號＋電話取得本人通知；
  // 保留 OAuth 已登入會員的既有相容行為，未查詢會員的訪客仍不顯示個人紅點。
  const hasActivityUnread = (Boolean(memberLogin) || isAuthenticated) && notificationSummary?.hasCustomerUnread === true;

  const visibleFunctions = FUNCTIONS.filter((func) => {
    if (func.id === "D" && settings?.leaderboardVisible === false) return false;
    if (func.id === "I" && settings?.npcVisible === false) return false;
    if (func.id === "L" && settings?.sopVisible === false) return false;
    if (func.id === "N" && settings?.bookingCalendarVisible === false) return false;
    return true;
  });
  const byId = (id: string) => visibleFunctions.find((func) => func.id === id);
  const go = (func: FunctionItem | undefined) => {
    if (func) navigate(func.path);
  };
  const calendar = byId("N");
  const sop = byId("L");

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <main className="w-full">
        <div className="bistro-portrait-shell bg-black">
          {/* 將底圖、文字與透明點擊區一同微幅水平延展，移除圖片兩側黑邊時仍維持 Hotspot 對準同一內容位置。 */}
          <div className="absolute inset-0 origin-center [transform:scaleX(1.08)]">
            <img
              src={MAIN_FUNCTION_BACKGROUND}
              alt="主功能選單"
              className="absolute inset-0 h-full w-full select-none object-fill"
            />
            {rainEffectEnabled && <GlassRainEffect />}

            {calendar && (
              <button
                type="button"
                aria-label={calendar.title}
                onClick={() => go(calendar)}
                className={`${overlayText} left-[9.5%] top-[23.7%] h-[5.8%] w-[27%]`}
                style={{ fontSize: "3.3cqw" }}
              >
                {calendar.title}
              </button>
            )}

            {sop && (
              <button
                type="button"
                aria-label={sop.title}
                onClick={() => go(sop)}
                className={`${overlayText} left-[56.9%] top-[23.7%] h-[5.8%] w-[30%]`}
                style={{ fontSize: "3.3cqw" }}
              >
                {sop.title}
              </button>
            )}

            {IMAGE_HIT_AREAS.map((area) => {
              if (area.id === "RETURN") {
                return (
                  <button
                    key="image-hit-return"
                    type="button"
                    aria-label="返回首頁"
                    onClick={() => navigate("/")}
                    className="absolute z-[5] touch-manipulation bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/90"
                    style={{ left: area.left, top: area.top, width: area.width, height: area.height }}
                  />
                );
              }

              const func = byId(area.id);
              if (!func) return null;

              return (
                <button
                  key={`image-hit-${area.id}`}
                  type="button"
                  aria-label={func.title}
                  onClick={() => go(func)}
                  className="absolute z-[5] touch-manipulation bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/90"
                  style={{ left: area.left, top: area.top, width: area.width, height: area.height }}
                >
                  {func.id === "A" && hasBookingUnread && (
                    <span aria-label="有新的預約通知" className="pointer-events-none absolute right-[7%] top-[28%] h-[1.4cqw] w-[1.4cqw] rounded-full bg-red-600 shadow-[0_0_4px_rgba(220,38,38,0.75)]" />
                  )}
                  {func.id === "B" && hasActivityUnread && (
                    <span aria-label="有新的活動通知" className="pointer-events-none absolute right-[7%] top-[66%] h-[1.4cqw] w-[1.4cqw] rounded-full bg-red-600 shadow-[0_0_4px_rgba(220,38,38,0.75)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
