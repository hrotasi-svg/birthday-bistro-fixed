import { describe, expect, it } from "vitest";
import { isDynamicTextOverrideSelector, PATH_TO_PAGE_ID } from "../client/src/lib/textOverrides";
import { isBranchVisible, resolveVisualEditorRenderBranchId } from "../client/src/lib/branch";
import { isVisualEditorRevisionFor } from "../client/src/lib/visualEditorRevision";

describe("visual editor public page identities", () => {
  it("maps every public feature route to a stable editor page identifier", () => {
    expect(PATH_TO_PAGE_ID["/"]).toBe("home");
    expect(PATH_TO_PAGE_ID["/admin"]).toBe("admin-settings");
    expect(PATH_TO_PAGE_ID["/store-select"]).toBe("store-select");
    expect(PATH_TO_PAGE_ID["/main"]).toBe("main");
    expect(PATH_TO_PAGE_ID["/booking"]).toBe("booking");
    expect(PATH_TO_PAGE_ID["/my-booking"]).toBe("my-booking");
    expect(PATH_TO_PAGE_ID["/menu"]).toBe("menu");
    expect(PATH_TO_PAGE_ID["/experience"]).toBe("experience");
    expect(PATH_TO_PAGE_ID["/booking-calendar"]).toBe("booking-calendar");
    expect(PATH_TO_PAGE_ID["/member"]).toBe("member");
    expect(PATH_TO_PAGE_ID["/npc"]).toBe("npc");
    expect(PATH_TO_PAGE_ID["/ritual"]).toBe("ritual");
    expect(PATH_TO_PAGE_ID["/sop"]).toBe("sop");
    expect(PATH_TO_PAGE_ID["/more"]).toBe("more");
    expect(PATH_TO_PAGE_ID["/brand"]).toBe("brand");
    expect(PATH_TO_PAGE_ID["/privacy"]).toBe("privacy");
  });

  it("keeps page identities distinct so added elements cannot leak between preview pages", () => {
    const uniqueIds = new Set(Object.values(PATH_TO_PAGE_ID));
    expect(uniqueIds.size).toBe(Object.values(PATH_TO_PAGE_ID).length);
    expect(PATH_TO_PAGE_ID["/"]).not.toBe(PATH_TO_PAGE_ID["/main"]);
    expect(PATH_TO_PAGE_ID["/main"]).not.toBe(PATH_TO_PAGE_ID["/store-select"]);
    expect(PATH_TO_PAGE_ID["/admin"]).not.toBe(PATH_TO_PAGE_ID["/"]);
  });

  it("normalizes branch visibility values returned by different database drivers", () => {
    expect(isBranchVisible({ visible: 1 })).toBe(true);
    expect(isBranchVisible({ visible: "1" })).toBe(true);
    expect(isBranchVisible({ visible: true })).toBe(true);
    expect(isBranchVisible({ visible: 0 })).toBe(false);
    expect(isBranchVisible({ visible: "0" })).toBe(false);
    expect(isBranchVisible({ visible: false })).toBe(false);
  });

  it("recognizes stable dynamic branch selectors without re-enabling legacy positional overrides", () => {
    expect(isDynamicTextOverrideSelector('[data-visual-editor-dynamic="branch-1"]')).toBe(true);
    expect(isDynamicTextOverrideSelector('[data-visual-editor-dynamic="branch-90001"]')).toBe(true);
    expect(isDynamicTextOverrideSelector('div:nth-of-type(1) > button:nth-of-type(1)')).toBe(false);
  });

  it("uses the logged-in admin branch for the regular admin system-settings tab", () => {
    expect(resolveVisualEditorRenderBranchId({
      pathname: "/admin",
      isEditorFrame: false,
      adminLoggedIn: true,
      adminBranchId: 90001,
      frontBranchId: 1,
    })).toBe(90001);

    expect(resolveVisualEditorRenderBranchId({
      pathname: "/admin",
      isEditorFrame: false,
      adminLoggedIn: false,
      adminBranchId: 90001,
      frontBranchId: 1,
    })).toBe(1);

    expect(resolveVisualEditorRenderBranchId({
      pathname: "/admin",
      isEditorFrame: true,
      adminLoggedIn: true,
      adminBranchId: 1,
      frontBranchId: 90001,
    })).toBe(90001);
  });

  it("accepts a native-text save revision only for the matching system-settings page and branch", () => {
    const revision = JSON.stringify({ pageId: "admin-settings", branchId: 1, at: 12345 });
    expect(isVisualEditorRevisionFor(revision, "admin-settings", 1)).toBe(true);
    expect(isVisualEditorRevisionFor(revision, "admin-settings", 90001)).toBe(false);
    expect(isVisualEditorRevisionFor(revision, "home", 1)).toBe(false);
    expect(isVisualEditorRevisionFor("not-json", "admin-settings", 1)).toBe(false);
  });
});
