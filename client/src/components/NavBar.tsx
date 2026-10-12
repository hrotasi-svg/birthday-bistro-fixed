import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NavBar() {
  const [, navigate] = useLocation();

  return (
    <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={() => navigate("/")}
          className="text-xl font-bold"
          style={{
            background: "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)",
            backgroundSize: "180% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          壽星餐酒館
        </button>
        <div className="flex gap-1 flex-wrap justify-end items-center">
          <Button
            variant="ghost"
            className="text-amber-400 hover:text-amber-300 hover:bg-slate-800"
            onClick={() => navigate("/")}
          >
            首頁
          </Button>
          <Button
            variant="ghost"
            className="text-amber-400 hover:text-amber-300 hover:bg-slate-800"
            onClick={() => navigate("/main")}
          >
            主功能
          </Button>
          <Button
            variant="ghost"
            className="text-amber-400 hover:text-amber-300 hover:bg-slate-800"
            onClick={() => navigate("/menu")}
          >
            精選菜單
          </Button>
          <Button
            variant="ghost"
            className="text-amber-400 hover:text-amber-300 hover:bg-slate-800"
            onClick={() => navigate("/brand")}
          >
            品牌資訊
          </Button>
          <Button
            variant="ghost"
            className="text-amber-400 hover:text-amber-300 hover:bg-slate-800"
            onClick={() => navigate("/leaderboard")}
          >
            營業王
          </Button>
          <Button
            variant="ghost"
            className="text-amber-400 hover:text-amber-300 hover:bg-slate-800"
            onClick={() => navigate("/booking")}
          >
            開始預約
          </Button>
          <Button
            variant="ghost"
            className="text-amber-400 hover:text-amber-300 hover:bg-slate-800"
            onClick={() => navigate("/my-booking")}
          >
            我的預約
          </Button>
          <Button
            variant="ghost"
            className="text-amber-400 hover:text-amber-300 hover:bg-slate-800"
            onClick={() => navigate("/invite")}
          >
            邀請碼
          </Button>
          <Button
            variant="ghost"
            className="text-amber-400 hover:text-amber-300 hover:bg-slate-800"
            onClick={() => navigate("/member")}
          >
            我的生日倒數
          </Button>
        </div>
      </div>
    </nav>
  );
}
