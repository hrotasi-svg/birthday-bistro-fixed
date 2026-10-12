import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { getFrontBranchId } from "@/lib/branch";
import PinchZoomViewer from "@/components/PinchZoomViewer";
import ImageCarousel from "@/components/ImageCarousel";
import BookFlipViewer from "@/components/BookFlipViewer";

export default function MenuItemsPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"course" | "cocktail">("course");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // DB-backed menu items
  const { data: menuItems = [] } = trpc.menu.list.useQuery({ branchId: getFrontBranchId() });
  const { data: menuEntityImgs = [] } = trpc.entityImage.list.useQuery({ entityType: "menu", branchId: getFrontBranchId() });
  // 第15批次-9: 菜單翻書效果開關（由後台菜單管理控制，預設開啟）
  const { data: settings = {} as any } = trpc.system.settings.get.useQuery({ branchId: getFrontBranchId() });
  const bookFlipEnabled = (settings as any)?.bookFlipEffect !== false;

  const courseItem = (menuItems as any[]).find((m: any) => m.category === "course");
  const cocktailItem = (menuItems as any[]).find((m: any) => m.category === "cocktail");

  const getImagesFor = (item: any) => {
    if (!item) return [];
    const imgs = (menuEntityImgs as any[])
      .filter((img: any) => img.entityKey === String(item.id))
      .map((img: any) => img.imageUrl);
    if (imgs.length > 0) return imgs;
    if (item.imageUrl) return [item.imageUrl];
    return [];
  };

  const courseMenuData = {
    title: courseItem?.title || "無菜單料理套餐",
    description: courseItem?.description || "主廚精心設計的無菜單料理，不定時更新。",
    images: getImagesFor(courseItem),
  };

  const cocktailMenuData = {
    title: cocktailItem?.title || "特殊調酒",
    description: cocktailItem?.description || "調酒師特製的微醺系列調酒。",
    images: getImagesFor(cocktailItem),
  };

  const currentMenu = activeTab === "course" ? courseMenuData : cocktailMenuData;

  return (
    <>
      {fullscreenImage && (
        <PinchZoomViewer
          src={fullscreenImage}
          alt="菜單圖片"
          onClose={() => setFullscreenImage(null)}
          backLabel="返回精選菜單"
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <div className="px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8 text-center">精選菜單</h1>

            <div className="flex gap-4 mb-8 justify-center flex-wrap">
              <button onClick={() => setActiveTab("course")}
                className={`px-6 py-3 rounded font-semibold transition ${activeTab === "course" ? "bg-amber-600 text-white" : "bg-slate-700 text-amber-400 hover:bg-slate-600"}`}>
                {courseMenuData.title}
              </button>
              <button onClick={() => setActiveTab("cocktail")}
                className={`px-6 py-3 rounded font-semibold transition ${activeTab === "cocktail" ? "bg-amber-600 text-white" : "bg-slate-700 text-amber-400 hover:bg-slate-600"}`}>
                {cocktailMenuData.title}
              </button>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-lg border border-amber-500/30">
              <h2 className="text-2xl font-semibold text-amber-400 mb-2">{currentMenu.title}</h2>
              <p className="text-gray-300 mb-6">{currentMenu.description}</p>
              <div className="flex justify-center mb-6">
                <div className="w-full max-w-sm aspect-[3/4] bg-slate-800 rounded-lg overflow-hidden border border-amber-500/30 flex items-center justify-center">
                  {currentMenu.images.length === 0 ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-900 px-6 text-center">
                      <span className="text-3xl text-pink-300">▣</span>
                      <p className="font-semibold text-white">預設菜單畫面</p>
                      <p className="text-sm text-gray-300">此分店尚未上傳{currentMenu.title}圖片</p>
                    </div>
                  ) : bookFlipEnabled ? (
                    <BookFlipViewer
                      images={currentMenu.images}
                      alt={currentMenu.title}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-contain"
                      rightPageFlip
                      onImageClick={(url) => setFullscreenImage(url)}
                    />
                  ) : (
                    <ImageCarousel
                      images={currentMenu.images}
                      alt={currentMenu.title}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-contain"
                      onImageClick={(url) => setFullscreenImage(url)}
                    />
                  )}
                </div>
              </div>
              <p className="text-center text-amber-400 text-sm mb-4 cursor-pointer hover:text-amber-300">
                點擊圖片可放大查看
              手指縮放可移動頁面
             </p>
            </div>

            <div className="flex gap-4 mt-8">
              <Button onClick={() => navigate("/main")}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                返回主功能
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
