import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(
  new URL("../client/src/pages/Home.tsx", import.meta.url),
  "utf8"
);

describe("homepage metallic-gold title", () => {
  it("uses a multi-stop text-clipped gold gradient without the former shimmer animation", () => {
    expect(homeSource).toContain(
      'const HOME_TOP_CANDLE_LOGO = "/manus-storage/home-top-logo_e3a32a4c.png";'
    );
    expect(homeSource).toContain("src={HOME_TOP_CANDLE_LOGO}");
    expect(homeSource).toContain('alt="碳咖冰櫃金色燭台標誌"');
    expect(homeSource).toContain(
      "relative top-3 mx-auto mt-4 mb-3 h-auto w-[clamp(3.5rem,7.5vw,4.5rem)]"
    );
    expect(homeSource).toContain(
      "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)"
    );
    expect(homeSource).toContain(
      'className="text-4xl font-bold text-transparent"'
    );
    expect(homeSource).toContain('WebkitTextFillColor: "transparent"');
    expect(homeSource).not.toContain("text-amber-300 animate-luxury-shimmer");
  });
});
