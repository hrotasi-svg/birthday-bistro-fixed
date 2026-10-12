import { useLocation } from "wouter";

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "一、適用範圍",
    items: ["本隱私權政策適用於壽星餐酒館網站、Android App、iOS App，以及未來相關服務。"],
  },
  {
    title: "二、蒐集的資料",
    items: [
      "當您使用本服務時，我們可能蒐集以下資料：",
      "姓名、出生年月日、聯絡電話、LINE ID、會員編號",
      "會員身份（一般會員、親友會員、壽星會員、高級會員）",
      "預約活動資料、邀請碼資訊、任務完成紀錄",
      "上傳之照片與影片、活動營業收入相關資料",
      "訂閱資訊（未來開放時）",
      "裝置基本資訊（如裝置型號、作業系統版本等）",
    ],
  },
  {
    title: "三、資料使用目的",
    items: [
      "蒐集您的資料主要用於：",
      "建立會員帳號、活動預約與管理、身分驗證、邀請碼管理",
      "活動通知、任務管理、會員服務、客戶服務",
      "影片剪輯服務、活動統計分析、系統安全維護、法令遵循",
    ],
  },
  {
    title: "四、影片與照片",
    items: [
      "您上傳之影片及照片僅供：",
      "活動紀錄、任務確認、專屬回憶影片剪輯、品牌營運管理",
      "除依法令規定或經您同意外，不會任意公開或提供給第三人。",
    ],
  },
  {
    title: "五、資料保存",
    items: [
      "您的資料將保存於本品牌管理系統。",
      "於法令允許範圍內，我們將依營運需求保存必要資料，並採取合理安全措施避免未經授權存取。",
    ],
  },
  {
    title: "六、資料分享",
    items: [
      "本品牌不會販售、出租或任意提供您的個人資料予第三人。",
      "但於下列情況除外：",
      "經您同意。",
      "法律規定或政府機關依法要求。",
      "為維護本品牌或使用者合法權益所必要。",
    ],
  },
  {
    title: "七、會員權利",
    items: [
      "您可依法行使下列權利：",
      "查詢個人資料。",
      "更正個人資料。",
      "更新會員資訊。",
      "申請刪除帳號（依法需保存之資料除外）。",
      "洽詢資料使用情形。",
    ],
  },
  {
    title: "八、資料安全",
    items: [
      "本品牌將採取合理的技術及管理措施，保護您的個人資料，避免遺失、竄改、未經授權存取或洩漏。",
    ],
  },
  {
    title: "九、兒童使用",
    items: [
      "未成年人使用本服務，建議由法定代理人閱讀本政策並協助確認相關權益。",
    ],
  },
  {
    title: "十、政策修訂",
    items: [
      "本品牌保留修改本隱私權政策之權利。",
      "更新後將公告於官方網站或 App，並自公告日起生效。",
    ],
  },
  {
    title: "十一、聯絡我們",
    items: [
      "品牌：碳咖冰櫃創意餐飲",
      "品牌名稱：壽星餐酒館",
      "電話：0903-314-055",
      "地址：高雄市鳳山區新富路 335 號",
      "若您對本隱私權政策或個人資料處理有任何疑問，歡迎與我們聯繫，我們將儘速協助處理。",
    ],
  },
];

export default function PrivacyPolicyPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-3xl font-bold text-center mb-2"
            style={{
              background: "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)",
              backgroundSize: "180% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            隱私權政策
          </h1>
          <p className="text-gray-400 text-center text-sm mb-8">最後更新日期：2026 年 7 月 19 日</p>

          <div className="space-y-6 bg-slate-900/60 rounded-2xl p-6 md:p-8">
            <p className="text-white leading-relaxed">
              歡迎您使用「壽星餐酒館」（以下簡稱「本服務」）。本服務由碳咖冰櫃創意餐飲（以下簡稱「本品牌」）提供。
            </p>
            <p className="text-white leading-relaxed">
              本品牌非常重視您的個人資料與隱私權，為保障您的權益，特訂定本隱私權政策，說明本服務如何蒐集、使用、保存及保護您的個人資料。
            </p>
            {SECTIONS.map((sec) => (
              <div key={sec.title}>
                <h2 className="text-xl font-bold text-amber-400 mb-3">{sec.title}</h2>
                <div className="text-white space-y-1.5 leading-relaxed">
                  {sec.items.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/more")}
              className="text-amber-400 border border-amber-400 rounded-lg px-6 py-3 hover:bg-amber-500/10 transition-colors"
            >
              ← 返回更多
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
