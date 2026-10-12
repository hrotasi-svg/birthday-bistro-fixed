import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("第309批次：Safari舊頁與背景恢復同步", () => {
  it("在bfcache恢復或門店頁回到前景時，會比對無快取入口的目前雜湊資產", () => {
    const mainSource = read("client/src/main.tsx");
    const staticSource = read("server/_core/vite.ts");

    expect(mainSource).toContain('window.addEventListener("pageshow"');
    expect(mainSource).toContain("(event as PageTransitionEvent).persisted");
    expect(mainSource).toContain("window.location.reload()");
    expect(mainSource).toContain("refreshStoreSelectIfReleaseChanged");
    expect(mainSource).toContain('window.addEventListener("focus"');
    expect(mainSource).toContain('document.addEventListener("visibilitychange"');
    expect(mainSource).toContain('cache: "no-store"');
    expect(mainSource).toContain('"Cache-Control": "no-cache"');
    expect(mainSource).toContain("__release_probe");
    expect(mainSource).toContain(".filter(Boolean)");
    expect(mainSource).toContain("new URL(source, window.location.href)");
    expect(mainSource).toContain("catch {");
    expect(staticSource).toContain(
      '"Cache-Control", "no-store, no-cache, must-revalidate, max-age=0"'
    );
  });
});
