import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getFrontBranchId } from "@/lib/branch";
import PinchZoomViewer from "@/components/PinchZoomViewer";
import ImageCarousel from "@/components/ImageCarousel";

const NPC_DESCRIPTIONS: Record<string, string> = {
  influencer: "與人氣創作者互動，留下專屬生日內容與難忘回憶",
  kol: "邀請各領域意見領袖，共同打造具有話題性的生日體驗",
  anchor: "讓專業主持與互動能力，為你的生日創造節目感",
  artist: "未來邀請表演者與明星級人物，打造夢幻生日體驗",
  band: "用現場音樂營造專屬於你的生日舞台",
  singer: "讓生日現場擁有專屬演出與感動時刻",
};

const NPC_CATEGORIES = [
  { id: "interactive", label: "互動NPC", types: [{ type: "influencer", prefix: "A", label: "網紅" }, { type: "kol", prefix: "B", label: "KOL" }, { type: "anchor", prefix: "C", label: "主播" }] },
  { id: "popular", label: "人氣NPC", types: [{ type: "artist", prefix: "D", label: "藝人" }, { type: "band", prefix: "E", label: "樂團" }, { type: "singer", prefix: "F", label: "歌手" }] },
];

type UpgradeView = "upgrade" | "bistro" | "style" | "lab" | "npc";

const goldTitle = "text-amber-300";
const optionButton = "rounded-xl border border-amber-500/30 bg-slate-900/80 px-6 py-4 text-lg font-semibold text-amber-300 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300";

