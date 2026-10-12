import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState, useEffect, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { getFrontBranchId } from "@/lib/branch";
import PinchZoomViewer from "@/components/PinchZoomViewer";
import HOME_TOP_CANDLE_LOGO from "../home-top-logo_e3a32a4c.png";

// 第16批次-1: 玻璃雨滴特效重做 — 雨滴附著在鏡頭前玻璃表面，透明玻璃材質+背景折射感，
// 凝聚並緩慢向下蜿蜒滑落，留下水痕（高級酒吧落地窗夜雨氛圍）。
// 禁止：白色粒子、雪花、卡通風、流星式直線下落。
export function GlassRainEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let running = true;
    const parent = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = parent?.clientWidth ?? window.innerWidth;
      const h = parent?.clientHeight ?? window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const W = () => canvas.width / dpr;
    const H = () => canvas.height / dpr;

    // ── 附著在玻璃上的水珠（會凝聚、達臨界重量後緩慢蜿蜒下滑並留下水痕）──
    type Droplet = {
      x: number;
      y: number;
      r: number;
      vy: number; // 目前下滑速度（多數時間為 0 = 附著）
      sliding: boolean; // 是否正在滑落
      meander: number; // 蜿蜒相位
      pauseT: number; // 滑落中的隨機停頓計時
      grow: number; // 凝聚成長速率
      stretch: number; // 滑落時的縱向拉伸
    };
    type TrailDot = { x: number; y: number; r: number; life: number };

    const spawnDroplet = (top = false): Droplet => ({
      x: Math.random() * W(),
      y: top ? Math.random() * H() * 0.25 : Math.random() * H(),
      r: 1.2 + Math.random() * 3.2,
      vy: 0,
      sliding: false,
      meander: Math.random() * Math.PI * 2,
      pauseT: 0,
      grow: 0.0015 + Math.random() * 0.004,
      stretch: 1,
    });
    const droplets: Droplet[] = Array.from({ length: 70 }, () =>
      spawnDroplet()
    );
    const trails: TrailDot[] = [];

    // 玻璃水珠繪製：暗色邊緣（折射暗環）＋內部提亮（透出背景光）＋頂部高光＋底部反光弧
    const drawGlassDrop = (
      x: number,
      y: number,
      r: number,
      opacity: number,
      stretch = 1
    ) => {
      const ry = r * stretch;
      // 外圈暗環：水珠邊緣折射使光線偏折，看起來比玻璃暗
      ctx.beginPath();
      ctx.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
      const edge = ctx.createRadialGradient(x, y, r * 0.55, x, y, r);
      edge.addColorStop(0, "rgba(10,14,22,0)");
      edge.addColorStop(0.8, `rgba(8,12,20,${0.32 * opacity})`);
      edge.addColorStop(1, `rgba(5,8,14,${0.5 * opacity})`);
      ctx.fillStyle = edge;
      ctx.fill();
      // 內部：倒置聚光（水珠像小凸透鏡，把背景的城市燈光聚進來，中心略亮、帶暖色）
      ctx.beginPath();
      ctx.ellipse(x, y + ry * 0.08, r * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
      const inner = ctx.createRadialGradient(
        x,
        y + ry * 0.15,
        0,
        x,
        y,
        r * 0.75
      );
      inner.addColorStop(0, `rgba(120,130,150,${0.28 * opacity})`);
      inner.addColorStop(0.55, `rgba(70,80,105,${0.18 * opacity})`);
      inner.addColorStop(1, "rgba(40,50,70,0)");
      ctx.fillStyle = inner;
      ctx.fill();
      // 底部反光弧（環境光從下緣折射）
      ctx.beginPath();
      ctx.ellipse(x, y + ry * 0.55, r * 0.5, ry * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(160,175,200,${0.16 * opacity})`;
      ctx.fill();
      // 頂部微高光（小而柔，非白色粒子感）
      ctx.beginPath();
      ctx.ellipse(
        x - r * 0.28,
        y - ry * 0.42,
        Math.max(0.5, r * 0.16),
        Math.max(0.4, ry * 0.1),
        -0.5,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(210,220,235,${0.5 * opacity})`;
      ctx.fill();
    };

    const step = () => {
      if (!running) return;
      ctx.clearRect(0, 0, W(), H());

      // 玻璃霧面基底：極淡的整片濕玻璃質感
      const mist = ctx.createLinearGradient(0, 0, 0, H());
      mist.addColorStop(0, "rgba(20,28,42,0.05)");
      mist.addColorStop(1, "rgba(12,18,30,0.03)");
      ctx.fillStyle = mist;
      ctx.fillRect(0, 0, W(), H());

      // 水痕（滑落後留下的濕痕，緩慢蒸發淡出）
      for (let i = trails.length - 1; i >= 0; i--) {
        const t = trails[i];
        t.life -= 0.0025;
        if (t.life <= 0) {
          trails.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.ellipse(t.x, t.y, t.r, t.r * 1.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(90,105,130,${0.1 * t.life})`;
        ctx.fill();
      }

      for (const d of droplets) {
        if (!d.sliding) {
          // 附著狀態：緩慢凝聚變大；夠重才開始滑落
          d.r += d.grow;
          if (d.r > 3.2 && Math.random() < (d.r - 3.2) * 0.004) {
            d.sliding = true;
            d.vy = 0.08;
          }
        } else {
          // 滑落狀態：緩慢加速、隨機停頓、左右蜿蜒（絕非直線流星）
          if (d.pauseT > 0) {
            d.pauseT -= 1;
            d.vy = Math.max(0.02, d.vy * 0.9);
          } else {
            d.vy = Math.min(1.1, d.vy + 0.006 + d.r * 0.0012);
            if (Math.random() < 0.006) d.pauseT = 30 + Math.random() * 80; // 偶爾卡住
          }
          d.meander += 0.02 + Math.random() * 0.015;
          d.x += Math.sin(d.meander) * 0.35;
          d.y += d.vy;
          d.stretch = 1 + Math.min(0.5, d.vy * 0.45);
          // 留下水痕點
          if (Math.random() < 0.5) {
            trails.push({
              x: d.x,
              y: d.y - d.r,
              r: d.r * (0.4 + Math.random() * 0.25),
              life: 1,
            });
            if (trails.length > 500) trails.splice(0, trails.length - 500);
          }
          // 滑落中逐漸失去水量
          d.r = Math.max(1.6, d.r - 0.004);
          if (d.y > H() + 12) Object.assign(d, spawnDroplet(true));
        }
        drawGlassDrop(d.x, d.y, d.r, d.sliding ? 0.92 : 0.8, d.stretch);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[2] w-full h-full"
      aria-hidden="true"
    />
  );
}

// BUG 11: Luxury gold particle component
function LuxuryParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
        size: 2 + Math.random() * 4,
        opacity: 0.3 + Math.random() * 0.5,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[1]">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full animate-luxury-float"
          style={{
            left: `${p.left}%`,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, #ffd700, #b8860b)`,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes luxury-float {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
        .animate-luxury-float {
          animation: luxury-float linear infinite;
        }
        @keyframes luxury-shimmer {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-luxury-shimmer {
          animation: luxury-shimmer 3s ease-in-out infinite;
        }
        @keyframes luxury-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.1), 0 0 40px rgba(255, 215, 0, 0.05); }
          50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 215, 0, 0.1); }
        }
        .animate-luxury-glow {
          animation: luxury-glow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: settings = {} as any } = trpc.system.settings.get.useQuery({
    branchId: getFrontBranchId(),
  });
  const editHomepageVisible = settings?.editHomepageVisible ?? true;
  const parallaxEnabled = settings?.parallaxEnabled ?? false;
  const blackGoldEffectEnabled = settings?.blackGoldEffect ?? parallaxEnabled;

  // BUG 6: Fetch banners from DB for carousel
  const { data: banners = [] } = trpc.banner.list.useQuery({
    branchId: getFrontBranchId(),
  });
  const autoPlayEnabled = settings?.bannerAutoPlay !== false;
  // 第15批次-7/8: 玻璃雨滴特效 + 輪播轉場特效（同一開關 rainEffect 控制，預設開啟）
  const rainEffectEnabled = settings?.rainEffect !== false;

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-play carousel
  useEffect(() => {
    if (autoPlayEnabled && (banners as any[]).length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % (banners as any[]).length);
      }, 4000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [autoPlayEnabled, (banners as any[]).length]);

  // BUG 3（第十一批）: Parallax scroll effect — 滾動時圖片稍停 0.2 秒後立即追上頁面，回到框中完整顯示
  // 作法：滾動當下先讓圖片相對框產生位移（視覺落差），停止滾動或延遲 0.2 秒後位移歸零（追上頁面）
  const [parallaxOffset, setParallaxOffset] = useState(0);
  useEffect(() => {
    if (!parallaxEnabled) return;
    let lastScrollY = window.scrollY;
    let catchUpTimer: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      // 滾動瞬間：圖片先落後（往滾動反方向偏移），形成視覺落差
      setParallaxOffset(prev => {
        const next = prev + delta * 0.5;
        return Math.max(-80, Math.min(80, next));
      });
      // 0.2 秒後圖片馬上追上頁面，位移歸零回到框中完整顯示
      if (catchUpTimer) clearTimeout(catchUpTimer);
      catchUpTimer = setTimeout(() => {
        setParallaxOffset(0);
      }, 200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (catchUpTimer) clearTimeout(catchUpTimer);
    };
  }, [parallaxEnabled]);

  // BUG 7: PinchZoom viewer state
  const [pinchZoomSrc, setPinchZoomSrc] = useState<string | null>(null);

  // Static text content (kept from original)
  const title = "碳咖冰櫃";
  const subtitle = "創意餐飲";
  const mainHeading = "邊慶生・邊賺錢";
  const subHeading = "壽星專屬｜沉浸式餐酒館";
  const activityDesc1 = "玩到失控，當一日餐酒館老闆";
  const activityDesc2 = "這場生日，朋友圈會被洗 3 天";
  const activityDesc3 = "邀請親友一起經營一間餐酒館";
  const exclusivityLabel = "全台唯一";
  const footerInfo1 = "「原創沉浸式活動」已取得美、中著作權證書";
  const footerInfo2 = "未經授權，請勿仿作";
  const copyright = "© 2025 碳咖冰櫃創意餐飲";

  return (
    <div
      className={`min-h-screen ${blackGoldEffectEnabled ? "bg-gradient-to-br from-black via-slate-950 to-black" : "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800"}`}
    >
      {/* BUG 11: Luxury gold particle effects when parallax enabled */}
      {blackGoldEffectEnabled && <LuxuryParticles />}

      {/* 第15批次-7: 首頁玻璃雨滴特效（由輪播圖管理的顯示/隱藏開關控制） */}
      {rainEffectEnabled && <GlassRainEffect />}

      {/* BUG 7: PinchZoom viewer */}
      {pinchZoomSrc && (
        <PinchZoomViewer
          src={pinchZoomSrc}
          alt="輪播圖"
          onClose={() => setPinchZoomSrc(null)}
          backLabel="返回首頁"
        />
      )}

      {/* Main content */}
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src={HOME_TOP_CANDLE_LOGO}
              alt="碳咖冰櫃金色燭台標誌"
              className="relative top-3 mx-auto mt-4 mb-3 h-auto w-[clamp(3.5rem,7.5vw,4.5rem)] select-none object-contain"
              draggable={false}
            />
            <div
              className="text-4xl font-bold text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)",
                backgroundSize: "180% 100%",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {title}
            </div>
            <div
              className={`text-lg mt-2 ${blackGoldEffectEnabled ? "text-amber-200" : "text-amber-300"}`}
            >
              {subtitle}
            </div>
          </div>

			  {/* Only the requested headline group moves down slightly from「創意餐飲」. */}
			  <div className="mt-8 mb-12 text-center">
		            <div className="relative inline-block">
              <span
                aria-label={exclusivityLabel}
                className="absolute -top-7 left-0 block whitespace-nowrap text-left text-[1.25rem] leading-none font-bold tracking-normal text-amber-200 md:text-[1.875rem]"
              >
                {exclusivityLabel}
              </span>
              <h1
                className={`font-bold ${blackGoldEffectEnabled ? "text-[2.5rem] md:text-6xl whitespace-nowrap text-transparent" : "text-5xl md:text-6xl text-white"}`}
                style={
                  blackGoldEffectEnabled
                    ? {
                        backgroundImage:
                          "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)",
                        backgroundSize: "180% 100%",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }
                    : undefined
                }
              >
                {mainHeading}
              </h1>
            </div>

            <p
              className="mt-6 text-2xl font-semibold"
              style={{
                background:
                  "linear-gradient(105deg, #6f4d1a 0%, #a77b2b 19%, #f3e4a5 42%, #bd8a2d 58%, #76531d 79%, #d9bd67 100%)",
                backgroundSize: "180% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {subHeading}
            </p>

            <div className="mt-8 text-white whitespace-pre-line">
              <p>{activityDesc1}</p>
              <p>{activityDesc2}</p>
              <p>{activityDesc3}</p>
            </div>
          </div>

          {/* BUG 6: Hero image carousel area */}
          <div className="mb-12">
            {(banners as any[]).length > 0 ? (
              <div className="relative">
                {/* BUG 6: Carousel display - A4 landscape aspect ratio (1.414:1) */}
                <div
                  className={`${blackGoldEffectEnabled ? "bg-black/60 border-2 border-amber-400/50 animate-luxury-glow" : "bg-slate-800/50 border-2 border-amber-500/30"} rounded-lg overflow-hidden relative cursor-pointer`}
                  style={{ aspectRatio: "1.414 / 1" }}
                  onClick={() =>
                    setPinchZoomSrc((banners as any[])[currentSlide]?.imageUrl)
                  }
                >
                  {rainEffectEnabled ? (
                    /* 第15批次-8: 輪播轉場特效（crossfade + 微縮放，與玻璃雨滴同一開關） */
                    (banners as any[]).map((b: any, idx: number) => (
                      <img
                        key={b.id ?? idx}
                        src={b.imageUrl}
                        alt={`Banner ${idx + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          opacity: idx === currentSlide ? 1 : 0,
                          transform: parallaxEnabled
                            ? `translateY(${idx === currentSlide ? parallaxOffset : 0}px) scale(${idx === currentSlide ? 1.15 : 1.22})`
                            : idx === currentSlide
                              ? "scale(1)"
                              : "scale(1.06)",
                          transition:
                            parallaxEnabled &&
                            idx === currentSlide &&
                            parallaxOffset !== 0
                              ? "opacity 0.8s cubic-bezier(0.23, 1, 0.32, 1), transform 0.12s ease-out"
                              : "opacity 0.8s cubic-bezier(0.23, 1, 0.32, 1), transform 0.9s cubic-bezier(0.23, 1, 0.32, 1)",
                          willChange: "opacity, transform",
                          pointerEvents: idx === currentSlide ? "auto" : "none",
                        }}
                      />
                    ))
                  ) : (
                    <img
                      src={(banners as any[])[currentSlide]?.imageUrl}
                      alt={`Banner ${currentSlide + 1}`}
                      className="w-full h-full object-cover"
                      style={
                        parallaxEnabled
                          ? {
                              transform: `translateY(${parallaxOffset}px) scale(1.15)`,
                              transition:
                                parallaxOffset === 0
                                  ? "transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)"
                                  : "transform 0.12s ease-out",
                              willChange: "transform",
                            }
                          : undefined
                      }
                    />
                  )}
                </div>
                {/* Carousel controls */}
                {(banners as any[]).length > 1 && (
                  <>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setCurrentSlide(
                          prev =>
                            (prev - 1 + (banners as any[]).length) %
                            (banners as any[]).length
                        );
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 text-xl"
                    >
                      ‹
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setCurrentSlide(
                          prev => (prev + 1) % (banners as any[]).length
                        );
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 text-xl"
                    >
                      ›
                    </button>
                  </>
                )}
                {/* Dots indicator */}
                <div className="flex justify-center gap-2 mt-3">
                  {(banners as any[]).map((_b: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-3 h-3 rounded-full transition ${idx === currentSlide ? "bg-amber-400" : "bg-slate-600"}`}
                    />
                  ))}
                </div>
                <p className="text-amber-400 text-sm text-center mt-2">
                  當日營收現金50％回饋
                </p>
              </div>
            ) : (
              <div className="bg-slate-800/50 border-2 border-amber-500/30 rounded-lg p-12 text-center min-h-80 flex flex-col items-center justify-center">
                <div className="text-white text-lg mb-4">[主視覺圖片區]</div>
                <div className="text-white text-sm">
                  席位僅憑邀請・不對外開放
                </div>
              </div>
            )}
          </div>

          {/* CTA button */}
          <div className="flex justify-center mb-12">
            <Button
              onClick={() => navigate("/store-select")}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-12 py-6"
            >
              免費預約體驗
            </Button>
          </div>
          {/* Footer info */}
          {/* Edit button - moved above footer */}
          {editHomepageVisible && (
            <div className="flex justify-center gap-4 mb-8">
              <Button
                onClick={() => navigate("/admin")}
                variant="outline"
                className="text-amber-400 border-amber-400"
              >
                編輯首頁
              </Button>
            </div>
          )}

          {/* Footer info - moved below edit button */}
          <div className="text-center text-white mb-8">
            <p className="mb-2">{footerInfo1}</p>
            <p>{footerInfo2}</p>
          </div>

          {/* Copyright */}
          <div
            className={`text-center text-sm ${blackGoldEffectEnabled ? "text-amber-300/80" : "text-amber-400"}`}
          >
            {copyright}
          </div>
        </div>
      </div>
    </div>
  );
}
