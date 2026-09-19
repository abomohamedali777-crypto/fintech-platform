"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Timer,
  Wallet,
  Layers,
} from "lucide-react";
import { useSettings } from "@/lib/site";

const width = 640;
const height = 150;

const INITIAL_POINTS = [42, 46, 44, 51, 49, 56, 54, 61, 58, 66, 63, 71, 68, 76, 74, 82, 79, 87, 85, 92];
const LAST_X = width - 6;

const sampleCurves: number[][] = [
  [46, 44, 52, 48, 55, 51, 60, 57, 64, 62, 70, 66, 74, 72, 79, 77, 84, 82, 90, 88],
  [38, 44, 42, 50, 47, 53, 51, 58, 56, 63, 61, 68, 65, 72, 70, 77, 75, 82, 80, 86],
  [52, 48, 55, 51, 59, 56, 63, 60, 68, 65, 72, 69, 76, 73, 81, 78, 85, 82, 90, 87],
];

function buildPath(points: number[]) {
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => ({
    x: i * step,
    y: height - (p / 100) * height,
  }));

  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cx = (prev.x + curr.x) / 2;
    path += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return path;
}

const linePath = buildPath(INITIAL_POINTS);
const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

function fmtMoney(n: number) {
  return n >= 1e9
    ? `$${(n / 1e9).toFixed(1)}B`
    : n >= 1e6
      ? `$${(n / 1e6).toFixed(1)}M`
      : `$${n.toLocaleString()}`;
}

export default function Dashboard() {
  const { t } = useSettings();
  const [points, setPoints] = useState(INITIAL_POINTS);
  const [volume, setVolume] = useState(24.8);
  const [recentTxns, setRecentTxns] = useState(1268);
  const [latency, setLatency] = useState(38);
  const [uptime, setUptime] = useState(99.99);

  useEffect(() => {
    const tick = setInterval(() => {
      const curve = sampleCurves[Math.floor(Math.random() * sampleCurves.length)];
      const drift = Math.floor(Math.random() * 5) - 2;
      setPoints(curve.map((p) => Math.min(97, Math.max(12, p + drift))));
      setVolume((v) => Math.max(20, v + (Math.random() * 1.6 - 0.8)));
      setRecentTxns((t) => t + Math.floor(Math.random() * 60) - 25);
      setLatency((l) => Math.max(26, Math.min(52, l + (Math.random() * 8 - 4))));
      setUptime((u) => (99.98 + Math.random() * 0.02).toFixed(2) as unknown as number);
    }, 2200);
    return () => clearInterval(tick);
  }, []);

  const path = buildPath(points);
  const delta = points[points.length - 1] - points[0];
  const lastY = height - (points[points.length - 1] / 100) * height;

  return (
    <div className="overflow-hidden rounded-2xl border hairline bg-canvas shadow-lift">
      <div className="flex items-center justify-between border-b hairline px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" style={{ animation: "fade-in 2s ease-in-out infinite" }} />
          <span className="text-[13px] font-medium text-ink">{t("dash.live")}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate">
          <span className="rounded-md bg-mist px-2 py-1">UTC 04:12</span>
          <span className="hidden rounded-md bg-mist px-2 py-1 sm:inline-block">{t("dash.rail")}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-black/5 lg:grid-cols-4 dark:bg-white/10">
        <div className="bg-canvas p-5">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate">
            <Wallet className="h-3.5 w-3.5" strokeWidth={2} />
            {t("dash.volume")}
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-ink">
            {fmtMoney(volume * 1e6)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
            <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
            +{((volume / 20 - 1) * 100).toFixed(2)}% {t("dash.vsPrior")}
          </p>
        </div>

        <div className="bg-canvas p-5">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate">
            <Activity className="h-3.5 w-3.5" strokeWidth={2} />
            {t("dash.txns")}
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-ink">
            {recentTxns.toLocaleString()}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
            <ArrowDownRight className="h-3 w-3" strokeWidth={2.5} />
            62 {t("dash.opsSec")}
          </p>
        </div>

        <div className="bg-canvas p-5">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate">
            <Timer className="h-3.5 w-3.5" strokeWidth={2} />
            {t("dash.latency")}
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-ink">{latency} ms</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
            <ArrowDownRight className="h-3 w-3" strokeWidth={2.5} />
            {t("dash.p95")}
          </p>
        </div>

        <div className="bg-canvas p-5">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate">
            <Layers className="h-3.5 w-3.5" strokeWidth={2} />
            {t("dash.uptime")}
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-ink">{uptime}%</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
            <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
            {t("dash.sla")}
          </p>
        </div>
      </div>

      <div className="border-t hairline bg-mist/40 px-6 pb-4 pt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate">
            {t("dash.throughput")}
          </p>
          <p className={`text-[11px] font-semibold ${delta >= 0 ? "text-accent" : "text-red-500 dark:text-red-400"}`}>
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(0)} req/s
          </p>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0066CC" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#0066CC" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#areaFill)" />
          <path
            d={path}
            fill="none"
            stroke="#0066CC"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: "all 900ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
          <circle
            cx={LAST_X}
            cy={lastY}
            r="4"
            fill="#0066CC"
            stroke="#fff"
            strokeWidth="2"
            style={{ transition: "all 900ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </svg>
        <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-slate">
          {["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", t("dash.now")].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}