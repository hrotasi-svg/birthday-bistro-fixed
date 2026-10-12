import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getFrontBranchId } from "@/lib/branch";
import PinchZoomViewer from "@/components/PinchZoomViewer";
import ImageCarousel from "@/components/ImageCarousel";

// BUG 9: 11 fixed positions with descriptions
const INVITE_POSITIONS = [
  {
    key: "boss",
    label: "老闆／壽星",
    desc: "統籌全場、接待客人、負責決策與資源分配",
  },
  { key: "host", label: "主持", desc: "協助現場帶氣氛、協助拍攝" },
  { key: "photo", label: "攝影", desc: "負責拍攝花絮，記錄親友爆笑瞬間" },
  { key: "bar", label: "吧檯", desc: "飲品與酒水調製、杯具整理" },
  { key: "cashier", label: "收銀", desc: "操作點餐系統、營業現金保管與結算" },
  { key: "greeter", label: "領檯", desc: "迎賓、介紹菜單與活動亮點" },
  { key: "floor", label: "外場", desc: "餐具擺放、送餐、桌面、環境整潔" },
  { key: "ops", label: "營運助理", desc: "支援協助各個部門營業流程" },
  {
    key: "exec_chef",
    label: "行政主廚",
    desc: "與壽星溝通、管理內場、協助出餐",
  },
  { key: "chef", label: "主廚", desc: "製作沙拉、烹調主餐、廚具整潔" },
  { key: "sous_chef", label: "副主廚", desc: "準備湯品、甜點、餐具清洗" },
];

