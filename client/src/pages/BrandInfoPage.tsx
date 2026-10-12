import { useLocation } from "wouter";
import { useEffect, useState } from "react";

type BrandTab = "brand" | "faq" | "contact" | "privacy" | "terms";

function getRequestedTab(): BrandTab | null {
  if (typeof window === "undefined") return null;
  const tab = new URLSearchParams(window.location.search).get("tab") ?? window.location.hash.slice(1);
  return ["brand", "faq", "contact", "privacy", "terms"].includes(tab) ? (tab as BrandTab) : null;
}

const faqGoldTextStyle = {
  background: "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)",
  backgroundSize: "180% 100%",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const faqItemClass = "rounded-xl border border-amber-500/20 bg-slate-950/25 px-4 py-4 shadow-sm";
const faqQuestionClass = "mb-2 font-semibold leading-6 tracking-wide text-amber-300";
const faqAnswerClass = "pl-7 -indent-7 leading-7 text-slate-100";
const SOCIAL_ICON_URLS = {
  line: "/manus-storage/line-social-icon_3b092264.png",
  instagram: "/manus-storage/instagram-social-icon_68b4650c.png",
  tiktok: "/manus-storage/tiktok-social-icon_19c48f3f.png",
  facebook: "/manus-storage/facebook-social-icon_421b6ea5.png",
};

export default function BrandInfoPage() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<BrandTab>(() => getRequestedTab() ?? "brand");

  useEffect(() => {
    const requestedTab = getRequestedTab();
    if (requestedTab) setActiveTab(requestedTab);
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-3xl font-bold text-center mb-6"
            style={{
              background: "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)",
              backgroundSize: "180% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            品牌資訊
          </h1>

          {/* Tab navigation */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {[
              { key: "brand", label: "關於碳咖冰櫃創意餐飲" },
              { key: "faq", label: "常見問題" },
              { key: "contact", label: "聯絡我們" },
              { key: "privacy", label: "隱私權政策" },
              { key: "terms", label: "使用者條款" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${activeTab === t.key ? "bg-amber-500 text-black font-bold" : "bg-slate-800 text-amber-300 border border-amber-500/30"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-6 bg-slate-900/60 rounded-2xl p-6 md:p-8">
            {activeTab === "brand" && (
              <div>
                <h2 className="text-xl font-bold text-amber-400 mb-4">關於碳咖冰櫃創意餐飲</h2>
                <div className="text-white leading-relaxed space-y-3">
                  <p className="font-bold text-amber-300">【開一天店，玩一天，賺一天】</p>
                  <p>您將擁有屬於自己的一日餐酒館</p>
                  <p>邀請最重要的親友，一起經營、一起挑戰、一起狂歡，在六個小時的沉浸式體驗中，留下一輩子難忘的回憶。</p>
                  <p>不是每一場生日，都會被記住。</p>
                  <p>但某些時刻，卻會成為一群人一輩子的回憶。</p>
                  <p>「壽星餐酒館」由碳咖冰櫃創意餐飲打造，不只是聚餐、慶生或派對，而是一場屬於壽星與親友的沉浸式慶生體驗。</p>
                  <p>在這裡，壽星不再只是坐在角落等待蛋糕的人，而是今晚真正的主角。</p>
                  <p>從燈光亮起的那一刻開始，你將化身一日餐酒館老闆，擁有屬於自己的舞台，帶領最重要的親友一起完成專屬任務、接受互動挑戰、享受驚喜活動，在六個小時的歡笑、微醺與掌聲中，創造獨一無二的故事。</p>
                  <p>我們相信，生日不應該只是年齡增加的一天，而是值得被所有人祝福、紀念與珍藏的重要時刻。</p>
                  <p>無論是第一次相識的朋友、多年未見的同學，還是一路陪伴的家人，都能在這裡找到屬於彼此的感動。</p>
                  <p className="text-amber-300 font-semibold">這不只是一間餐酒館。</p>
                  <p className="text-amber-300 font-semibold">這是一場專屬於壽星的奇幻舞台。</p>
                  <p>今晚，你不是客人。</p>
                  <p>你是老闆。</p>
                  <p>你是主角。</p>
                  <p className="text-amber-400 font-bold text-lg">歡迎來到——壽星餐酒館。</p>
                </div>
              </div>
            )}

            {activeTab === "faq" && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-white">常見問題 FAQ</h2>
                <div className="space-y-4 text-[15px] text-white sm:text-base">
                  <h3 className="pt-1 text-lg font-bold text-white">一、活動資格與參加方式</h3>
                  <div className={faqItemClass}><p className={faqQuestionClass}>Q：一定要十個人嗎？</p><p className={faqAnswerClass}>A：是的，因為活動中的部分遊戲與團隊任務，需要十人共同參與才能完整體驗。</p></div>
                  <div className={faqItemClass}><p className={faqQuestionClass}>Q：壽星如何參加活動？</p><p className={faqAnswerClass}>A：當月壽星請點選「開始預約」，填寫相關資料並送出申請。<br/>審核通過後，即可取得活動席位及限量<span className="whitespace-nowrap">邀請資格，歡迎邀請親朋好友一起參加。</span></p></div>
                  <div className={faqItemClass}><p className={faqQuestionClass}>Q：一般人也想參加怎麼辦？</p><p className={faqAnswerClass}>A：活動採「壽星邀請制」，只有獲得壽星邀請的親友才能參與活動。<br/>想加入體驗嗎？趕快聯繫身邊即將生日的壽星，成為他的專屬親友！</p></div>
                  <div className={faqItemClass}><p className={faqQuestionClass}>Q：沒有朋友怎麼辦？</p><p className={faqAnswerClass}>A：別擔心，可以先邀請家人、同事、同學或社群好友一起參與。<br/>壽星餐酒館希望帶給大家的不只是生日派對，更是一個拉近彼此距離、創造共同回憶的機會。</p></div>

                  <h3 className="pt-4 text-lg font-bold text-white">二、壽星專屬權益</h3>
                  <div className={faqItemClass}><p className={faqQuestionClass}>Q：壽星真的不用付費嗎？</p><p className={faqAnswerClass}>A：是的，壽星本人免費參加活動，親友才需使用者付費。<br/>因為是重要的人，所以一起創造的回憶，可以留很久。</p><div className="ml-7"><span className="block font-bold" style={faqGoldTextStyle}>傳統包場慶生・需花 4 萬</span><span className="block font-bold" style={faqGoldTextStyle}>現在不用花錢・還能賺錢</span><p className="mt-1 leading-7 text-slate-100">詳細活動規則及相關回饋，請參閱活動說明頁面。</p></div></div>
                  <div className={faqItemClass}><p className={faqQuestionClass}>Q：親友參與活動也有獎勵嗎？</p><p className={faqAnswerClass}>A：當然有！除了享有 6 小時免費餐酒體驗，完成活動中的遊戲任務，還有機會獨得當日營業額 50% 現金回饋。</p><div className="ml-7"><span className="block font-bold" style={faqGoldTextStyle}>今年生日，送一間餐酒館給壽星</span><span className="block font-bold" style={faqGoldTextStyle}>一起玩・一起瘋・一起賺錢！</span></div></div>

                  <h3 className="pt-4 text-lg font-bold text-white">三、餐酒與活動體驗</h3>
                  <div className={faqItemClass}><p className={`${faqQuestionClass} grid grid-cols-[1.75rem_minmax(0,1fr)]`}><span>Q：</span><span>完整活動已經免費吃喝 6 小時，那販售餐酒的成本需要另外支付嗎？</span></p><p className={faqAnswerClass}>A：不需要，既然是限量席位的活動，販售餐酒成本當然由店家吸收，讓壽星與親友團隊能夠盡情體驗一日餐酒館老闆的經營樂趣。</p></div>
                  <div className={faqItemClass}><p className={faqQuestionClass}>Q：需要自備蛋糕嗎？</p><p className={faqAnswerClass}>A：活動本身已提供輕奢生日蛋糕，如有特殊需求或客製化需求，歡迎提前來電詢問。</p></div>
                  <div className={faqItemClass}><p className={faqQuestionClass}>Q：可以自備酒類嗎？</p><p className={faqAnswerClass}>A：活動本身提供多樣酒款，如有特殊需求，歡迎提前與我們聯繫確認。</p></div>

                  <h3 className="pt-4 text-lg font-bold text-white">四、門店與活動規則</h3>
                  <div className={faqItemClass}><p className={faqQuestionClass}>Q：可以帶小朋友嗎？</p><p className={faqAnswerClass}>A：可以，但因門店提供酒類販售，請確實遵守「未滿十八歲禁止飲酒」之相關法律規定。</p></div>
                  <div className={faqItemClass}><p className={faqQuestionClass}>Q：門店休假時間為何？</p><p className={faqAnswerClass}>A：本店採預約制營運，平日不對外開放，實際活動時間請依官方公告及預約資訊為準。</p></div>

                  <h3 className="pt-4 text-lg font-bold text-white">五、預約、付款與退款</h3>
                  <div className={faqItemClass}><p className={faqQuestionClass}>Q：預約成功後，可以取消或退款嗎？</p><p className={faqAnswerClass}>A：付款前，請務必詳閱付款與退款規則；付款完成即視為同意相關條款。<br/>詳細退款辦法請參閱活動規範。</p></div>
                </div>
              </div>
            )}

            {activeTab === "contact" && (
              <div>
                <h2 className="text-xl font-bold text-amber-400 mb-4">聯絡我們</h2>
                <div className="text-white space-y-4">
                  <div>
                    <h3 className="font-bold text-amber-300 mb-1">營業時間</h3>
                    <p>日間場｜10:00－16:00</p>
                    <p>晚間場｜17:00－23:00</p>
                    <p className="text-gray-400 text-sm mt-1">※ 採預約制，平日不對外開放。</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-300 mb-1">聯絡方式</h3>
                    <p>電話：0903-314-055</p>
                    <p>地址：高雄市鳳山區新富路 335 號</p>
                    <p>地標：「鄰近衛武營國家藝術文化中心」</p>
                    <p className="mb-2">官方社群：</p>
                    <div className="flex gap-4 items-center">
                      <a href="https://line.me/R/ti/p/@426jaurn" target="_blank" rel="noopener noreferrer" title="LINE">
                        <img src={SOCIAL_ICON_URLS.line} alt="LINE" width="42" height="42" className="h-[42px] w-[42px] object-contain" />
                      </a>
                      <a href="https://www.instagram.com/tankabinggui_bistro?igsh=MWgwMjV1OWUwOGhvZw==" target="_blank" rel="noopener noreferrer" title="Instagram">
                        <img src={SOCIAL_ICON_URLS.instagram} alt="Instagram" width="42" height="42" className="h-[42px] w-[42px] object-contain" />
                      </a>
                      <a href="https://www.tiktok.com/@ajdoll0612?_r=1&_t=ZS-98dKVTKmnUi" target="_blank" rel="noopener noreferrer" title="TikTok">
                        <img src={SOCIAL_ICON_URLS.tiktok} alt="TikTok" width="42" height="42" className="h-[42px] w-[42px] object-contain" />
                      </a>
                      <a href="https://www.facebook.com/tankabinggui" target="_blank" rel="noopener noreferrer" title="Facebook">
                        <img src={SOCIAL_ICON_URLS.facebook} alt="Facebook" width="42" height="42" className="h-[42px] w-[42px] object-contain" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-300 mb-1">交通資訊</h3>
                    <div className="space-y-2">
                      <div><p className="font-semibold">捷運</p><p>搭乘高雄捷運橘線至「衛武營站」或「鳳山西站」，出站後轉乘計程車，約 5～10 分鐘即可抵達。</p></div>
                      <div><p className="font-semibold">公車</p><p>可搭乘 25、87、橘 12 等路線，於新富路沿線站牌下車後步行即可抵達。</p></div>
                      <div><p className="font-semibold">自行開車</p><p>Google 地圖搜尋「高雄市鳳山區新富路 335 號」即可導航抵達。</p></div>
                      <div><p className="font-semibold">計程車／叫車</p><p>可直接告知司機：「鳳山區新富路 335 號，衛武營旁沉浸式餐酒館」。</p></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-300 mb-1">貼心提醒</h3>
                    <p>✔ 未滿十八歲請勿飲酒。</p>
                    <p>✔ 飲酒後請勿開車。</p>
                    <p>✔ 建議優先搭乘大眾運輸或計程車前往。</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div>
                <h2 className="text-xl font-bold text-amber-400 mb-4">隱私權政策</h2>
                <div className="text-white leading-relaxed space-y-3">
                  <p>壽星餐酒館（以下簡稱「本平台」）非常重視您的隱私權。當您使用本平台服務時，我們將依據本隱私權政策蒐集、處理及利用您的個人資料。</p>
                  <p>我們蒐集的資料包括：姓名、電話、LINE ID、生日日期、預約相關資訊等，僅供預約審核、活動通知、客服聯繫及營運管理使用。</p>
                  <p>我們不會將您的個人資料提供給第三方，除非經您同意或法律另有規定。</p>
                  <p>您可隨時向我們請求查閱、更正或刪除您的個人資料。</p>
                  <p>如有任何隱私權相關問題，請透過「聯絡我們」與我們聯繫。</p>
                </div>
              </div>
            )}

            {activeTab === "terms" && (
              <div>
                <h2 className="text-xl font-bold text-amber-400 mb-4">壽星餐酒館網站使用者條款</h2>
                <div className="text-white leading-relaxed space-y-3">
                  <p>歡迎使用「壽星餐酒館」網站（以下簡稱「本平台」）。當您瀏覽、註冊、填寫資料、送出預約申請或使用本平台相關服務時，即表示您已閱讀、瞭解並同意遵守以下條款。</p>
                  <h3 className="font-bold text-amber-300 mt-4">一、服務內容</h3>
                  <p>本平台由碳咖冰櫃創意餐飲經營，提供壽星體驗活動資訊、預約申請、活動查詢及相關服務。</p>
                  <p>本平台所提供之活動，屬娛樂性及沉浸式體驗活動，非投資、保證獲利、雇傭或加盟招募行為。</p>
                  <h3 className="font-bold text-amber-300 mt-4">二、預約規則</h3>
                  <p>使用者送出預約申請後，不代表預約成功，實際結果仍須經本平台審核確認。</p>
                  <p>活動日期、場次及席位狀態，均以本平台最新公告及後台審核結果為準。</p>
                  <p>使用者應確保所填寫之姓名、電話、LINE ID 等資料真實且正確，如因資料錯誤導致無法聯繫，相關責任由使用者自行承擔。</p>
                  <p>本平台保留接受、拒絕、調整或取消預約申請之權利。</p>
                  <h3 className="font-bold text-amber-300 mt-4">三、付款、取消與退款</h3>
                  <p>活動費用、付款方式、取消規則及退款辦法，依《付款、取消及退款規範》辦理。</p>
                  <p>使用者完成付款後，即視為已閱讀並同意相關規範。</p>
                  <p>如因天災、政府命令、系統異常或其他不可抗力因素導致活動無法正常進行，本平台得延期、調整或依實際情況辦理退款。</p>
                  <h3 className="font-bold text-amber-300 mt-4">四、活動參與規範</h3>
                  <p>活動期間，所有參與者應遵守現場規則及工作人員指示。</p>
                  <p>未滿十八歲者禁止飲酒。</p>
                  <p>飲酒後請勿駕駛任何交通工具。</p>
                  <p>使用者不得從事違法、危險、妨害公共秩序或影響他人權益之行為。</p>
                  <p>如因故意或重大過失造成場地、設備或其他損害，應依法負擔相關責任。</p>
                  <h3 className="font-bold text-amber-300 mt-4">五、智慧財產權</h3>
                  <p>本平台之文字、圖片、活動內容、設計、流程及相關素材，均受智慧財產權保護。</p>
                  <p>未經本平台書面同意，任何人不得擅自重製、修改、散布、公開傳輸或作為商業用途。</p>
                  <h3 className="font-bold text-amber-300 mt-4">六、個人資料與隱私</h3>
                  <p>本平台得蒐集使用者提供之姓名、電話、LINE ID及其他必要資訊，僅供預約審核、活動通知、客服聯繫及營運管理使用。</p>
                  <p>相關個人資料之蒐集、處理及利用方式，依《隱私權政策》辦理。</p>
                  <h3 className="font-bold text-amber-300 mt-4">七、網站服務與系統維護</h3>
                  <p>本平台將盡力維持網站正常運作，但不保證網站服務永不中斷。</p>
                  <p>因系統維護、設備更新、網路異常或不可抗力因素造成之服務中斷、延遲或資料異常，本平台將盡力協助處理。</p>
                  <p>本平台保留修改、暫停或終止部分服務之權利。</p>
                  <h3 className="font-bold text-amber-300 mt-4">八、條款修改</h3>
                  <p>本平台保留隨時修改、更新或新增本條款內容之權利，修改後之內容將公告於網站，使用者繼續使用本平台，即視為同意修改後之條款。</p>
                  <h3 className="font-bold text-amber-300 mt-4">九、準據法與爭議處理</h3>
                  <p>如因本平台服務產生爭議，雙方應先以誠信原則協商處理；協商不成時，雙方合意以臺灣高雄地方法院為第一審管轄法院，並以中華民國法律為準。</p>
                </div>
              </div>
            )}
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
    </div>
  );
}
