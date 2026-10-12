import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
const morePage = source("client/src/pages/MorePage.tsx");
const brandInfo = source("client/src/pages/BrandInfoPage.tsx");
const bookFlip = source("client/src/components/BookFlipViewer.tsx");

describe("第54批次：菜單連續翻頁與了解更多內容", () => {
  it("keeps more entries in the requested two-row plus centered FAQ order and moves debug login to the heading", () => {
    expect(morePage).toContain('className="grid grid-cols-2 gap-4"');
    const positions = ["品牌資訊", "聯絡我們", "隱私權政策", "使用者條款", "常見問題"].map((title) => morePage.indexOf(`title: "${title}"`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(morePage).not.toContain('title: "偵錯報告"');
    expect(morePage).toContain('onClick={() => navigate("/admin-login")}');
    expect(morePage).toContain('col-span-2 w-[calc(50%-0.5rem)] justify-self-center');
    expect(morePage).toContain('path: "/brand?tab=faq"');
    expect(morePage).toContain('path: "/brand?tab=contact"');
  });

  it("replaces the FAQ content with the requested birthday and guest guidance", () => {
    expect(brandInfo).toContain("常見問題 FAQ");
    ["一、活動資格與參加方式", "二、壽星專屬權益", "三、餐酒與活動體驗", "四、門店與活動規則", "五、預約、付款與退款"].forEach((heading) => expect(brandInfo).toContain(heading));
    expect(brandInfo).toContain('text-2xl font-bold text-white');
    expect(brandInfo).toContain("Q：需要自備蛋糕嗎？");
    expect(brandInfo).toContain("Q：壽星如何參加活動？");
    expect(brandInfo).toContain("Q：一般人也想參加怎麼辦？");
    expect(brandInfo).toContain("Q：親友參與活動也有獎勵嗎？");
    expect(brandInfo).toContain("完整活動已經免費吃喝 6 小時，那販售餐酒的成本需要另外支付嗎？");
    expect(brandInfo).toContain("faqGoldTextStyle");
    expect(brandInfo).toContain("faqItemClass");
    expect(brandInfo).toContain("faqQuestionClass");
    expect(brandInfo).toContain("faqAnswerClass");
    expect(brandInfo).toContain("pl-7 -indent-7");
    const faqSection = brandInfo.slice(brandInfo.indexOf('activeTab === "faq"'), brandInfo.indexOf('activeTab === "contact"'));
    expect(faqSection).not.toMatch(/[^。]<br\/>/u);
    expect(brandInfo).toContain("今年生日，送一間餐酒館給壽星");
    expect(brandInfo).toContain("傳統包場慶生・需花 4 萬");
    expect(brandInfo).toContain("現在不用花錢・還能賺錢");
    expect(brandInfo).toContain('className="block font-bold"');
    expect(brandInfo).toContain("grid-cols-[1.75rem_minmax(0,1fr)]");
    expect(brandInfo).toContain('className="ml-7"');
    expect(brandInfo).toContain('邀請資格，歡迎邀請親朋好友一起參加。');
    expect(brandInfo).toContain('className="whitespace-nowrap"');
    expect(brandInfo).not.toContain("Q：可以自備蛋糕嗎？");
  });

  it("switches both right-to-left and left-to-right right pages at the menu midpoint", () => {
    expect(bookFlip).toContain("menu-right-outgoing-half");
    expect(bookFlip).toContain("menu-right-incoming-half");
    expect(bookFlip).toContain('49.99% { transform: rotateY(-90deg); opacity: 1; }');
    expect(bookFlip).toContain('50% { transform: rotateY(-90deg); opacity: 1; }');
    expect(bookFlip).toContain('0.62s linear forwards');
    expect(bookFlip).toContain("menu-left-prev-outgoing-half");
    expect(bookFlip).toContain("menu-left-prev-incoming-half");
    expect(bookFlip).toContain('rightPageFlip && flipping.direction === "prev"');
  });
});
