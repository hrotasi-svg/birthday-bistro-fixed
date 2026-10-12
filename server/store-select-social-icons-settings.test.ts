import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const routerSource = fs.readFileSync(path.resolve(process.cwd(), "server/_core/systemRouter.ts"), "utf8");
const dashboardSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx"), "utf8");
const brandInfoSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/BrandInfoPage.tsx"), "utf8");

describe("store selection social icons settings", () => {
  it("defaults the new display setting to visible and permits explicit updates", () => {
    expect(routerSource).toContain('storeSelectSocialIconsVisible: "true"');
    expect(routerSource).toContain("storeSelectSocialIconsVisible: z.boolean().optional()");
  });

  it("exposes the visibility control under the banner playback management section", () => {
    expect(dashboardSource).toContain("門店社群圖標：");
    expect(dashboardSource).toContain("門店社群圖標顯示設定已更新");
    expect(dashboardSource).toContain("storeSelectSocialIconsVisible");
  });

  it("reuses the uploaded icon set in the about-us contact section without changing its links", () => {
    expect(brandInfoSource).toContain('/manus-storage/line-social-icon_3b092264.png');
    expect(brandInfoSource).toContain('/manus-storage/instagram-social-icon_68b4650c.png');
    expect(brandInfoSource).toContain('/manus-storage/tiktok-social-icon_19c48f3f.png');
    expect(brandInfoSource).toContain('/manus-storage/facebook-social-icon_421b6ea5.png');
    expect(brandInfoSource).toContain("https://line.me/R/ti/p/@426jaurn");
    expect(brandInfoSource).toContain("https://www.facebook.com/tankabinggui");
    expect(brandInfoSource).toContain('className="flex gap-4 items-center"');
  });
});
