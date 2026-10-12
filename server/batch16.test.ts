import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

function caller() {
  return appRouter.createCaller({ user: null } as any);
}

describe("第16批次功能測試", () => {
  it("16-4/6 每月營業王 MVP 欄位可寫入並於前台 list 同步讀取", async () => {
    const c = caller();
    await c.monthlyKing.upsert({
      month: 12,
      name: "測試王",
      eventDate: "2099-12-25",
      revenue: "88888",
      mvp: "測試MVP",
    });
    const list = (await c.monthlyKing.list()) as any[];
    const entry = list.find((e) => e.name === "測試王" && e.mvp === "測試MVP");
    expect(entry).toBeTruthy();
    expect(entry.mvp).toBe("測試MVP");
    // 清理：覆寫回空（同月 upsert，不影響其他月份真實資料）
    await c.monthlyKing.upsert({ month: 12, name: "", eventDate: "", revenue: "", mvp: "" });
  });

  it("16-8 體驗牆：上傳活動照片/影片可 list 並刪除", async () => {
    const c = caller();
    const png1x1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const up = await c.experienceWall.upload({
      mediaType: "photo",
      base64: png1x1,
      contentType: "image/png",
      filename: "vitest-photo.png",
    });
    expect((up as any).url).toBeTruthy();
    const photos = (await c.experienceWall.list({ mediaType: "photo" })) as any[];
    const mine = photos.find((p) => p.url === (up as any).url);
    expect(mine).toBeTruthy();
    await c.experienceWall.remove({ id: mine.id });
    const photosAfter = (await c.experienceWall.list({ mediaType: "photo" })) as any[];
    expect(photosAfter.find((p) => p.id === mine.id)).toBeFalsy();
  });

  it("16-2 pageBackgrounds 設定可寫入讀取", async () => {
    const c = caller();
    const original = (await c.system.settings.get()) as any;
    try {
      await c.system.settings.update({ pageBackgrounds: JSON.stringify({ home: "https://example.com/bg.jpg" }) });
      const s = (await c.system.settings.get()) as any;
      const parsed = JSON.parse(s.pageBackgrounds || "{}");
      expect(parsed.home).toBe("https://example.com/bg.jpg");
    } finally {
      await c.system.settings.update({ pageBackgrounds: original.pageBackgrounds ?? "" });
    }
  });
});
