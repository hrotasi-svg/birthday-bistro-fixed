import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const readSource = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
const morePageSource = readSource("client/src/pages/MorePage.tsx");
const menuPageSource = readSource("client/src/pages/MenuItemsPage.tsx");
const bookFlipSource = readSource("client/src/components/BookFlipViewer.tsx");

describe("第49批次：返回粉色框與長方形菜單中線翻頁", () => {
  it("keeps the more-page return control as the only pink frame", () => {
    expect(morePageSource).toContain('border-2 border-pink-400 bg-slate-900/50');
    expect(morePageSource).toContain("text-pink-300");
    expect(morePageSource).toContain("← 返回主功能頁");
    expect(morePageSource).toContain('style={metallicFrameStyle}');
  });

  it("keeps the menu left page fixed while its right page flips from the centre spine", () => {
    expect(menuPageSource).toContain("rightPageFlip");
    expect(menuPageSource).not.toContain("via.placeholder.com");
    expect(menuPageSource).toContain("預設菜單畫面");
    expect(bookFlipSource).toContain("flipFromCenter = false");
    expect(bookFlipSource).toContain("rightPageFlip = false");
    expect(bookFlipSource).toContain('rightPageFlip || flipFromCenter ? "center center"');
    expect(bookFlipSource).toContain('clipPath: "inset(0 50% 0 0)"');
    expect(bookFlipSource).toContain('clipPath: "inset(0 0 0 50%)"');
    expect(bookFlipSource).toContain("menu-right-outgoing-half");
    expect(bookFlipSource).toContain("menu-right-incoming-half");
    expect(bookFlipSource).toContain('animation: "menu-right-outgoing-half 0.62s linear forwards"');
    expect(bookFlipSource).toContain('animation: "menu-right-incoming-half 0.62s linear forwards"');
    expect(bookFlipSource).toContain('rightPageFlip && flipping.direction === "next"');
    expect(bookFlipSource).toContain('src={images[flipping.to]}');
    expect(bookFlipSource).toContain('}, rightPageFlip ? 620 : 700);');
    expect(bookFlipSource).toContain('[flipping, count, index, rightPageFlip]');
    expect(bookFlipSource).toContain('menu-left-prev-outgoing-half');
    expect(bookFlipSource).toContain('menu-left-prev-incoming-half');
    expect(bookFlipSource).toContain('49.99% { transform: rotateY(90deg); opacity: 1; }');
    expect(bookFlipSource).toContain('100% { transform: rotateY(180deg); opacity: 1; }');
    expect(bookFlipSource).toContain('0.62s cubic-bezier(0.22, 1, 0.36, 1)');
    expect(bookFlipSource).toContain('flipping.direction === "next" ? "left center" : "right center"');
  });
});
