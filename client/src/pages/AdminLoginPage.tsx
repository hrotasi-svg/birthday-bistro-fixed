import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { setFrontBranchId } from "@/lib/branch";

export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  // 第13批次-15: 城市、地區輸入框（預設值：高雄市／鳳山區）
  const [city, setCity] = useState("高雄市");
  const [district, setDistrict] = useState("鳳山區");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Fetch credentials from DB settings (supports changed credentials)
  const { data: settings } = trpc.system.settings.get.useQuery();
  const verifyBranchMut = trpc.branch.verifyLogin.useMutation();

  const handleLogin = async () => {
    const trimmedAccount = account.trim();
    const trimmedPassword = password.trim();
    const trimmedCity = city.trim();
    const trimmedDistrict = district.trim();

    if (!trimmedCity || !trimmedDistrict) {
      setError("請輸入城市與地區");
      return;
    }

    // 第13批次-15: 城市＋地區＋帳號＋密碼 與分店管理資料綁定驗證
    try {
      const result = await verifyBranchMut.mutateAsync({
        city: trimmedCity,
        district: trimmedDistrict,
        username: trimmedAccount,
        password: trimmedPassword,
      });
      if (result.success) {
        sessionStorage.setItem("adminLoggedIn", "true");
        sessionStorage.setItem("adminBranchId", String(result.branchId));
        sessionStorage.setItem("adminBranchCity", result.city);
        sessionStorage.setItem("adminBranchDistrict", result.district);
        // 第15批次-2: 該裝置前台改用此分店的獨立資料分類
        setFrontBranchId(result.branchId);
        navigate("/admin");
        return;
      }
    } catch {
      // 驗證服務異常時退回舊有帳密檢查
    }

    // Use DB-stored credentials if available, fallback to defaults
    const validUsername = settings?.adminUsername || "aidoll0612";
    const validPassword = settings?.adminPassword || "542966";

    if (
      trimmedCity === "高雄市" &&
      trimmedDistrict === "鳳山區" &&
      trimmedAccount === validUsername &&
      trimmedPassword === validPassword
    ) {
      sessionStorage.setItem("adminLoggedIn", "true");
      sessionStorage.setItem("adminBranchCity", trimmedCity);
      sessionStorage.setItem("adminBranchDistrict", trimmedDistrict);
      sessionStorage.setItem("adminBranchId", "1");
      setFrontBranchId(1);
      navigate("/admin");
    } else {
      setError("城市、地區、帳號或密碼錯誤，請確認後再試");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-8 max-w-md w-full">
        <h1
          className="text-3xl font-bold text-center mb-8"
          style={{
            background: "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)",
            backgroundSize: "180% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          偵錯報告
        </h1>

        <div className="space-y-4">
          {/* 第13批次-15: 城市、地區輸入框（帳號上方） */}
          <div>
            <label className="block text-amber-400 text-sm mb-2">城市</label>
            <input
              type="text"
              value={city}
              onChange={(e) => { setCity(e.target.value); setError(""); }}
              placeholder="請輸入城市"
              className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-amber-500/30 focus:border-amber-500 outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div>
            <label className="block text-amber-400 text-sm mb-2">地區</label>
            <input
              type="text"
              value={district}
              onChange={(e) => { setDistrict(e.target.value); setError(""); }}
              placeholder="請輸入地區"
              className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-amber-500/30 focus:border-amber-500 outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div>
            <label className="block text-amber-400 text-sm mb-2">帳號</label>
            <input
              type="text"
              value={account}
              onChange={(e) => { setAccount(e.target.value); setError(""); }}
              placeholder="請輸入帳號"
              className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-amber-500/30 focus:border-amber-500 outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div>
            <label className="block text-amber-400 text-sm mb-2">密碼</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="請輸入密碼"
                className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-amber-500/30 focus:border-amber-500 outline-none pr-16"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-400 text-sm"
              >
                {showPassword ? "隱藏" : "顯示"}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">{error}</p>
          )}

          <button
            onClick={handleLogin}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
          >
            確認登入
          </button>

          <button
            onClick={() => navigate("/main")}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg transition-colors"
          >
            ← 返回主功能
          </button>
        </div>
      </div>
    </div>
  );
}
