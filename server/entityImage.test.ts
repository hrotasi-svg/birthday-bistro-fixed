import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

function createCaller() {
  return appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: null,
  } as any);
}

describe("entityImage router（多圖上傳）", () => {
  it("list 回傳陣列（ritual 類型）", async () => {
    const caller = createCaller();
    const result = await caller.entityImage.list({ entityType: "ritual" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("upload 後可 list 到並可 delete", async () => {
    const caller = createCaller();
    // 1x1 transparent PNG
    const base64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    const uploaded = await caller.entityImage.upload({
      entityType: "test",
      entityKey: "vitest",
      base64,
      contentType: "image/png",
      filename: "test.png",
      sortOrder: 0,
    });
    expect(uploaded.url).toBeTruthy();

    const list = await caller.entityImage.list({ entityType: "test", entityKey: "vitest" });
    expect(list.length).toBeGreaterThan(0);
    const found = list.find((i) => i.imageUrl === uploaded.url);
    expect(found).toBeTruthy();

    // cleanup
    for (const img of list) {
      await caller.entityImage.delete({ id: img.id });
    }
    const after = await caller.entityImage.list({ entityType: "test", entityKey: "vitest" });
    expect(after.length).toBe(0);
  });
});
