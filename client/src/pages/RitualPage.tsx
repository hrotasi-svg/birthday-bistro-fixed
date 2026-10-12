import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getFrontBranchId } from "@/lib/branch";
import PinchZoomViewer from "@/components/PinchZoomViewer";
import ImageCarousel from "@/components/ImageCarousel";

const RITUALS = [
  { key: "wish", label: "心願招喚儀式", subtitle: "呼喚愛情・招喚財富" },
  { key: "korean", label: "韓式咒印儀式", subtitle: "黑墨潑灑・祝符纏繞" },
  { key: "chinese", label: "中式符印儀式", subtitle: "藝術祝符・華麗神祕" },
];

export default function RitualPage() {
  const [, navigate] = useLocation();
  const [selectedRitual, setSelectedRitual] = useState<string | null>(null);
  const [pinchZoomUrl, setPinchZoomUrl] = useState<string | null>(null);

  const { data: entityImgs = [] } = trpc.entityImage.list.useQuery({
    entityType: "ritual",
    branchId: getFrontBranchId(),
  });
  const ritualImageMap = (entityImgs as any[])
    .filter((img: any) => img.visible !== false)
    .reduce((acc: Record<string, string[]>, img: any) => {
      if (!acc[img.entityKey]) acc[img.entityKey] = [];
      acc[img.entityKey].push(img.imageUrl);
      return acc;
    }, {});

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* 粉色金屬漸層文字標題 */}
          <div className="text-center mb-12">
            <h1
              className="text-4xl font-bold mb-2"
              style={{
                background:
                  "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)",
                backgroundSize: "180% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              我們相信
            </h1>
            <p
              className="text-xl"
              style={{
                background:
                  "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)",
                backgroundSize: "180% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              祝福不只是說出口的話，而是能…
            </p>
          </div>

          {/* 3個儀式選項 */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {RITUALS.map(ritual => (
              <button
                key={ritual.key}
                onClick={() =>
                  setSelectedRitual(
                    selectedRitual === ritual.key ? null : ritual.key
                  )
                }
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  selectedRitual === ritual.key
                    ? "bg-pink-600 text-white"
                    : "bg-slate-700 text-pink-300 hover:bg-slate-600"
                }`}
              >
                {ritual.label}
                <span
                  className="block text-sm font-normal mt-1"
                  style={{ color: "#ff69b4" }}
                >
                  {ritual.subtitle}
                </span>
              </button>
            ))}
          </div>

          {/* 顯示選中儀式的圖片 */}
          {selectedRitual && (
            <div className="text-center">
              {ritualImageMap[selectedRitual] &&
              ritualImageMap[selectedRitual].length > 0 ? (
                <div className="max-w-2xl mx-auto">
                  <ImageCarousel
                    images={ritualImageMap[selectedRitual]}
                    alt={
                      RITUALS.find(r => r.key === selectedRitual)?.label ||
                      "儀式圖片"
                    }
                    imgClassName="max-w-full max-h-[60vh] rounded-lg hover:opacity-90 mx-auto"
                    onImageClick={url => setPinchZoomUrl(url)}
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    點擊圖片可放大查看
                  </p>
                </div>
              ) : (
                <p className="text-gray-400 py-12">此儀式尚無圖片</p>
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
        <PinchZoomViewer
          src={pinchZoomUrl}
          onClose={() => setPinchZoomUrl(null)}
        />
      )}
    </div>
  );
}
