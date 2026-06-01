import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { Layout } from "@/components/Layout";
import { Zap, Shield, TrendingUp, Activity } from "lucide-react";

const STATS = [
  { icon: Activity, label: "إشارات مباشرة", value: "24/7" },
  { icon: TrendingUp, label: "دقة التنبؤ", value: "85%" },
  { icon: Shield,    label: "أزواج مُحللة", value: "50+" },
  { icon: Zap,       label: "مؤشرات تقنية", value: "20+" },
];

const Index = () => {
  useDocumentMeta({
    title: "TradeXRay AI — Crypto Trading Intelligence & AI Signals",
    description: "Real-time crypto trading signals with AI probability scoring, multi-layer analysis, and ATR risk management for Binance, Bybit & OKX.",
    canonicalPath: "/",
  });

  return (
    <Layout>
      <div className="flex flex-col h-full bg-[#0a0e1a]">
        {/* ── Premium Header ─────────────────────────────────────────────────── */}
        <header className="relative flex-shrink-0 overflow-hidden bg-gradient-to-r from-[#0a0e1a] via-[#0d1220] to-[#0a0e1a] border-b border-white/5">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,200,122,0.8) 1px, transparent 0)`,
              backgroundSize: "28px 28px",
            }}
          />
          <div className="absolute left-1/4 top-0 w-96 h-16 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute right-1/4 top-0 w-64 h-12 bg-blue-500/8 rounded-full blur-3xl -translate-y-1/2" />

          <div className="relative z-10 flex items-center justify-between px-6 py-3">
            {/* Left — Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-widest uppercase">War Room</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-medium">
                    Live · Decision Intelligence
                  </span>
                </div>
              </div>
            </div>

            {/* Center — Stats */}
            <div className="hidden md:flex items-center gap-6">
              {STATS.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-white/5 border border-white/8 flex items-center justify-center">
                    <Icon className="w-3 h-3 text-emerald-400/80" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white tabular-nums leading-none">{value}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right — Tag */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">TradeXRay AI</span>
            </div>
          </div>
        </header>

        {/* ── War Room iframe ─────────────────────────────────────────────────── */}
        <iframe
          src="/war-room.html"
          className="flex-1 w-full border-none"
          title="WAR ROOM ∷ Decision Intelligence"
        />
      </div>
    </Layout>
  );
};

export default Index;
