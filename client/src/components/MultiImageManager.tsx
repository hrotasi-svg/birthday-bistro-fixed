import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getAdminBranchId } from "@/lib/branch";

/**
 * 後台通用多圖管理元件（BUG 1: 後台可新增、刪除、預覽多張圖片）
 * entityType: "menu" | "npc" | "ritual" | 未來新增類型
 * entityKey: 對應實體的唯一鍵
 */
export default function MultiImageManager({
  entityType,
  entityKey,
  label = "圖片管理（可上傳多張）",
  showVisibilityToggle = false,
}: {
  entityType: string;
  entityKey: string;
  label?: string;
  showVisibilityToggle?: boolean;
}) {
  const branchId = getAdminBranchId();
  const { data: images, refetch } = trpc.entityImage.list.useQuery({ entityType, entityKey, branchId });
  const uploadMut = trpc.entityImage.upload.useMutation();
  const deleteMut = trpc.entityImage.delete.useMutation();
  const setVisibleMut = trpc.entityImage.setVisible.useMutation();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} 超過 5MB，已略過`);
        continue;
      }
      try {
        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const base64 = (reader.result as string).split(",")[1];
              await uploadMut.mutateAsync({
                entityType,
                entityKey,
                base64,
                contentType: file.type,
                filename: file.name,
                sortOrder: (images?.length || 0),
                branchId,
              });
              resolve();
            } catch (err) { reject(err); }
          };
          reader.onerror = () => reject(new Error("讀取失敗"));
          reader.readAsDataURL(file);
        });
      } catch {
        toast.error(`${file.name} 上傳失敗`);
      }
    }
    toast.success("圖片已上傳");
    refetch();
  };

  return (
    <div>
      <label className="block text-white text-sm mb-2">{label}</label>
      {/* 已上傳圖片預覽（含刪除） */}
      {images && images.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={img.imageUrl}
                alt="預覽"
                className={`w-24 h-24 object-cover rounded border border-amber-500/30 ${showVisibilityToggle && (img as any).visible === false ? "opacity-40" : ""}`}
              />
              <button
                onClick={async () => {
                  await deleteMut.mutateAsync({ id: img.id });
                  toast.success("圖片已刪除");
                  refetch();
                }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center hover:bg-red-700"
                aria-label="刪除圖片"
              >
                ✕
              </button>
              {showVisibilityToggle && (
                <button
                  onClick={async () => {
                    const next = (img as any).visible === false;
                    await setVisibleMut.mutateAsync({ id: img.id, visible: next });
                    toast.success(next ? "已設為顯示" : "已設為隱藏");
                    refetch();
                  }}
                  className={`absolute bottom-0 left-0 right-0 text-xs py-0.5 rounded-b text-white ${(img as any).visible === false ? "bg-slate-600 hover:bg-slate-500" : "bg-amber-600 hover:bg-amber-700"}`}
                >
                  {(img as any).visible === false ? "隱藏中" : "顯示中"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        className="w-full text-white text-sm"
      />
      <p className="text-gray-400 text-xs mt-1">可一次選擇多張圖片上傳，前台將以輪播顯示</p>
    </div>
  );
}
