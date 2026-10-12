import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * 第16批次-8: 後台體驗牆管理
 * 活動圖片管理：可上傳複數圖片，皆可顯示預覽及刪除
 * 活動影片管理：可上傳複數影片，皆可顯示預覽及刪除
 */
export default function ExperienceWallAdmin({ branchId }: { branchId: number }) {
  const { data: photos = [], refetch: refetchPhotos } = trpc.experienceWall.list.useQuery({ mediaType: "photo", branchId });
  const { data: videos = [], refetch: refetchVideos } = trpc.experienceWall.list.useQuery({ mediaType: "video", branchId });
  const uploadMut = trpc.experienceWall.upload.useMutation();
  const removeMut = trpc.experienceWall.remove.useMutation();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleUpload = async (files: FileList | null, mediaType: "photo" | "video") => {
    if (!files || files.length === 0) return;
    const setBusy = mediaType === "photo" ? setUploadingPhoto : setUploadingVideo;
    setBusy(true);
    let ok = 0, fail = 0;
    for (const file of Array.from(files)) {
      if (mediaType === "video" && file.size > 45 * 1024 * 1024) {
        toast.error(`${file.name} 超過 45MB 上限，請壓縮後再上傳`);
        fail++;
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        await uploadMut.mutateAsync({ mediaType, base64, contentType: file.type || (mediaType === "photo" ? "image/jpeg" : "video/mp4"), filename: file.name, branchId });
        ok++;
      } catch {
        fail++;
      }
    }
    setBusy(false);
    if (ok > 0) toast.success(`成功上傳 ${ok} 個檔案`);
    if (fail > 0) toast.error(`${fail} 個檔案上傳失敗`);
    if (mediaType === "photo") refetchPhotos(); else refetchVideos();
  };

  const handleDelete = async (id: number, mediaType: "photo" | "video") => {
    if (!confirm("確定要刪除嗎？")) return;
    try {
      await removeMut.mutateAsync({ id });
      toast.success("已刪除");
      if (mediaType === "photo") refetchPhotos(); else refetchVideos();
    } catch { toast.error("刪除失敗"); }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-amber-400 mb-2">體驗牆</h2>
      <p className="text-gray-300 text-sm">管理前台「真實體驗牆」的活動照片與慶生影片（上傳後即時同步前台顯示）</p>

      {/* 活動圖片管理 */}
      <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-amber-400 font-semibold">活動圖片管理</h3>
          <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
            className="px-4 py-2 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 disabled:opacity-50">
            {uploadingPhoto ? "上傳中..." : "上傳圖片（可多選）"}
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { handleUpload(e.target.files, "photo"); e.target.value = ""; }} />
        </div>
        {(photos as any[]).length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">尚未上傳活動圖片</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(photos as any[]).map((p: any) => (
              <div key={p.id} className="relative group">
                <img src={p.url} alt="活動圖片" className="w-full h-32 object-cover rounded border border-amber-500/20 cursor-pointer" onClick={() => setPreviewImageUrl(p.url)} loading="lazy" />
                <button onClick={() => handleDelete(p.id, "photo")}
                  className="absolute top-1 right-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">刪除</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 活動影片管理 */}
      <div className="bg-slate-800/50 p-6 rounded border border-amber-500/30 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-amber-400 font-semibold">活動影片管理</h3>
          <button onClick={() => videoInputRef.current?.click()} disabled={uploadingVideo}
            className="px-4 py-2 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 disabled:opacity-50">
            {uploadingVideo ? "上傳中..." : "上傳影片（可多選）"}
          </button>
          <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden"
            onChange={(e) => { handleUpload(e.target.files, "video"); e.target.value = ""; }} />
        </div>
        <p className="text-gray-500 text-xs">單檔上限 45MB，支援 MP4/WebM/MOV</p>
        {(videos as any[]).length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">尚未上傳活動影片</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(videos as any[]).map((v: any) => (
              <div key={v.id} className="relative">
                <video src={v.url} preload="metadata" className="w-full h-36 object-cover rounded border border-amber-500/20 bg-black cursor-pointer" onClick={() => setPreviewVideoUrl(v.url)} />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setPreviewVideoUrl(v.url)}
                    className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">預覽</button>
                  <button onClick={() => handleDelete(v.id, "video")}
                    className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">刪除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 預覽 Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImageUrl(null)}>
          <img src={previewImageUrl} alt="預覽" className="max-w-full max-h-[85vh] rounded" />
        </div>
      )}
      {previewVideoUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewVideoUrl(null)}>
          <div className="bg-slate-900 rounded-lg p-4 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <video src={previewVideoUrl} controls autoPlay className="w-full max-h-[70vh] rounded" />
            <button onClick={() => setPreviewVideoUrl(null)} className="mt-3 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 w-full">關閉</button>
          </div>
        </div>
      )}
    </div>
  );
}
