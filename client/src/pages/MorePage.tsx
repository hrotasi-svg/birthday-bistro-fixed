import { useLocation } from "wouter";

const MORE_ITEMS = [
  { title: "品牌資訊", path: "/brand" },
  { title: "聯絡我們", path: "/brand?tab=contact" },
  { title: "隱私權政策", path: "/privacy" },
  { title: "使用者條款", path: "/brand?tab=terms" },
  { title: "常見問題", path: "/brand?tab=faq" },
];

const metallicFrameStyle = {
  border: "2px solid transparent",
  background: "linear-gradient(rgba(15,23,42,0.86), rgba(15,23,42,0.86)) padding-box, linear-gradient(105deg, #604216 0%, #b88935 20%, #f7ebba 43%, #b67e28 60%, #5c3e13 80%, #dfc670 100%) border-box",
};

export default function MorePage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">
      <div className="py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => navigate("/admin-login")}
            className="block w-full text-4xl font-bold text-center mb-12 cursor-pointer"
            style={{
              background: "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)",
              backgroundSize: "180% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            更多
          </button>

          <div className="grid grid-cols-2 gap-4">
            {MORE_ITEMS.slice(0, 4).map((item) => (
              <button
                key={item.title}
                onClick={() => {
                  if (item.path.includes("#")) {
                    const [base, hash] = item.path.split("#");
                    navigate(base);
                    setTimeout(() => {
                      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
                    }, 300);
                  } else {
                    navigate(item.path);
                  }
                }}
                className="w-full text-white rounded-xl py-6 px-4 text-center text-lg font-bold transition-all duration-200 hover:scale-[1.02] hover:brightness-125 cursor-pointer"
                style={metallicFrameStyle}
              >
                {item.title}
              </button>
            ))}
            <button
              onClick={() => navigate(MORE_ITEMS[4].path)}
              className="col-span-2 w-[calc(50%-0.5rem)] justify-self-center text-white rounded-xl py-6 px-4 text-center text-lg font-bold transition-all duration-200 hover:scale-[1.02] hover:brightness-125 cursor-pointer"
              style={metallicFrameStyle}
            >
              常見問題
            </button>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate("/main")}
              className="border-2 border-pink-400 bg-slate-900/50 text-pink-300 rounded-lg px-6 py-3 transition-all duration-200 hover:border-pink-300 hover:bg-pink-950/20"
            >
              ← 返回主功能頁
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
