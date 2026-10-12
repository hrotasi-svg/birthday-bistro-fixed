import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getFrontBranchId } from "@/lib/branch";

const MEMBER_LOGIN_SESSION_KEY = "birthdayBistroMemberLogin";
const EXPERIENCE_ATTRACTIONS = ["包場慶生", "團隊遊戲", "當一日餐酒館老闆", "賺錢機制", "任務挑戰", "營業王競賽", "壽星與朋友共同完成活動", "美食", "調酒"] as const;
type ExperienceAttraction = (typeof EXPERIENCE_ATTRACTIONS)[number];
type ExpectationChoice = "" | "far_exceeds" | "exceeds" | "slightly_below" | "not_meet";
type IntentChoice = "" | "definitely" | "probably" | "maybe" | "no";

function readMemberLoginSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(MEMBER_LOGIN_SESSION_KEY) || "{}");
    return saved?.phone && saved?.member ? saved : null;
  } catch {
    return null;
  }
}

// 第16批次-7: 生日倒數 — 距離下一次生日的即時倒數（X天XX時XX分XX秒）
function BirthdayCountdown({ birthday }: { birthday: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  // birthday 格式：YYYYMMDD 或 YYYY-MM-DD、YYYY/MM/DD
  const digits = (birthday || "").replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;
  const month = parseInt(digits.slice(4, 6), 10);
  const day = parseInt(digits.slice(6, 8), 10);
  if (!month || !day || month > 12 || day > 31) return null;
  const current = new Date(now);
  let next = new Date(current.getFullYear(), month - 1, day, 0, 0, 0);
  if (next.getTime() <= now) next = new Date(current.getFullYear() + 1, month - 1, day, 0, 0, 0);
  const diff = next.getTime() - now;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const within7 = days < 7;
  return (
    <div className="bg-slate-900/70 p-5 rounded-lg border border-pink-500/40 text-center mb-4">
      <p className="text-white font-semibold text-lg mb-2">距離我的慶生體驗還有</p>
      <p className="text-white text-2xl font-bold tracking-wide">
        <span className={within7 ? "text-pink-400" : "text-white"}>{days}</span>
        <span className="text-white">天</span>
        <span className="text-white">{pad(hours)}</span>
        <span className="text-white">時</span>
        <span className="text-white">{pad(mins)}</span>
        <span className="text-white">分</span>
        <span className="text-pink-400">{pad(secs)}</span>
        <span className="text-pink-400">秒</span>
      </p>
    </div>
  );
}

export default function MemberPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"join" | "subscribe">("join");

  // Public registration form (no OAuth required per PRD)
  const [joinForm, setJoinForm] = useState({
    name: "",
    birthday: "",
    phone: "",
    lineId: "",
    birthdayWish: "",
  });
  const [registeredMember, setRegisteredMember] = useState<any>(null);
  const [lookupForm, setLookupForm] = useState({ name: "", phone: "" });
  const [lookedUpMember, setLookedUpMember] = useState<any>(() => readMemberLoginSession()?.member ?? null);
  const [showExperienceSurvey, setShowExperienceSurvey] = useState(false);
  const [surveyForm, setSurveyForm] = useState<{
    expectation: ExpectationChoice;
    attendAgain: IntentChoice;
    recommend: IntentChoice;
    attractions: ExperienceAttraction[];
    activityMvp: string;
    atmosphereMvp: string;
  }>({ expectation: "", attendAgain: "", recommend: "", attractions: [], activityMvp: "", atmosphereMvp: "" });

  const { data: settings = {} as any } = trpc.system.settings.get.useQuery({ branchId: getFrontBranchId() });

  // Public member lookup (no OAuth)
  const [lookupParams, setLookupParams] = useState<{ name: string; phone: string } | null>(null);
  const { data: lookupResults = [] } = trpc.member.lookupByNamePhone.useQuery(
    lookupParams ?? { name: "", phone: "" },
    { enabled: !!lookupParams }
  );

  const registerMutation = trpc.member.register.useMutation();
  const memberUpdateMutation = trpc.member.update.useMutation();

  const subscriptionVisible = settings?.subscriptionVisible ?? true;
  const premiumPlanVisible = settings?.premiumPlanVisible ?? true;
  const newcomerPlanVisible = settings?.newcomerPlanVisible ?? true;

  const handleJoinChange = (field: string, value: string) => {
    setJoinForm((prev) => ({ ...prev, [field]: value }));
  };

  // BUG 16: After registration, auto-sync with backend and show full member info
  const handleJoinSubmit = async () => {
    if (!joinForm.name || !joinForm.birthday || !joinForm.phone || !joinForm.lineId) {
      toast.error("請填寫所有必填欄位");
      return;
    }
    try {
      const result = await registerMutation.mutateAsync({
        name: joinForm.name,
        birthday: joinForm.birthday,
        phone: joinForm.phone,
        lineId: joinForm.lineId,
        birthdayWish: joinForm.birthdayWish,
      });
      // BUG 15/16: Show full member info after registration
      setRegisteredMember({
        name: joinForm.name,
        birthday: joinForm.birthday,
        phone: joinForm.phone,
        lineId: joinForm.lineId,
        birthdayWish: joinForm.birthdayWish,
        memberNumber: result.memberNumber,
        memberRole: "general",
        premiumStatus: "none",
        subscriptionPlatform: "restaurant",
        blackCardBenefit: "全年用餐五折優惠",
        blackCardNo: "無",
        blackCardImageUrl: "",
        blackCardImageVisible: true,
        blackCardMethod: "none",
        blackCardDate: "",
        blackCardExpiry: "",
        blackCardAcquiredBy: "",
        premiumStartDate: "",
        premiumEndDate: "",
        appAutoRenew: false,
        appCancelStatus: "",
        appPromo: "",
      });
      toast.success(`會員註冊成功！會員編號：${result.memberNumber}`);
      setJoinForm({ name: "", birthday: "", phone: "", lineId: "", birthdayWish: "" });
    } catch {
      toast.error("會員註冊失敗，請稍後重試");
    }
  };

  const handleLookup = () => {
    if (!lookupForm.name || !lookupForm.phone) {
      toast.error("請輸入姓名和手機號碼");
      return;
    }
    setLookupParams({ name: lookupForm.name, phone: lookupForm.phone });
  };

  // When lookup results arrive, update lookedUpMember
  useEffect(() => {
    if (lookupResults && (lookupResults as any[]).length > 0 && lookupParams) {
      const member = (lookupResults as any[])[0];
      setLookedUpMember(member);
      // 「登入會員」沿用原本姓名＋電話查詢；只在目前瀏覽器工作階段保存
      // 已查詢會員，離開此頁不會登出，完整關閉網站後則自然失效。
      try {
        sessionStorage.setItem(MEMBER_LOGIN_SESSION_KEY, JSON.stringify({
          branchId: getFrontBranchId(),
          phone: member.phone,
          member,
        }));
      } catch {}
    }
  }, [lookupResults, lookupParams]);

  // Use first match from lookup results or registered member
  const memberInfo = lookedUpMember || registeredMember || null;
  const experienceSurveyMemberId = Number(memberInfo?.id || 0);
  const experienceSurveyPhone = String(memberInfo?.phone || "");
  const experienceSurveyBranchId = getFrontBranchId();
  const { data: existingExperienceSurvey, refetch: refetchExperienceSurvey } = trpc.experienceSurvey.getForMember.useQuery(
    { memberId: experienceSurveyMemberId, phone: experienceSurveyPhone, branchId: experienceSurveyBranchId },
    { enabled: experienceSurveyMemberId > 0 && !!experienceSurveyPhone }
  );
  const submitExperienceSurveyMutation = trpc.experienceSurvey.submit.useMutation();

  const memberRole = memberInfo?.memberRole || "general";
  const memberIdentityMap: Record<string, string> = {
    general: "一般會員",
    friend: "親友會員",
    host: "壽星會員",
    premium: "高級會員",
  };
  const memberIdentity = memberIdentityMap[memberRole] || "一般會員";

  const premiumStatus = memberInfo?.premiumStatus || "none";
  const premiumStatusMap: Record<string, string> = {
    none: "未訂閱",
    subscribed: "已訂閱",
    expired: "已到期",
  };
  const premiumStatusText = premiumStatusMap[premiumStatus] || "未訂閱";

  const subscriptionPlatformMap: Record<string, string> = {
    restaurant: "餐酒館",
    google_play: "Google Play",
    app_store: "App Store",
  };
  const subscriptionPlatformText = subscriptionPlatformMap[memberInfo?.subscriptionPlatform || "restaurant"] || "餐酒館";

  const blackCardMethod = memberInfo?.blackCardMethod || "none";
  const blackCardMethodMap: Record<string, string> = {
    none: "未取得",
    host: "壽星挑戰取得",
    friend: "親友挑戰取得",
    subscription: "訂閱取得",
  };
  const blackCardMethodText = blackCardMethodMap[blackCardMethod] || "未取得";
  const blackCardDate = memberInfo?.blackCardDate || "無";
  const blackCardExpiry = memberInfo?.blackCardExpiry || "無";
  const blackCardNo = memberInfo?.blackCardNo || "無";
  const blackCardImageUrl = memberInfo?.blackCardImageUrl || "";
  const blackCardImageVisible = memberInfo?.blackCardImageVisible !== false;
  const blackCardBenefit = memberInfo?.blackCardBenefit || "全年用餐五折優惠";

  const toggleSurveyAttraction = (attraction: ExperienceAttraction) => {
    setSurveyForm((previous) => ({
      ...previous,
      attractions: previous.attractions.includes(attraction)
        ? previous.attractions.filter((item) => item !== attraction)
        : [...previous.attractions, attraction],
    }));
  };

  const submitExperienceSurvey = async () => {
    if (!experienceSurveyMemberId || !experienceSurveyPhone || !surveyForm.expectation || !surveyForm.attendAgain || !surveyForm.recommend) {
      toast.error("請完成前三項必填問卷內容");
      return;
    }
    try {
      await submitExperienceSurveyMutation.mutateAsync({
        memberId: experienceSurveyMemberId,
        phone: experienceSurveyPhone,
        branchId: experienceSurveyBranchId,
        expectation: surveyForm.expectation as Exclude<ExpectationChoice, "">,
        attendAgain: surveyForm.attendAgain as Exclude<IntentChoice, "">,
        recommend: surveyForm.recommend as Exclude<IntentChoice, "">,
        attractions: surveyForm.attractions,
        activityMvp: surveyForm.activityMvp,
        atmosphereMvp: surveyForm.atmosphereMvp,
      });
      await refetchExperienceSurvey();
      setShowExperienceSurvey(false);
      toast.success("問卷已提交，感謝您的回饋！");
    } catch {
      toast.error("問卷提交失敗，請稍後再試");
    }
  };

  const premiumStartDate = memberInfo?.premiumStartDate || "無";
  const premiumEndDate = memberInfo?.premiumEndDate || "無";

  const memberId = memberInfo?.memberNumber || "—";

  const handleSubscribe = async () => {
    if (!memberInfo || !memberInfo.id) { toast.error("請先查詢會員資料"); return; }
    if (premiumStatus === "none") {
      try {
        const now = new Date();
        const end = new Date(now);
        end.setMonth(end.getMonth() + 1);
        await memberUpdateMutation.mutateAsync({
          id: memberInfo.id,
          memberRole: "premium",
          premiumStatus: "subscribed",
          premiumStartDate: now.toISOString(),
          premiumEndDate: end.toISOString(),
          blackCardMethod: "subscription",
          blackCardDate: now.toISOString().split("T")[0],
          blackCardExpiry: end.toISOString().split("T")[0],
        });
        setLookedUpMember((prev: any) => ({
          ...prev,
          memberRole: "premium",
          premiumStatus: "subscribed",
          premiumStartDate: now.toISOString(),
          premiumEndDate: end.toISOString(),
          blackCardMethod: "subscription",
        }));
        toast.success("訂閱成功！您已成為高級會員");
      } catch { toast.error("訂閱失敗"); }
    } else {
      try {
        await memberUpdateMutation.mutateAsync({
          id: memberInfo.id,
          memberRole: "general",
          premiumStatus: "expired",
          blackCardMethod: "none",
        });
        setLookedUpMember((prev: any) => ({
          ...prev,
          memberRole: "general",
          premiumStatus: "expired",
          blackCardMethod: "none",
        }));
        toast.success("已取消訂閱");
      } catch { toast.error("取消訂閱失敗"); }
    }
  };

  // BUG 15: Full member info display component
  const renderFullMemberInfo = () => {
    if (!memberInfo) return null;
    return (
      <div className="mt-6 space-y-3">
        {/* 第16批次-7: 最上方顯示生日倒數 */}
        {memberInfo.birthday && <BirthdayCountdown birthday={memberInfo.birthday} />}
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">姓名</p>
          <p className="text-amber-400">{memberInfo.name || "未提供"}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">出生年月日</p>
          <p className="text-amber-400">{memberInfo.birthday || "未提供"}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">手機號碼</p>
          <p className="text-amber-400">{memberInfo.phone || "未提供"}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">LINE ID</p>
          <p className="text-amber-400">{memberInfo.lineId || "未提供"}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">我的生日願望</p>
          <p className="text-amber-400">{memberInfo.birthdayWish || "未填寫"}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">會員編號</p>
          <p className="text-amber-400 text-lg font-bold">{memberId}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">會員類型</p>
          <p className="text-amber-400">{memberIdentity}</p>
          <p className="text-gray-400 text-xs mt-1">
            {memberIdentity === "壽星會員" && "壽星會員－參加過活動，獲取壽星邀請碼"}
            {memberIdentity === "親友會員" && "親友會員－參加過活動，獲取親友邀請碼"}
            {memberIdentity === "一般會員" && "一般會員－註冊個人資料，獲得成為壽星，報名活動資格"}
            {memberIdentity === "高級會員" && "高級會員－每月NT＄600，加入訂閱"}
          </p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">高級會員狀態</p>
          <p className="text-amber-400">{premiumStatusText}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">高級會員付款平台</p>
          <p className="text-amber-400">{subscriptionPlatformText}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">黑卡權益</p>
          <p className="text-gray-300">{blackCardBenefit}</p>
        </div>
        {blackCardImageVisible && (
          <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
            <p className="text-white font-semibold mb-1">黑卡卡號</p>
            <p className="text-amber-400">{blackCardNo}</p>
            {blackCardImageUrl && (
              <img src={blackCardImageUrl} alt={`黑卡卡號 ${blackCardNo}`} className="mt-2 max-h-52 w-full rounded border border-amber-500/30 object-contain" />
            )}
          </div>
        )}
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">黑卡取得方式</p>
          <p className="text-amber-400">{blackCardMethodText}</p>
          <p className="text-gray-400 text-xs mt-1">
            a.壽星＆親友會員完成挑戰任務後取得<br />b.會員訂閱後取得，取消後失去
          </p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">黑卡取得日期</p>
          <p className="text-amber-400">{blackCardDate}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">黑卡到期日</p>
          <p className="text-amber-400">{blackCardExpiry}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">訂閱日期</p>
          <p className="text-amber-400">{premiumStartDate !== "無" ? new Date(premiumStartDate).toLocaleDateString("zh-TW") : "無"}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
          <p className="text-white font-semibold mb-1">訂閱到期日</p>
          <p className="text-amber-400">{premiumEndDate !== "無" ? new Date(premiumEndDate).toLocaleDateString("zh-TW") : "無"}</p>
        </div>
        {/* 未來App專屬欄位 */}
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20 opacity-60">
          <p className="text-white font-semibold mb-1">自動續訂狀態</p>
          <p className="text-gray-400">{memberInfo.appAutoRenew ? "已開啟" : "未開啟"}</p>
          <p className="text-gray-500 text-xs mt-1">（未來App專屬欄位）</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20 opacity-60">
          <p className="text-white font-semibold mb-1">取消訂閱狀態</p>
          <p className="text-gray-400">{memberInfo.appCancelStatus || "無"}</p>
          <p className="text-gray-500 text-xs mt-1">（未來App專屬欄位）</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20 opacity-60">
          <p className="text-white font-semibold mb-1">新增優惠</p>
          <p className="text-gray-400">{memberInfo.appPromo || "無"}</p>
          <p className="text-gray-500 text-xs mt-1">（未來App專屬欄位）</p>
        </div>
        {experienceSurveyMemberId > 0 && experienceSurveyPhone && (
          existingExperienceSurvey ? (
            <div className="bg-pink-950/35 p-5 rounded-lg border border-pink-400/40 text-center">
              <p className="text-pink-200 font-semibold">感謝您參與本次 壽星餐酒館 活動！</p>
              <p className="text-pink-200 font-semibold">您的每一份回饋，</p>
              <p className="text-pink-200 font-semibold">都是我們持續進步的重要力量。</p>
            </div>
          ) : showExperienceSurvey ? (
            <div className="bg-slate-900/70 p-5 rounded-lg border border-pink-400/40 space-y-6">
              <h3 className="text-xl font-bold text-pink-300">壽星餐酒館活動問卷調查</h3>
              <div className="space-y-3 text-sm text-slate-100">
                <p className="font-semibold">一、本次活動是否超出您的期待？</p>
                <div className="grid grid-cols-2 gap-2">
                  {[["far_exceeds", "遠超預期"], ["exceeds", "超出預期"], ["slightly_below", "略低於預期"], ["not_meet", "不符合預期"]].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="expectation" checked={surveyForm.expectation === value} onChange={() => setSurveyForm((p) => ({ ...p, expectation: value as ExpectationChoice }))} />{label}</label>
                  ))}
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-100">
                <p className="font-semibold">二、私心推薦活動</p>
                <p>・如果再次生日，你您願意再參加嗎？</p>
                <div className="grid grid-cols-2 gap-2">
                  {[["definitely", "一定會"], ["probably", "可能會"], ["maybe", "不一定"], ["no", "不會"]].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="attend-again" checked={surveyForm.attendAgain === value} onChange={() => setSurveyForm((p) => ({ ...p, attendAgain: value as IntentChoice }))} />{label}</label>
                  ))}
                </div>
                <p>・是否願意推薦朋友參加？</p>
                <div className="grid grid-cols-2 gap-2">
                  {[["definitely", "一定會"], ["probably", "可能會"], ["maybe", "不一定"], ["no", "不會"]].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="recommend" checked={surveyForm.recommend === value} onChange={() => setSurveyForm((p) => ({ ...p, recommend: value as IntentChoice }))} />{label}</label>
                  ))}
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-100">
                <p className="font-semibold">三、特色體驗</p>
                <p>本次活動最吸引您的地方（可複選）</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {EXPERIENCE_ATTRACTIONS.map((attraction) => (
                    <label key={attraction} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={surveyForm.attractions.includes(attraction)} onChange={() => toggleSurveyAttraction(attraction)} />{attraction}</label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">四、請選出今日「活動 MVP」：</Label>
                <Input value={surveyForm.activityMvp} maxLength={128} onChange={(event) => setSurveyForm((p) => ({ ...p, activityMvp: event.target.value }))} className="bg-slate-800 border-pink-400/40 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white">五、😂 最佳氣氛王MVP ：</Label>
                <Input value={surveyForm.atmosphereMvp} maxLength={128} onChange={(event) => setSurveyForm((p) => ({ ...p, atmosphereMvp: event.target.value }))} className="bg-slate-800 border-pink-400/40 text-white" />
              </div>
              <p className="text-sm leading-relaxed text-slate-200">我們希望帶給每一位壽星與親友，不只是一次聚餐，而是一段值得珍藏一輩子的回憶，期待下一次，再次與您相聚，祝您天天開心！</p>
              <Button onClick={submitExperienceSurvey} disabled={submitExperienceSurveyMutation.isPending} className="w-full bg-pink-600 text-white hover:bg-pink-700">{submitExperienceSurveyMutation.isPending ? "提交中..." : "提交問卷"}</Button>
            </div>
          ) : (
            <Button onClick={() => setShowExperienceSurvey(true)} className="w-full bg-pink-600 text-white hover:bg-pink-700">體驗調查表</Button>
          )
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <button onClick={() => navigate("/main")}
              className="text-amber-400 border border-amber-400 rounded-lg px-4 py-2 hover:bg-amber-500/10 transition-colors text-sm">
              ← 返回主功能
            </button>
          </div>
          <h1 className="text-3xl font-bold text-white mb-8 text-center pt-4">我的生日倒數</h1>

          <div className="flex gap-4 mb-8 justify-center flex-wrap">
            <button onClick={() => setActiveTab("join")}
              className={`px-6 py-3 rounded font-semibold transition ${activeTab === "join" ? "bg-amber-600 text-white" : "bg-slate-700 text-amber-400 hover:bg-slate-600"}`}>
              加入會員
            </button>
            {subscriptionVisible && (
              <button onClick={() => setActiveTab("subscribe")}
                className={`px-6 py-3 rounded font-semibold transition ${activeTab === "subscribe" ? "bg-amber-600 text-white" : "bg-slate-700 text-amber-400 hover:bg-slate-600"}`}>
                訂閱中心
              </button>
            )}
          </div>

          {activeTab === "join" && (
            <div className="space-y-6">
              {/* Registration form */}
              <div className="bg-slate-900/50 p-6 rounded-lg border border-amber-500/30">
                <h2 className="text-2xl font-semibold text-amber-400 mb-6">會員資料</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">姓名 *</Label>
                    <Input type="text" placeholder="請輸入姓名" value={joinForm.name} onChange={(e) => handleJoinChange("name", e.target.value)} className="bg-slate-800 border-amber-500/30 text-white" />
                  </div>
                  <div>
                    <Label className="text-white">出生年月日 *</Label>
                    <Input type="text" placeholder="請輸入數字 (YYYYMMDD)" value={joinForm.birthday} onChange={(e) => handleJoinChange("birthday", e.target.value)} className="bg-slate-800 border-amber-500/30 text-white" />
                  </div>
                  <div>
                    <Label className="text-white">手機號碼 *</Label>
                    <Input type="tel" placeholder="請輸入手機號碼" value={joinForm.phone} onChange={(e) => handleJoinChange("phone", e.target.value)} className="bg-slate-800 border-amber-500/30 text-white" />
                  </div>
                  <div>
                    <Label className="text-white">LINE ID *</Label>
                    <Input type="text" placeholder="請輸入 LINE ID" value={joinForm.lineId} onChange={(e) => handleJoinChange("lineId", e.target.value)} className="bg-slate-800 border-amber-500/30 text-white" />
                  </div>
                  <div>
                    <Label className="text-white">我的生日願望</Label>
                    <Input type="text" placeholder="寫下您的生日願望" value={joinForm.birthdayWish} onChange={(e) => handleJoinChange("birthdayWish", e.target.value)} className="bg-slate-800 border-amber-500/30 text-white" />
                  </div>

                  <Button onClick={handleJoinSubmit} disabled={registerMutation.isPending}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 mt-6 disabled:opacity-50">
                    {registerMutation.isPending ? "註冊中..." : "完成註冊"}
                  </Button>
                </div>
              </div>

              {/* BUG 15: Show full member info after registration */}
              {registeredMember && !lookedUpMember && (
                <div className="bg-slate-900/50 p-6 rounded-lg border border-green-500/30">
                  <div className="bg-green-900/30 border border-green-500/30 p-4 rounded mb-4">
                    <p className="text-green-400 font-semibold">✓ 會員註冊成功！</p>
                  </div>
                  <h2 className="text-xl font-semibold text-amber-400 mb-4">完整會員資訊</h2>
                  {renderFullMemberInfo()}
                </div>
              )}

              {/* 既有姓名＋電話會員查詢（登入會員） */}
              <div className="bg-slate-900/50 p-6 rounded-lg border border-amber-500/30">
                <h2 className="text-xl font-semibold text-amber-400 mb-3">登入會員</h2>
                <p className="mb-4 text-sm leading-relaxed text-slate-200">登入會員帳號，隨時掌握您的活動進度<br />審核通過、席位保留、邀請碼等重要通知<br />將直接顯示在「我的活動」</p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-white">姓名</Label>
                    <Input type="text" placeholder="請輸入姓名" value={lookupForm.name}
                      onChange={(e) => setLookupForm(p => ({ ...p, name: e.target.value }))}
                      className="bg-slate-800 border-amber-500/30 text-white" />
                  </div>
                  <div>
                    <Label className="text-white">手機號碼</Label>
                    <Input type="tel" placeholder="請輸入手機號碼" value={lookupForm.phone}
                      onChange={(e) => setLookupForm(p => ({ ...p, phone: e.target.value }))}
                      className="bg-slate-800 border-amber-500/30 text-white" />
                  </div>
                  <Button onClick={handleLookup} className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                    查詢
                  </Button>
                </div>

                {/* BUG 15: Show full member info after lookup */}
                {lookedUpMember && renderFullMemberInfo()}
                {lookupParams && (lookupResults as any[]).length === 0 && (
                  <p className="text-gray-400 text-sm mt-4 text-center">查無此會員，請確認姓名和手機號碼</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "subscribe" && subscriptionVisible && (
            <div className="bg-slate-900/50 p-6 rounded-lg border border-amber-500/30">
              <h2 className="text-2xl font-semibold text-amber-400 mb-6">訂閱中心</h2>
              <div className="space-y-6">
                {premiumPlanVisible && (
                  <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
                    <h3 className="text-amber-400 font-semibold mb-3">高級會員方案</h3>
                    <p className="text-white mb-2">月費：NT${settings?.premiumPrice ?? 600}</p>
                    <p className="text-gray-300 text-sm mb-4">享受以下權益：</p>
                    <ul className="text-gray-300 text-sm space-y-1 mb-4">
                      <li>• 享來店用餐搶先預訂資格</li>
                      <li>• 用餐五折優惠</li>
                      <li>• 更多會員權益將依品牌公告陸續新增</li>
                    </ul>
                  </div>
                )}

                {newcomerPlanVisible && (
                  <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
                    <h3 className="text-amber-400 font-semibold mb-3">新人優惠</h3>
                    <p className="text-white mb-2">首月優惠：NT${settings?.newcomerPrice ?? 300}（50% off）</p>
                    <p className="text-white">季費：NT${settings?.quarterlyPrice ?? 1300}（3個月）</p>
                  </div>
                )}

                {memberInfo && memberInfo.id && (
                  <>
                    <div className="bg-slate-800/50 p-4 rounded border border-amber-500/20">
                      <h3 className="text-amber-400 font-semibold mb-3">訂閱狀態</h3>
                      <div className="space-y-2 text-white">
                        <p><span className="text-gray-400">訂閱日期：</span>{premiumStartDate !== "無" ? new Date(premiumStartDate).toLocaleDateString("zh-TW") : "無"}</p>
                        <p><span className="text-gray-400">到期日期：</span>{premiumEndDate !== "無" ? new Date(premiumEndDate).toLocaleDateString("zh-TW") : "無"}</p>
                        <p><span className="text-gray-400">自動續訂：</span>{premiumStatus === "subscribed" ? "開啟" : "關閉"}</p>
                      </div>
                    </div>

                    <Button onClick={handleSubscribe} disabled={memberUpdateMutation.isPending}
                      className={`w-full font-semibold py-3 ${premiumStatus === "none" ? "bg-amber-600 hover:bg-amber-700" : "bg-red-600 hover:bg-red-700"} text-white`}>
                      {memberUpdateMutation.isPending ? "處理中..." : premiumStatus === "none" ? "立即訂閱" : "取消訂閱"}
                    </Button>
                  </>
                )}

                {(!memberInfo || !memberInfo.id) && (
                  <div className="space-y-3">
                    <p className="text-gray-400 text-sm text-center">請先在「加入會員」頁面查詢您的會員資料</p>
                    <Button onClick={() => setActiveTab("join")} className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                      前往查詢
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "subscribe" && !subscriptionVisible && (
            <div className="bg-slate-900/50 p-6 rounded-lg border border-amber-500/30 text-center">
              <p className="text-gray-400">訂閱中心目前已關閉</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
