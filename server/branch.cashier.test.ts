import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

function caller() {
  return appRouter.createCaller({ user: null } as any);
}

describe("branch router（第13批次-15 分店管理）", () => {
  it("list 回傳陣列且包含預設分店 高雄市/鳳山區", async () => {
    const list = await caller().branch.list();
    expect(Array.isArray(list)).toBe(true);
    const norm = (s: string) => (s || "").replace(/[市縣區鄉鎮]/g, "");
    const def = (list as any[]).find((b) => norm(b.city) === "高雄" && norm(b.district) === "鳳山");
    expect(def).toBeTruthy();
    expect(def.username).toBe("ajdoll0612");
  });

  it("verifyLogin 四項驗證：正確通過、錯誤拒絕", async () => {
    const ok = await caller().branch.verifyLogin({ city: "高雄市", district: "鳳山區", username: "ajdoll0612", password: "542966" });
    expect(ok.success).toBe(true);
    const bad = await caller().branch.verifyLogin({ city: "台北市", district: "鳳山區", username: "ajdoll0612", password: "542966" });
    expect(bad.success).toBe(false);
  });

  it("add → update → delete 分店流程", async () => {
    await caller().branch.add({ city: "測試市", district: "測試區", username: "testuser", password: "testpass" });
    let list = (await caller().branch.list()) as any[];
    const added = list.find((b) => b.city === "測試市" && b.district === "測試區");
    expect(added).toBeTruthy();
    await caller().branch.update({ id: added.id, city: "測試市", district: "測試二區", username: "testuser", password: "testpass2" });
    list = (await caller().branch.list()) as any[];
    const updated = list.find((b) => b.id === added.id);
    expect(updated.district).toBe("測試二區");
    await caller().branch.delete({ id: added.id });
    list = (await caller().branch.list()) as any[];
    expect(list.find((b) => b.id === added.id)).toBeFalsy();
  });
});

describe("cashier router（第13批次-17 收銀台）", () => {
  it("addEntries → listByMonth → delete 流程", async () => {
    const c = caller();
    await c.cashier.addEntries({
      entries: [
        { entryDate: "2099-01-15", kind: "income", category: "plan", amount: 1000 },
        { entryDate: "2099-01-15", kind: "expense", category: "rent", amount: 300 },
      ],
    });
    const list = (await c.cashier.listByMonth({ year: 2099, month: 1 })) as any[];
    const income = list.find((e) => e.kind === "income" && e.category === "plan" && Number(e.amount) === 1000);
    const expense = list.find((e) => e.kind === "expense" && e.category === "rent" && Number(e.amount) === 300);
    expect(income).toBeTruthy();
    expect(expense).toBeTruthy();
    for (const e of list) {
      await c.cashier.delete({ id: e.id });
    }
    const after = (await c.cashier.listByMonth({ year: 2099, month: 1 })) as any[];
    expect(after.length).toBe(0);
  });
});
