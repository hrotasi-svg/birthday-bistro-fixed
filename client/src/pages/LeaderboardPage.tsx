import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getFrontBranchId } from "@/lib/branch";

type Tab = "last" | "current" | "yearly";

export default function LeaderboardPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("last");
  const [selectedMonth, setSelectedMonth] = useState("");

  const { data: settings = {} as any } = trpc.system.settings.get.useQuery({ branchId: getFrontBranchId() });
  const { data: monthlyKingEntries = [] } = trpc.monthlyKing.list.useQuery({ branchId: getFrontBranchId() });
  const { data: currentMonthBookings = [] } = trpc.monthlyKing.currentMonth.useQuery({ branchId: getFrontBranchId() });

  // 17-3: yearlyKingVisible 由後台系統設定控制
  const yearlyKingVisible = settings?.yearlyKingVisible ?? true;

  // BUG 49: Use monthlyLeaderboardWithNames to get real birthday names and challenge dates
  const { data: leaderboardWithNames } = trpc.finance.monthlyLeaderboardWithNames.useQuery(
    { month: selectedMonth || undefined },
    { enabled: !!selectedMonth && tab === "last" }
  );

  // BUG 49: Yearly leaderboard with real names
  const currentYear = new Date().getFullYear();
  const { data: yearlyLeaderboardWithNames } = trpc.finance.monthlyLeaderboardWithNames.useQuery(
    { month: `${currentYear}` },
    { enabled: tab === "yearly" }
  );

  const visible = settings?.leaderboardVisible ?? true;
  const yearlyVisible = settings?.monthlyLeaderboardVisible ?? true;  

  if (!visible) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <p className="text-amber-400 text-lg mb-4">營業王排行榜目前未開放</p>
            <button onClick={() => navigate("/main")}
              className="text-amber-400 border border-amber-400 rounded-lg px-6 py-3 hover:bg-amber-500/10 transition-colors">
              ← 返回主功能頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  // BUG 12: 年度營業王 tab 受 monthlyLeaderboardVisible 設定控制
  const tabs: { id: Tab; label: string }[] = [
    { id: "last", label: "每月營業王" },
    { id: "current", label: "本月營業王" },
    { id: "yearly" as const, label: "年度營業王" },
  ];

  // BUG 49: Build yearly data from monthlyLeaderboardWithNames (real names, 2-column display)
  const yearlyDataWithNames: { month: number; name: string; date: string; revenue: string }[] = [];
  if (yearlyLeaderboardWithNames && Array.isArray(yearlyLeaderboardWithNames)) {
    const byMonth: Record<number, any> = {};
    (yearlyLeaderboardWithNames as any[]).forEach((e: any) => {
      const d = e.challengeDate ? new Date(e.challengeDate) : null;
      const m = d ? d.getMonth() + 1 : 0;
      if (m > 0 && (!byMonth[m] || e.totalRevenue > byMonth[m].totalRevenue)) {
        byMonth[m] = e;
      }
    });
    for (let i = 1; i <= 12; i++) {
      if (byMonth[i]) {
        yearlyDataWithNames.push({
          month: i,
          name: byMonth[i].birthdayName || `壽星 #${byMonth[i].hostUserId}`,
          date: byMonth[i].challengeDate ? new Date(byMonth[i].challengeDate).toLocaleDateString("zh-TW") : "—",
          revenue: String(byMonth[i].totalRevenue || 0),
        });
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-4"
            style={{ background: "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)", backgroundSize: "180% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            挑戰營業王・贏得最新 iPhone Pro
          </h1>

          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${tab === t.id ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-amber-400 border border-slate-600 hover:border-amber-500"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "last" && (
            <div className="bg-slate-900/60 rounded-2xl p-6 md:p-8 space-y-6">
              {/* BUG 10: 粉色字體 */}
              <p className="text-lg text-center text-pink-400 font-semibold">品牌每月榮耀，挑戰更高紀錄</p>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <button key={m} onClick={() => setSelectedMonth(String(m))}
                    className={`px-3 py-2 rounded text-sm font-semibold transition ${selectedMonth === String(m) ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-amber-400 border border-slate-600 hover:border-amber-500"}`}>{m}月</button>
                ))}
              </div>
              {selectedMonth ? (() => {
                const entry = (monthlyKingEntries as any[]).find((e: any) => e.month === Number(selectedMonth));
                return entry ? (
                  <div className="bg-slate-800/60 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2"><span className="text-2xl">👑</span><span className="text-white font-bold text-lg">{entry.name}</span></div>
                    <p className="text-slate-400 text-sm">日期：{entry.eventDate}</p>
                    <p className="text-amber-400 font-bold">當日營業額：NT${Number(entry.revenue || 0).toLocaleString()}</p>
                    {entry.mvp ? <p className="text-pink-400 font-semibold">MVP：{entry.mvp}</p> : null}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center">該月份暫無營業王資訊</p>
                );
              })() : (
                <p className="text-slate-400 text-center">請選擇月份查看營業王資訊</p>
              )}
            </div>
          )}

          {tab === "current" && (
            <div className="bg-slate-900/60 rounded-2xl p-6 md:p-8 space-y-6">
              {/* BUG 11: 文字改為「挑戰進行中，冠軍名單將於每月5日公布」粉色字體 */}
              <p className="text-lg text-center text-pink-400 font-semibold">挑戰進行中，冠軍名單將於每月5日公布</p>
              {settings?.currentMonthKingVisible !== false ? (
                (currentMonthBookings as any[]).length > 0 ? (
                  <div className="space-y-3">
                    {/* BUG 14: 顯示壽星姓名、日期、營業額，以營業額排名，第一名皇冠 */}
                    {(currentMonthBookings as any[]).sort((a: any, b: any) => parseInt(b.totalRevenue || "0") - parseInt(a.totalRevenue || "0")).map((entry: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                          {idx === 0 && <span className="text-2xl">👑</span>}
                          <div>
                            <span className="text-white font-bold">{entry.birthdayName}</span>
                            <p className="text-slate-400 text-xs">{entry.eventDate || ""}</p>
                          </div>
                        </div>
                        <span className="text-amber-400 font-bold">NT${Number(entry.totalRevenue || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* BUG 12: 文字改為「為維持挑戰公平性，本月排行榜暫不公開」 */
                  <p className="text-slate-400 text-center">為維持挑戰公平性，本月排行榜暫不公開</p>
                )
              ) : (
                <p className="text-slate-400 text-center">為維持挑戰公平性，本月排行榜暫不公開</p>
              )}
            </div>
          )}

        {tab === "yearly" && (
            <div className="bg-slate-900/60 rounded-2xl p-6 md:p-8 space-y-6">
              {/* BUG 13: 粉色字體 */}
              <p className="text-lg text-center text-pink-400 font-semibold">集結每月最強壽星，角逐年度最高榮耀</p>
              {yearlyKingVisible ? (
                <>
                  {/* 17-3: 年度營業王 — 顯示12個月每月營業額最高壽星（從monthlyKingEntries取） */}
                  {(monthlyKingEntries as any[]).length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {(monthlyKingEntries as any[]).sort((a: any, b: any) => a.month - b.month).map((entry: any, idx: number) => (
                        <div key={entry.month || idx} className="bg-slate-800/60 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-amber-400 font-bold">{entry.month}月</span>
                            {idx === 0 && <span className="text-lg ml-1">👑</span>}
                          </div>
                          <p className="text-white font-semibold">{entry.name || "—"}</p>
                          <p className="text-slate-400 text-xs">{entry.eventDate || "—"}</p>
                          <p className="text-amber-400 text-sm font-bold mt-1">{entry.revenue ? `NT$${Number(entry.revenue).toLocaleString()}` : "—"}</p>
                          {entry.mvp && <p className="text-pink-400 text-xs font-semibold">MVP：{entry.mvp}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-4">年度排行榜將於每月冠軍產生後自動更新</p>
                  )}
                  <div className="border-t border-amber-500/20 pt-6 mt-6">
                    <p className="text-amber-400 text-xl font-bold text-center">年度冠軍特別企劃</p>
                    <p className="text-slate-300 text-center mt-2">集結歷屆冠軍壽星</p>
                    {/* BUG 48: Coming Soon with pink metallic gradient font */}
                    <p className="text-center mt-1 font-bold text-lg"
                      style={{ background: "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)", backgroundSize: "180% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                      Coming Soon
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 space-y-2"><p className="text-amber-400 text-xl font-bold">年度冠軍特別企劃</p><p className="text-slate-300">集結歷屆冠軍壽星</p><p className="text-pink-400 font-bold text-lg">Coming Soon</p></div>
              )}
            </div>
          )}

          <div className="text-center mt-6">
            <button onClick={() => navigate("/main")}
              className="text-amber-400 border border-amber-400 rounded-lg px-6 py-3 hover:bg-amber-500/10 transition-colors">
              ← 返回主功能頁
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