export default function InviteCodePage() {
  const [, navigate] = useLocation();
  const [inviteCode, setInviteCode] = useState("");
  const [showTasks, setShowTasks] = useState(false);
  const [activeTask, setActiveTask] = useState<
    "dept" | "video" | "revenue" | "special"
  >("dept");
  const [pinchZoomUrl, setPinchZoomUrl] = useState<string | null>(null);
  // 第13批次-2: 短影音任務影片預覽
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  const validateInviteCodeMutation = trpc.invite.validate.useMutation();
  const uploadVideoMut = trpc.shortVideo.uploadFile.useMutation();
  const deleteVideoMut = trpc.shortVideo.delete.useMutation();

  // DB-backed short videos for selected position & event
  const { data: shortVideos = [], refetch: refetchVideos } =
    trpc.shortVideo.list.useQuery(
      {
        position: selectedPosition ?? undefined,
        eventId: eventId ?? undefined,
        branchId: getFrontBranchId(),
      },
      { enabled: !!selectedPosition && !!eventId }
    );

  // DB-backed revenue for this event's booking (BUG 7: linked to invite code's booking)
  const { data: event } = trpc.event.getById.useQuery(
    { id: eventId || 0 },
    { enabled: !!eventId }
  );
  const { data: revenue } = trpc.revenue.get.useQuery(
    { bookingId: event?.bookingId ?? 0 },
    { enabled: !!event?.bookingId }
  );
  // BUG 12-14: Task card images and special task cards synced from backend
  const { data: taskCardImages = [] } = trpc.taskCardImage.list.useQuery(
    { branchId: getFrontBranchId() },
    { enabled: showTasks }
  );
  const { data: specialTaskCards = [] } = trpc.specialTaskCard.list.useQuery(
    { branchId: getFrontBranchId() },
    { enabled: showTasks }
  );

  const handleConfirm = async () => {
    if (!inviteCode) {
      toast.error("請輸入邀請碼");
      return;
    }
    try {
      const result = await validateInviteCodeMutation.mutateAsync({
        code: inviteCode,
      });
      if (result.eventId) {
        setEventId(result.eventId);
        setShowTasks(true);
        toast.success("邀請碼驗證成功！");
      }
    } catch {
      toast.error("邀請碼無效或已過期");
    }
  };

  const videoAngles = ["中景", "特寫", "廣角", "遠景", "自拍"];

  // BUG 7: Revenue items linked to the invite code's booking revenue
  const revenueItems = [
    {
      key: "mealRevenue",
      label: "餐點收入",
      value: (revenue as any)?.mealRevenue || "0",
    },
    {
      key: "drinkRevenue",
      label: "酒水收入",
      value: (revenue as any)?.drinkRevenue || "0",
    },
    {
      key: "totalRevenue",
      label: "當日營業額",
      value: (revenue as any)?.totalRevenue || "0",
    },
    {
      key: "cashback",
      label: "當日營收現金50%回饋",
      value: (revenue as any)?.cashback || "0",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 text-center pt-4">
            一起寫下最難忘的生日
          </h1>

          {!showTasks ? (
            <div className="space-y-6 bg-slate-900/50 p-6 rounded-lg border border-amber-500/30 max-w-md mx-auto">
              <div>
                <Label className="text-white">邀請碼</Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value)}
                    placeholder="請輸入邀請碼"
                    className="bg-slate-800 border-amber-500/30 text-white flex-1"
                  />
                  <Button
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setInviteCode(text);
                        toast.success("已貼上");
                      } catch {
                        toast.error("無法讀取剪貼簿");
                      }
                    }}
                    variant="outline"
                    className="text-amber-400 border-amber-400 shrink-0"
                  >
                    貼上
                  </Button>
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={handleConfirm}
                  disabled={validateInviteCodeMutation.isPending}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {validateInviteCodeMutation.isPending ? "驗證中..." : "確認"}
                </Button>
                <Button
                  onClick={() => navigate("/main")}
                  variant="outline"
                  className="flex-1 text-amber-400 border-amber-400"
                >
                  返回主功能
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex gap-4 mb-8 justify-center flex-wrap">
                <button
                  onClick={() => setActiveTask("dept")}
                  className={`px-6 py-3 rounded font-semibold transition ${activeTask === "dept" ? "bg-amber-600 text-white" : "bg-slate-700 text-amber-400 hover:bg-slate-600"}`}
                >
                  部門任務卡
                </button>
                <button
                  onClick={() => setActiveTask("special")}
                  className={`px-6 py-3 rounded font-semibold transition ${activeTask === "special" ? "bg-amber-600 text-white" : "bg-slate-700 text-amber-400 hover:bg-slate-600"}`}
                >
                  特殊任務卡
                </button>
                <button
                  onClick={() => setActiveTask("video")}
                  className={`px-6 py-3 rounded font-semibold transition ${activeTask === "video" ? "bg-amber-600 text-white" : "bg-slate-700 text-amber-400 hover:bg-slate-600"}`}
                >
                  短影音任務
                </button>
                <button
                  onClick={() => setActiveTask("revenue")}
                  className={`px-6 py-3 rounded font-semibold transition ${activeTask === "revenue" ? "bg-amber-600 text-white" : "bg-slate-700 text-amber-400 hover:bg-slate-600"}`}
                >
                  營業收入
                </button>
              </div>

              {/* BUG 10: Tab renamed to 部門任務卡 */}
              {/* BUG 12-14: Show synced images from backend */}
              {activeTask === "dept" && (
                <div className="space-y-4">
                  {INVITE_POSITIONS.map(pos => {
                    const posImgs = (taskCardImages as any[]).filter(
                      (img: any) => img.positionKey === pos.key && img.visible
                    );
                    return (
                      <div
                        key={pos.key}
                        className="bg-slate-900/50 p-4 rounded-lg border border-amber-500/30 text-white"
                      >
                        <h3 className="font-semibold text-amber-400 mb-2">
                          {pos.label}
                        </h3>
                        <p className="text-gray-300 text-sm mb-3">{pos.desc}</p>
                        {posImgs.length > 0 && (
                          <ImageCarousel
                            images={posImgs.map((img: any) => img.imageUrl)}
                            alt={pos.label}
                            onImageClick={url => setPinchZoomUrl(url)}
                            className="rounded"
                            imgClassName="w-full max-h-72 object-contain rounded hover:opacity-90"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* BUG 11: 特殊任務卡 synced from backend */}
              {activeTask === "special" && (
                <div className="space-y-4">
                  {(specialTaskCards as any[]).filter((c: any) => c.visible)
                    .length > 0 ? (
                    Object.entries(
                      (specialTaskCards as any[])
                        .filter((c: any) => c.visible)
                        .reduce((acc: Record<string, any[]>, card: any) => {
                          (acc[card.title] = acc[card.title] || []).push(card);
                          return acc;
                        }, {})
                    ).map(([title, cards]) => (
                      <div
                        key={title}
                        className="bg-slate-900/50 p-4 rounded-lg border border-amber-500/30 text-white"
                      >
                        <h3 className="font-semibold text-amber-400 mb-2">
                          {title}
                        </h3>
                        <ImageCarousel
                          images={(cards as any[]).map((c: any) => c.imageUrl)}
                          alt={title}
                          onImageClick={url => setPinchZoomUrl(url)}
                          className="rounded"
                          imgClassName="w-full max-h-72 object-contain rounded hover:opacity-90"
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-8">
                      尚無特殊任務卡
                    </p>
                  )}
                </div>
              )}

              {/* BUG 8: Fix video upload - pass eventId to uploadFile mutation */}
              {activeTask === "video" && (
                <div className="space-y-6">
                  <div className="text-white text-center mb-6">
                    <p className="text-lg">點選職位後出現分鏡上傳選項</p>
                    <p className="text-gray-400 text-sm mt-2">
                      影片上傳前，請重新命名（簡單描述任務內容，如：送餐）
                    </p>
                  </div>
                  <div className="space-y-3">
                    {INVITE_POSITIONS.map(pos => (
                      <div
                        key={pos.key}
                        className="bg-slate-900/50 rounded-lg border border-amber-500/30 overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setSelectedPosition(
                              selectedPosition === pos.label ? null : pos.label
                            )
                          }
                          className={`w-full p-4 text-left font-semibold transition ${selectedPosition === pos.label ? "bg-amber-600/20 text-amber-400" : "text-white hover:bg-slate-800/50"}`}
                        >
                          <span className="flex items-center justify-between">
                            <span>{pos.label}</span>
                            <span className="text-sm text-gray-400">
                              {selectedPosition === pos.label ? "▼" : "▶"}
                            </span>
                          </span>
                        </button>
                        {selectedPosition === pos.label && (
                          <div className="p-4 space-y-3 border-t border-amber-500/20">
                            {videoAngles.map(angle => {
                              const vid = (shortVideos as any[]).find(
                                (v: any) =>
                                  v.angle === angle && v.position === pos.label
                              );
                              const hasVideo = !!vid?.videoUrl;
                              return (
                                <div
                                  key={angle}
                                  className="flex items-center justify-between bg-slate-800/50 p-3 rounded"
                                >
                                  <span className="text-white text-sm">
                                    {angle}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {/* 第13批次-2: 上傳影片前面新增 預覽 選項 */}
                                    <button
                                      onClick={() => {
                                        if (hasVideo && vid?.videoUrl) {
                                          setPreviewVideoUrl(vid.videoUrl);
                                        } else {
                                          toast.info("尚未上傳影片，無法預覽");
                                        }
                                      }}
                                      className={`px-4 py-1 rounded text-sm ${hasVideo ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-600 text-gray-300 hover:bg-slate-500"}`}
                                    >
                                      預覽
                                    </button>
                                    <label className="px-4 py-1 rounded text-sm bg-amber-600 text-white hover:bg-amber-700 cursor-pointer">
                                      上傳影片
                                      <input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={async e => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          const reader = new FileReader();
                                          reader.onload = async () => {
                                            const base64 = (
                                              reader.result as string
                                            ).split(",")[1];
                                            try {
                                              await uploadVideoMut.mutateAsync({
                                                eventId: eventId ?? undefined,
                                                position: pos.label,
                                                angle,
                                                base64,
                                                contentType: file.type,
                                                filename: file.name,
                                              });
                                              toast.success(
                                                `${angle} 影片已上傳`
                                              );
                                              refetchVideos();
                                            } catch {
                                              toast.error("上傳失敗");
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }}
                                      />
                                    </label>
                                    {hasVideo && (
                                      <span className="text-green-400 text-xs">
                                        ✓ 已上傳
                                      </span>
                                    )}
                                    {hasVideo && (
                                      <button
                                        onClick={async () => {
                                          if (!vid?.id) return;
                                          if (!confirm("確定要刪除此影片？"))
                                            return;
                                          try {
                                            await deleteVideoMut.mutateAsync({
                                              id: vid.id,
                                            });
                                            toast.success("影片已刪除");
                                            refetchVideos();
                                          } catch {
                                            toast.error("刪除失敗");
                                          }
                                        }}
                                        className="px-2 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700"
                                      >
                                        刪除
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BUG 7: Revenue linked to invite code's booking */}
              {activeTask === "revenue" && (
                <div className="space-y-4">
                  {revenueItems.map((item, index) => (
                    <div
                      key={index}
                      className="bg-slate-900/50 p-4 rounded-lg border border-amber-500/30 text-white flex justify-between items-center"
                    >
                      <span>{item.label}</span>
                      <span className="text-amber-400 font-semibold">
                        NT${Number(item.value || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-center mt-8 text-white space-y-2">
                <p>生日只有1天，但回憶可以陪伴很久</p>
                <p className="text-pink-400 font-semibold">
                  限量免費剪輯，專屬回憶影片
                </p>
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  onClick={() => setShowTasks(false)}
                  variant="outline"
                  className="flex-1 text-amber-400 border-amber-400"
                >
                  返回
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  返回首頁
                </Button>
              </div>
            </div>
          )}
          {pinchZoomUrl && (
            <PinchZoomViewer
              src={pinchZoomUrl}
              onClose={() => setPinchZoomUrl(null)}
            />
          )}
          {/* 第13批次-2: 影片預覽彈窗 */}
          {previewVideoUrl && (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setPreviewVideoUrl(null)}
            >
              <div
                className="relative max-w-3xl w-full"
                onClick={e => e.stopPropagation()}
              >
                <video
                  src={previewVideoUrl}
                  controls
                  autoPlay
                  className="w-full max-h-[80vh] rounded-lg bg-black"
                />
                <button
                  onClick={() => setPreviewVideoUrl(null)}
                  className="absolute -top-10 right-0 text-white text-2xl px-3 py-1 hover:text-amber-400"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
