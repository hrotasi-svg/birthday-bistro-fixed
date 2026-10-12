import { describe, expect, it } from "vitest";
import {
  applyCoinVideoMatte,
  shouldKeepCoinVideoPixel,
} from "../client/src/components/coinVideoMatte";

describe("第310批次：goldan影片黑框透明遮罩", () => {
  it("刪除影片近黑與壓縮暗中性背景，保留暖金邊緣與明亮金屬反光", () => {
    expect(shouldKeepCoinVideoPixel(0, 0, 0)).toBe(false);
    expect(shouldKeepCoinVideoPixel(40, 33, 28)).toBe(false);
    expect(shouldKeepCoinVideoPixel(47, 24, 10)).toBe(false);
    expect(shouldKeepCoinVideoPixel(85, 64, 22)).toBe(true);
    expect(shouldKeepCoinVideoPixel(250, 250, 250)).toBe(true);
  });

  it("以透明alpha移除黑框像素，而不繪製任何黑色覆蓋", () => {
    const pixels = new Uint8ClampedArray([
      40, 33, 28, 255,
      47, 24, 10, 255,
      85, 64, 22, 255,
      250, 250, 250, 255,
    ]);

    expect(applyCoinVideoMatte(pixels, 0)).toBe(false);
    expect([...pixels.slice(0, 4)]).toEqual([0, 0, 0, 0]);
    expect(applyCoinVideoMatte(pixels, 4)).toBe(false);
    expect([...pixels.slice(4, 8)]).toEqual([0, 0, 0, 0]);
    expect(applyCoinVideoMatte(pixels, 8)).toBe(true);
    expect(pixels[11]).toBeGreaterThan(0);
    expect(applyCoinVideoMatte(pixels, 12)).toBe(true);
    expect(pixels[15]).toBeGreaterThan(0);
  });
});
