import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getFrontBranchId } from "@/lib/branch";

const STATUS_LABELS = [
  "日場預約保留",
  "晚場預約保留",
  "全日預約保留",
  "日場席位鎖定",
  "晚場席位鎖定",
  "全日席位鎖定",
];

const STATUS_COLORS: Record<string, string> = {
  "日場預約保留": "text-blue-400",
  "晚場預約保留": "text-purple-400",
  "全日預約保留": "text-green-400",
  "日場席位鎖定": "text-orange-400",
  "晚場席位鎖定": "text-red-400",
  "全日席位鎖定": "text-red-500",
};

export default function BookingCalendarPage() {
  const [, navigate] = useLocation();
  const branchId = getFrontBranchId();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const yearMonth = `${year}-${String(month).padStart(2, "0")}`;
  const { data: calendarData = [] } = trpc.bookingCalendar.listMonth.useQuery({ branchId, yearMonth });

  const statusMap = useMemo(() => {
    const map: Record<string, string> = {};
    (calendarData as any[]).forEach((item: any) => { map[item.date] = item.status; });
    return map;
  }, [calendarData]);

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

  const prevMonth = () => { if (month === 1) { setYear(year - 1); setMonth(12); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 12) { setYear(year + 1); setMonth(1); } else setMonth(month + 1); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-6"
            style={{ background: "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)", backgroundSize: "180% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            預約查詢
          </h1>

          {/* Month navigation */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button onClick={prevMonth} className="px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-600">◀</button>
            <span className="text-white font-bold text-lg">{year} 年 {month} 月</span>
            <button onClick={nextMonth} className="px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-600">▶</button>
          </div>

          {/* Calendar */}
          <div className="bg-slate-900/60 rounded-2xl p-4 md:p-6">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["日", "一", "二", "三", "四", "五", "六"].map(d => (
                <div key={d} className="text-amber-400 font-semibold text-sm py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weeks.flat().map((day, idx) => {
                if (day === null) return <div key={idx} className="h-16" />;
                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const status = statusMap[dateStr];
                return (
                  <div key={idx} className="h-16 bg-slate-800/60 rounded flex flex-col items-center justify-start pt-1 px-0.5">
                    <span className="text-white text-xs font-semibold">{day}</span>
                    {status && (
                      <span className={`text-[9px] leading-tight text-center mt-0.5 ${STATUS_COLORS[status] || "text-gray-300"}`}>
                        {status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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
