import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getFrontBranchId } from "@/lib/branch";
import PinchZoomViewer from "@/components/PinchZoomViewer";

/**
 * 第16批次-8: 真實體驗牆
 * 活動畫面 → Birthday Moments（真實活動照片、記錄每位壽星最難忘的精彩時刻）
 * 慶生影片 → Birthday Stories（每一段影片，都是專屬於壽星與好友的珍貴回憶）
 */
export default function ExperienceWallPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"photo" | "video">("photo");
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const { data: photos = [] } = trpc.experienceWall.list.useQuery({ mediaType: "photo", branchId: getFrontBranchId() });
  const { data: videos = [] } = trpc.experienceWall.list.useQuery({ mediaType: "video", branchId: getFrontBranchId() });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <button onClick={() => navigate("/main")}
              className="text-amber-400 border border-amber-400 rounded-lg px-4 py-2 hover:bg-amber-500/10 transition-colors text-sm">
              ← 返回主功能
            </button>
          </div>
          <h1 className="text-3xl font-bold text-white mb-8 text-center pt-4">真實體驗牆</h1>

          <div className="flex gap-4 mb-8 justify-center flex-wrap">
            <button onClick={() => setTab("photo")}
              className={`px-6 py-3 rounded font-semibold transition ${tab === "photo" ? "bg-amber-600 text-white" : "bg-slate-700 text-amber-400 hover:bg-slate-600"}`}>
              活動畫面
            </button>
            <button onClick={() => setTab("video")}
              className={`px-6 py-3 rounded font-semibold transition ${tab === "video" ? "bg-amber-600 text-white" : "bg-slate-700 text-amber-400 hover:bg-slate-600"}`}>
              慶生影片
            </button>
          </div>

          {tab === "photo" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold" style={{ background: "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)", backgroundSize: "180% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Birthday Moments</h2>
                <p className="text-gray-300">真實活動照片、記錄每位壽星最難忘的精彩時刻</p>
              </div>
              {(photos as any[]).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(photos as any[]).map((p: any) => (
                    <button key={p.id} onClick={() => setZoomUrl(p.url)} className="block w-full">
                      <img src={p.url} alt="活動照片" className="w-full h-40 md:h-48 object-cover rounded-lg border border-amber-500/20 hover:border-amber-500/60 transition" loading="lazy" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-10">目前尚無活動照片，敬請期待</p>
              )}
              <p className="text-gray-400 text-sm text-center">點選圖片可放大查看，手指縮放可移動頁面</p>
            </div>
          )}

          {tab === "video" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold" style={{ background: "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)", backgroundSize: "180% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Birthday Stories</h2>
                <p className="text-gray-300">每一段影片，都是專屬於壽星與好友的珍貴回憶</p>
              </div>
              {(videos as any[]).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(videos as any[]).map((v: any) => (
                    <video key={v.id} src={v.url} controls playsInline preload="metadata"
                      className="w-full rounded-lg border border-amber-500/20 bg-black" />
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-10">目前尚無慶生影片，敬請期待</p>
              )}
              <p className="text-gray-400 text-sm text-center">感受壽星餐酒館最真實的慶生時刻</p>
            </div>
          )}
        </div>
      </div>
      {zoomUrl && <PinchZoomViewer src={zoomUrl} onClose={() => setZoomUrl(null)} />}
    </div>
  );
}
