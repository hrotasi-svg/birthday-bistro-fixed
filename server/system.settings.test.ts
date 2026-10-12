import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return { ctx };
}

function createAdminContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      phone: null,
      birthday: null,
      gender: null,
      job: null,
      skills: null,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return { ctx };
}

describe("system.settings", () => {
  it("get returns settings with expected shape", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.system.settings.get();
    expect(result).toMatchObject({
      adminUsername: expect.any(String),
      leaderboardVisible: expect.any(Boolean),
      subscriptionVisible: expect.any(Boolean),
      revenueVisible: expect.any(Boolean),
      blackGoldEffect: expect.any(Boolean),
      storeSelectFlameEffect: expect.any(Boolean),
      storeSelectFlameColor: expect.any(String),
      storeSelectSocialIconsVisible: expect.any(Boolean),
    });
  });

  it("update succeeds for admin and restores original", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // First get current values
    const publicCaller = appRouter.createCaller(createPublicContext().ctx);
    const before = await publicCaller.system.settings.get();
    // Test update
    const result = await caller.system.settings.update({
      adminUsername: "newadmin",
      leaderboardVisible: false,
    });
    expect(result).toEqual({ success: true });
    // Restore original values
    await caller.system.settings.update({
      adminUsername: before.adminUsername,
      leaderboardVisible: before.leaderboardVisible,
    });
  });

  it("persists the homepage black-gold effect independently from parallax", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const publicCaller = appRouter.createCaller(createPublicContext().ctx);
    const before = await publicCaller.system.settings.get();

    await caller.system.settings.update({ blackGoldEffect: !before.blackGoldEffect });
    const changed = await publicCaller.system.settings.get();
    expect(changed.blackGoldEffect).toBe(!before.blackGoldEffect);
    expect(changed.parallaxEnabled).toBe(before.parallaxEnabled);

    await caller.system.settings.update({ blackGoldEffect: before.blackGoldEffect });
  });

  it("persists the store-select flame effect visibility setting", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const publicCaller = appRouter.createCaller(createPublicContext().ctx);
    const before = await publicCaller.system.settings.get({ branchId: 1 });

    await caller.system.settings.update({ branchId: 1, storeSelectFlameEffect: !before.storeSelectFlameEffect });
    const changed = await publicCaller.system.settings.get({ branchId: 1 });
    expect(changed.storeSelectFlameEffect).toBe(!before.storeSelectFlameEffect);

    await caller.system.settings.update({ branchId: 1, storeSelectFlameEffect: before.storeSelectFlameEffect });
  });

  it("persists store-select social icon visibility for the frontend", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const publicCaller = appRouter.createCaller(createPublicContext().ctx);
    const before = await publicCaller.system.settings.get({ branchId: 1 });

    await caller.system.settings.update({ branchId: 1, storeSelectSocialIconsVisible: !before.storeSelectSocialIconsVisible });
    const changed = await publicCaller.system.settings.get({ branchId: 1 });
    expect(changed.storeSelectSocialIconsVisible).toBe(!before.storeSelectSocialIconsVisible);

    await caller.system.settings.update({ branchId: 1, storeSelectSocialIconsVisible: before.storeSelectSocialIconsVisible });
  });

  it("persists every requested store-select flame color choice for the frontend", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const publicCaller = appRouter.createCaller(createPublicContext().ctx);
    const before = await publicCaller.system.settings.get({ branchId: 1 });

    for (const color of ["pink", "blue", "cyan", "purple", "rainbow"] as const) {
      await caller.system.settings.update({ branchId: 1, storeSelectFlameColor: color });
      const changed = await publicCaller.system.settings.get({ branchId: 1 });
      expect(changed.storeSelectFlameColor).toBe(color);
    }

    await caller.system.settings.update({ branchId: 1, storeSelectFlameColor: before.storeSelectFlameColor });
  });

  it("persists booking calendar and SOP visibility for the frontend", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const publicCaller = appRouter.createCaller(createPublicContext().ctx);
    const before = await publicCaller.system.settings.get();

    await caller.system.settings.update({ bookingCalendarVisible: false, sopVisible: false });
    const hidden = await publicCaller.system.settings.get();
    expect(hidden.bookingCalendarVisible).toBe(false);
    expect(hidden.sopVisible).toBe(false);

    await caller.system.settings.update({
      bookingCalendarVisible: before.bookingCalendarVisible,
      sopVisible: before.sopVisible,
    });
  });
});
