import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("第39批次：透明點擊區響應式比例與粉紅互動框", () => {
  it("主功能頁不再限制手機寬度，並持續以百分比保存透明點擊區", () => {
    const source = read("client/src/pages/MainFunctionPage.tsx");
    expect(source).toContain('<main className="w-full">');
    expect(source).not.toContain('max-w-[540px]');
    expect(source).toContain('left: "25%"');
    expect(source).toContain('top: "69.5%"');
    expect(source).toContain('style={{ left: area.left, top: area.top, width: area.width, height: area.height }}');
  });

  it("門店選擇頁使用共用視口參考框並不再限制手機寬度", () => {
    const source = read("client/src/pages/StoreSelectPage.tsx");
    expect(source).toContain('className="w-full"');
    expect(source).toContain("data-store-select-reduced-motion");
    expect(source).not.toContain('max-w-[540px]');
    expect(source).toContain('className="bistro-portrait-shell bg-black"');
  });

  it("黃色互動框由全域樣式覆蓋為粉紅色，不更改金屬文字材質", () => {
    const css = read("client/src/index.css");
    expect(css).toContain('第39批次：僅將黃色系互動框改為粉紅色');
    expect(css).toContain('background-color: #ec4899 !important');
    expect(css).toContain('background-image: linear-gradient(135deg, #f9a8d4 0%, #ec4899 48%, #be185d 100%) !important');
    expect(css).toContain('linear-gradient(105deg, #6f4d1a');
  });
});
