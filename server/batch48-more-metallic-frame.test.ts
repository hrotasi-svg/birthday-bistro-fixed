import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const morePageSource = fs.readFileSync(
  path.resolve(process.cwd(), "client/src/pages/MorePage.tsx"),
  "utf8",
);

describe("第48批次：了解更多金屬漸層框", () => {
  it("uses an isolated metallic gradient frame instead of the global amber-to-pink override", () => {
    expect(morePageSource).toContain("const metallicFrameStyle");
    expect(morePageSource).toContain("linear-gradient(105deg, #604216 0%, #b88935 20%, #f7ebba 43%");
    expect(morePageSource).toContain('style={metallicFrameStyle}');
    expect(morePageSource).not.toContain("hover:border-amber-500");
    expect(morePageSource).not.toContain("border-amber-400");
  });

  it("keeps the requested more-page navigation targets after the layout reorder", () => {
    for (const target of ["/brand", "/brand?tab=faq", "/brand?tab=contact", "/privacy", "/brand?tab=terms", "/admin-login", 'navigate("/main")']) {
      expect(morePageSource).toContain(target);
    }
  });
});
