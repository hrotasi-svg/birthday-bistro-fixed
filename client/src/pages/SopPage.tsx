import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getFrontBranchId } from "@/lib/branch";
import PinchZoomViewer from "@/components/PinchZoomViewer";
import ImageCarousel from "@/components/ImageCarousel";

// 第13批次-12: 我的SOP（前台）— 與後台【我的SOP管理】同步資料（entityImages, entityType="sop"）
export const SOP_CATEGORIES = [
  {
    id: "time",
    label: "A. 時間流程",
    subs: [
      { key: "day", label: "日間場" },
      { key: "night", label: "晚間場" },
    ],
  },
  {
    id: "food",
    label: "B. 餐酒",
    subs: [
      { key: "meal", label: "餐點" },
      { key: "cocktail", label: "調酒" },
    ],
  },
  {
    id: "ritual",
    label: "C. 儀式活動",
    subs: [
      { key: "birthday", label: "慶生儀式" },
      { key: "surprise", label: "驚喜典禮" },
      { key: "handover", label: "交接儀式" },
      { key: "award", label: "營業王頒獎" },
    ],
  },
  {
    id: "special",
    label: "D. 特殊任務",
    subs: [
      { key: "game", label: "特殊遊戲" },
      { key: "event", label: "特殊事件" },
    ],
  },
];

export default function SopPage() {
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [pinchZoomUrl, setPinchZoomUrl] = useState<string | null>(null);

  const { data: sopImages = [] } = trpc.entityImage.list.useQuery(
    { entityType: "sop", branchId: getFrontBranchId() },
    { refetchOnWindowFocus: true }
  );

  const currentCategory = activeCategory ? SOP_CATEGORIES.find((c) => c.id === activeCategory) : null;
  const currentImages = activeSub
    ? (sopImages as any[]).filter((img: any) => img.entityKey === activeSub).map((img: any) => img.imageUrl)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* 標題：粉金漸層 */}
          <h1
            className="text-4xl md:text-5xl font-bold text-center mb-12"
            style={{
              background: "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)",
              backgroundSize: "180% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            我的SOP
          </h1>

          {/* 4大分類 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            {SOP_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(activeCategory === cat.id ? null : cat.id);
                  setActiveSub(null);
                }}
                className={`border-2 rounded-xl py-6 px-3 text-center font-bold transition-all duration-200 ${
                  activeCategory === cat.id
                    ? "border-amber-500 bg-amber-600/20 text-amber-300"
                    : "border-slate-600 bg-slate-900/80 text-white hover:border-amber-500 hover:bg-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 子分類 */}
          {currentCategory && (
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {currentCategory.subs.map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => setActiveSub(activeSub === sub.key ? null : sub.key)}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    activeSub === sub.key
                      ? "bg-pink-600 text-white shadow-md"
                      : "bg-slate-700 text-amber-300 hover:bg-slate-600"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {/* 顯示圖片（後台上傳，前後台即時同步） */}
          {activeSub && (
            <div className="text-center">
              {currentImages.length > 0 ? (
                <div className="max-w-2xl mx-auto">
                  <ImageCarousel
                    images={currentImages}
                    alt={currentCategory?.subs.find((s) => s.key === activeSub)?.label || "SOP圖片"}
                    imgClassName="max-w-full max-h-[60vh] rounded-lg hover:opacity-90 mx-auto"
                    onImageClick={(url: string) => setPinchZoomUrl(url)}
                  />
                  <p className="text-gray-400 text-sm mt-2">點擊圖片可放大查看</p>
                </div>
              ) : (
                <p className="text-gray-400 py-12">尚未設定圖片</p>
              )}
            </div>
          )}

          {/* 返回鍵 */}
          <div className="text-center mt-12">
            <button
              onClick={() => navigate("/main")}
              className="text-amber-400 border border-amber-400 rounded-lg px-6 py-3 hover:bg-amber-500/10 transition-colors"
            >
              ← 返回主功能
            </button>
          </div>
        </div>
      </div>

      {pinchZoomUrl && (
        <PinchZoomViewer src={pinchZoomUrl} onClose={() => setPinchZoomUrl(null)} />
      )}
    </div>
  );
}
