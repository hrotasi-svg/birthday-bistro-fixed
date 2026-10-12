import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getFrontBranchId } from "@/lib/branch";

export default function BookingPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // 17-6/7/8: booking date lock check
  const branchId = getFrontBranchId();
  const [dateLockMsg, setDateLockMsg] = useState("");

  // 同意條款
  const [agreeTerms, setAgreeTerms] = useState(false);

  // 基本資料
  const [birthdayName, setBirthdayName] = useState("");
  const [birthdayDate, setBirthdayDate] = useState("");
  const [phone, setPhone] = useState("");
  const [lineId, setLineId] = useState("");
  const [job, setJob] = useState("");
  const [skills, setSkills] = useState("");

  // 場次
  const [sessionType, setSessionType] = useState<"day" | "night" | "">("");

  // 慶生儀式
  const [ceremonyType, setCeremonyType] = useState<"wish" | "chinese" | "korean" | "">("");

  // 是否挑戰壽星營業王
  const [challengeLeader, setChallengeLeader] = useState<boolean | null>(null);

  // 派對主題
  const [partyThemeChoice, setPartyThemeChoice] = useState<"store" | "custom" | "">("");
  const [partyThemeCustom, setPartyThemeCustom] = useState("");

  // 如何得知本活動（可複選）
  const [sources, setSources] = useState<string[]>([]);

  // 派對日期
  const [eventDate, setEventDate] = useState("");
  const checkDateLock = async (date: string) => {
    setDateLockMsg("");
    if (!date) return;
    try {
      const res = await fetch(`/api/trpc/bookingCalendar.getDate?input=${encodeURIComponent(JSON.stringify({ json: { branchId, date } }))}`);
      const json = await res.json();
      const status = json?.result?.data?.json?.status;
      if (!status) return;
      if (status === "全日席位鎖定") {
        setDateLockMsg("此日期目前已被預約鎖定，歡迎選擇其他日期");
      } else if (status === "日場席位鎖定" && sessionType === "day") {
        setDateLockMsg("此日期日場席位已被鎖定，推薦您改為晚間場次，歡迎聯繫我們");
      } else if (status === "晚場席位鎖定" && sessionType === "night") {
        setDateLockMsg("此日期晚場席位已被鎖定，推薦您改為日間場次，歡迎聯繫我們");
      }
    } catch { /* ignore */ }
  };

  // 提交成功 Dialog
  const [showSuccess, setShowSuccess] = useState(false);

  const createMutation = trpc.booking.create.useMutation({
    onSuccess: () => {
      // 僅保存查詢識別，紅點是否存在仍由資料庫 booking_notifications 判定。
      localStorage.setItem("bookingActivityLookup", JSON.stringify({
        phone,
        eventDate,
        branchId: getFrontBranchId(),
      }));
      setShowSuccess(true);
      utils.booking.myList.invalidate();
    },
    onError: (err) => {
      toast.error("提交失敗：" + err.message);
    },
  });

  const toggleSource = (src: string) => {
    setSources((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    );
  };

  const handleSubmit = () => {
    if (!birthdayName || !birthdayDate || !phone || !sessionType || !ceremonyType || !eventDate) {
      toast.error("請填寫所有必填欄位");
      return;
    }
    if (dateLockMsg) {
      toast.error(dateLockMsg);
      return;
    }
    createMutation.mutate({
      branchId: getFrontBranchId(),
      birthdayName,
      birthdayDate,
      phone,
      lineId: lineId || undefined,
      job: job || undefined,
      skills: skills || undefined,
      sessionType: sessionType as "day" | "night",
      ceremonyType: ceremonyType as "wish" | "chinese" | "korean",
      challengeLeader: challengeLeader ?? false,
      partyThemeChoice: (partyThemeChoice || undefined) as "store" | "custom" | undefined,
      partyThemeCustom: partyThemeChoice === "custom" ? partyThemeCustom : undefined,
      sourceChannels: sources.length > 0 ? sources.join(",") : undefined,
      eventDate,
      challengeMode: challengeLeader ?? false,
    });
  };

  const handleConfirmSuccess = () => {
    setShowSuccess(false);
    navigate("/main");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">
            壽星報名表
          </h1>

          <div className="space-y-8 bg-slate-900/60 rounded-2xl p-6 md:p-8">
            {/* 基本資料 */}
            <div>
              <h2 className="text-xl font-bold text-amber-400 mb-4">基本資料</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-1 block">壽星姓名</Label>
                  <Input
                    value={birthdayName}
                    onChange={(e) => setBirthdayName(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="請輸入壽星姓名"
                  />
                </div>
                <div>
                  <Label className="text-white mb-1 block">壽星出生年月日</Label>
                  <Input
                    value={birthdayDate}
                    onChange={(e) => setBirthdayDate(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="例如：1995-01-15"
                  />
                </div>
                <div>
                  <Label className="text-white mb-1 block">聯絡電話</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="請輸入聯絡電話"
                  />
                </div>
               <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Label className="text-white">LINE ID：（請點選加入官方 LINE：</Label>
                    <a href="https://line.me/R/ti/p/@426jaurn" target="_blank" rel="noopener noreferrer" className="inline-block">
                      <img src="/manus-storage/icon-line_f2602bd0.png" alt="LINE" width="24" height="24" className="rounded-full" />
                    </a>
                    <Label className="text-white">）</Label>
                  </div>
                  <Input
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="請輸入 LINE ID，以便通知審核結果"
                  />
                </div>
                <div>
                  <Label className="text-white mb-1 block">工作</Label>
                  <Input
                    value={job}
                    onChange={(e) => setJob(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="請輸入工作"
                  />
                </div>
                <div>
                  <Label className="text-white mb-1 block">專長</Label>
                  <Textarea
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="請輸入專長"
                  />
                </div>
              </div>
            </div>

            {/* 場次 */}
            <div>
              <h2 className="text-xl font-bold text-amber-400 mb-4">場次</h2>
              <RadioGroup
                value={sessionType}
                onValueChange={(v) => { setSessionType(v as "day" | "night"); if (eventDate) setTimeout(() => checkDateLock(eventDate), 50); }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="day" id="day" />
                  <Label htmlFor="day" className="text-white cursor-pointer">
                    日間場：10:00～16:00
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="night" id="night" />
                  <Label htmlFor="night" className="text-white cursor-pointer">
                    晚間場：17:00～23:00
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 慶生儀式 */}
            <div>
              <h2 className="text-xl font-bold text-amber-400 mb-4">慶生儀式</h2>
              <RadioGroup
                value={ceremonyType}
                onValueChange={(v) => setCeremonyType(v as "wish" | "chinese" | "korean")}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="wish" id="wish" />
                  <Label htmlFor="wish" className="text-white cursor-pointer">
                    心願招喚儀式
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="chinese" id="chinese" />
                  <Label htmlFor="chinese" className="text-white cursor-pointer">
                    中式符印儀式
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="korean" id="korean" />
                  <Label htmlFor="korean" className="text-white cursor-pointer">
                    韓式咒印儀式
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 是否挑戰隱藏彩蛋－壽星營業王 */}
            <div>
              <h2 className="text-xl font-bold text-amber-400 mb-4">
                是否挑戰隱藏彩蛋－壽星營業王
              </h2>
              <RadioGroup
                value={challengeLeader === null ? "" : challengeLeader ? "yes" : "no"}
                onValueChange={(v) => setChallengeLeader(v === "yes")}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="yes" id="leader-yes" />
                  <Label htmlFor="leader-yes" className="text-white cursor-pointer">
                    是，我要挑戰
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="no" id="leader-no" />
                  <Label htmlFor="leader-no" className="text-white cursor-pointer">
                    否，只參加開店遊戲派對
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 派對主題 */}
            <div>
              <h2 className="text-xl font-bold text-amber-400 mb-4">派對主題</h2>
              <RadioGroup
                value={partyThemeChoice}
                onValueChange={(v) => setPartyThemeChoice(v as "store" | "custom")}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="store" id="theme-store" />
                  <Label htmlFor="theme-store" className="text-white cursor-pointer">
                    店家安排主題
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="custom" id="theme-custom" />
                  <Label htmlFor="theme-custom" className="text-white cursor-pointer">
                    自費自訂主題
                  </Label>
                </div>
              </RadioGroup>
              {partyThemeChoice === "custom" && (
                <div className="mt-4">
                  <Label className="text-white mb-1 block">請描述您的派對主題</Label>
                  <Textarea
                    value={partyThemeCustom}
                    onChange={(e) => setPartyThemeCustom(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="請描述您的派對主題"
                  />
                </div>
              )}
            </div>

            {/* 如何得知本活動（可複選） */}
            <div>
              <h2 className="text-xl font-bold text-amber-400 mb-4">如何得知本活動</h2>
              <div className="space-y-3">
                {["Facebook", "Instagram", "TikTok", "Google 搜尋", "朋友推薦"].map((src) => (
                  <div key={src} className="flex items-center space-x-3">
                    <Checkbox
                      id={`src-${src}`}
                      checked={sources.includes(src)}
                      onCheckedChange={() => toggleSource(src)}
                    />
                    <Label htmlFor={`src-${src}`} className="text-white cursor-pointer">
                      {src}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 選擇派對日期 */}
            <div>
              <h2 className="text-xl font-bold text-amber-400 mb-4">選擇派對日期</h2>
            <Input
                type="date"
                value={eventDate}
                onChange={(e) => { setEventDate(e.target.value); checkDateLock(e.target.value); }}
                className="bg-slate-800 border-slate-600 text-white"
              />
              {dateLockMsg && <p className="text-red-400 text-sm mt-2 font-semibold">{dateLockMsg}</p>}
            </div>

            {/* 同意條款 */}
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="agree-terms"
                checked={agreeTerms}
                onCheckedChange={(v) => setAgreeTerms(!!v)}
              />
              <Label htmlFor="agree-terms" className="text-white text-sm cursor-pointer leading-relaxed">
                我已閱讀並同意《隱私權政策》及《使用者條款》
              </Label>
            </div>

            {/* 提交報名表 */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || !agreeTerms}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-6"
              >
                {createMutation.isPending ? "提交中..." : "提交報名表"}
              </Button>
            </div>
          </div>

          {/* 返回鍵 */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/main")}
              className="text-amber-400 border border-amber-400 rounded-lg px-6 py-3 hover:bg-amber-500/10 transition-colors"
            >
              ← 返回主功能頁
            </button>
          </div>
        </div>
      </div>

      {/* 提交成功 Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-white">
              恭喜！您的生日企劃已送出！
            </DialogTitle>
            <div className="space-y-2 pt-2 text-center text-sm leading-relaxed text-slate-200">
              <p>點選我的生日倒數，建立會員帳號，</p>
              <p>隨時掌握您的的活動進度</p>
              <p>審核通過、繳費確認、邀請碼等重要通知，</p>
              <p>將直接顯示在「<span className="relative inline-block pr-3">我的活動<span aria-label="活動通知紅點" className="pointer-events-none absolute -right-0.5 -top-1 h-2.5 w-2.5 rounded-full bg-red-600" /></span>」</p>
            </div>
          </DialogHeader>
          <DialogFooter className="flex justify-center">
            <Button
              onClick={handleConfirmSuccess}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8"
            >
              確定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