export default function MyNpcPage() {
  const [, navigate] = useLocation();
  const { data: npcItems = [] } = trpc.npc.list.useQuery({ branchId: getFrontBranchId() }, { refetchOnWindowFocus: true });
  const { data: npcEntityImgs = [] } = trpc.entityImage.list.useQuery({ entityType: "npc", branchId: getFrontBranchId() });
  const [view, setView] = useState<UpgradeView>("upgrade");
  const [activeCategory, setActiveCategory] = useState<"interactive" | "popular" | null>(null);
  const [selectedNpcType, setSelectedNpcType] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const currentCategory = activeCategory ? NPC_CATEGORIES.find((category) => category.id === activeCategory) : null;
  const openOriginalNpc = () => setView("npc");
  const returnToUpgrade = () => setView("upgrade");

  const renderUpgrade = () => {
    if (view === "bistro") {
      return (
        <section className="space-y-8 text-center">
          <h1 className={`text-4xl font-bold ${goldTitle}`}>我的餐酒館</h1>
          <div className="mx-auto max-w-2xl space-y-3 text-lg leading-relaxed text-gray-200">
            <p className="font-semibold text-white">打造屬於你的專屬餐酒館</p>
            <p>開一間只存在 6 小時 的餐酒館</p>
            <p>自由決定餐廳風格、菜單與經營方式，加入自己的創意，體驗真正的老闆視角。</p>
            <p className={goldTitle}>店名 → Logo 名片 → 裝潢風格 → 特殊菜單 → 制服 → 宣傳 → 營業</p>
          </div>
          <div className="mx-auto grid max-w-xl gap-4 sm:grid-cols-2">
            <button type="button" className={optionButton} onClick={() => setView("style")}>老闆風格</button>
            <button type="button" className={optionButton} onClick={() => setView("lab")}>老闆實驗室</button>
          </div>
          <button type="button" className="text-amber-300 underline-offset-4 hover:underline" onClick={() => setView("upgrade")}>← 返回升級體驗</button>
        </section>
      );
    }

    if (view === "style") {
      const styles = [
        ["經營型", "降低成本・提高收益", "精打細算，腦中營銷創意停不了。"],
        ["社交型", "交友廣闊・熱情大方", "朋友越多，餐廳越熱鬧。"],
        ["料理型", "專注料理・提高評價", "讓客人記住你的味道。"],
        ["魅力型", "極具個性・獨領風騷", "你，就是餐廳最吸引人的存在。"],
      ];
      return (
        <section className="space-y-7 text-center">
          <h1 className={`text-4xl font-bold ${goldTitle}`}>老闆風格</h1>
          <div className="grid gap-4 sm:grid-cols-2">
            {styles.map(([name, trait, description]) => (
              <article key={name} className="rounded-2xl border border-amber-500/20 bg-slate-900/70 p-5 text-left">
                <h2 className={`text-2xl font-bold ${goldTitle}`}>{name}</h2>
                <p className="mt-2 font-semibold text-white">{trait}</p>
                <p className="mt-2 text-gray-300">{description}</p>
              </article>
            ))}
          </div>
          <button type="button" className="text-amber-300 underline-offset-4 hover:underline" onClick={() => setView("bistro")}>← 返回我的餐酒館</button>
        </section>
      );
    }

    if (view === "lab") {
      return (
        <section className="space-y-7 text-center">
          <h1 className={`text-4xl font-bold ${goldTitle}`}>老闆實驗室</h1>
          <div className="mx-auto max-w-2xl rounded-2xl border border-amber-500/20 bg-slate-900/70 p-6 text-lg leading-relaxed text-gray-200">
            <p>初次實驗當老闆，可能遇到不同的隨機營業實況：</p>
            <p className={`mt-5 font-semibold ${goldTitle}`}>網紅突然進店｜情侶求婚｜朋友吵架｜顧客不滿意｜酒客喝醉｜廚師失誤｜餐廳爆紅｜米其林挑戰｜神秘客人</p>
            <p className="mt-5">你的選擇，決定今晚老闆實驗如何發展。</p>
          </div>
          <button type="button" className="text-amber-300 underline-offset-4 hover:underline" onClick={() => setView("bistro")}>← 返回我的餐酒館</button>
        </section>
      );
    }

    return (
      <section className="space-y-8 text-center">
        <h1 className={`text-4xl font-bold ${goldTitle}`}>升級體驗</h1>
        <p className="text-lg text-gray-200">加入高級會員，搶先解鎖限定體驗</p>
        <div className="mx-auto grid max-w-xl gap-4 sm:grid-cols-2">
          <button type="button" className={optionButton} onClick={() => setView("bistro")}>我的餐酒館</button>
          <button type="button" className={optionButton} onClick={openOriginalNpc}>我的NPC</button>
        </div>
      </section>
    );
  };

  const renderOriginalNpc = () => (
    <section>
      <div className="text-center">
        <h1 className={`text-4xl font-bold ${goldTitle}`}>我的NPC｜打造專屬於你的生日故事</h1>
        <div className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">
          <p>未來，您可以邀請不同角色</p><p>一起參與生日，經營餐酒館</p><p>創造獨一無二的沉浸式體驗</p>
        </div>
      </div>
      <div className="mt-8 flex justify-center gap-4">
        {NPC_CATEGORIES.map((category) => (
          <button key={category.id} type="button" onClick={() => { setActiveCategory(category.id as "interactive" | "popular"); setSelectedNpcType(null); }} className={`${optionButton} ${activeCategory === category.id ? "bg-slate-800" : ""}`}>{category.label}</button>
        ))}
      </div>
      {currentCategory && <>
        <p className="mt-6 text-center text-amber-300">{activeCategory === "interactive" ? "增加現場互動與娛樂元素，讓生日不只是吃飯，而是一場沉浸式體驗。" : "解鎖更多生日可能，打造專屬於你的沉浸式體驗。"}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {currentCategory.types.map((npcType) => <button key={npcType.type} type="button" onClick={() => setSelectedNpcType(npcType.type)} className={`${optionButton} px-5 py-2 text-base ${selectedNpcType === npcType.type ? "bg-slate-800" : ""}`}>{npcType.prefix}. {npcType.label}</button>)}
        </div>
        {selectedNpcType && (() => {
          const npcType = currentCategory.types.find((item) => item.type === selectedNpcType);
          if (!npcType) return null;
          const item = (npcItems as any[]).find((npc: any) => npc.type === npcType.type);
          const images = (npcEntityImgs as any[]).filter((image: any) => image.entityKey === npcType.type).map((image: any) => image.imageUrl);
          if (images.length === 0 && item?.imageUrl) images.push(item.imageUrl);
          return <div className="mt-8 rounded-2xl border border-amber-500/20 bg-slate-900/80 p-6">
            <h2 className={`text-2xl font-bold ${goldTitle}`}>{npcType.prefix}. {npcType.label}</h2>
            <p className="mt-2 text-gray-300">{NPC_DESCRIPTIONS[npcType.type] || ""}</p>
            {images.length > 0 ? <div className="mx-auto mt-4 max-w-md"><ImageCarousel images={images} alt={npcType.label} imgClassName="max-h-64 max-w-full rounded-lg border border-amber-500/20 object-contain" onImageClick={setFullscreenImage} /></div> : <p className="mt-4 text-gray-500">尚未設定圖片</p>}
          </div>;
        })()}
      </>}
      <div className="mt-10 text-center"><button type="button" className="text-amber-300 underline-offset-4 hover:underline" onClick={returnToUpgrade}>← 返回升級體驗</button></div>
    </section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">
      <div className="px-6 py-12"><div className="mx-auto max-w-4xl">{view === "npc" ? renderOriginalNpc() : renderUpgrade()}<div className="mt-10 text-center"><button type="button" onClick={() => navigate("/main")} className="rounded-lg border border-amber-400 px-6 py-3 text-amber-300 hover:bg-slate-800">← 返回主功能</button></div></div></div>
      {fullscreenImage && <PinchZoomViewer src={fullscreenImage} alt="NPC" onClose={() => setFullscreenImage(null)} backLabel="返回" />}
    </div>
  );
}
