"use client";

import { useState } from "react";
import { Layers, LocateFixed, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type MapPoint = {
  id: string;
  x: number; // 0–100 (%)
  y: number; // 0–100 (%)
  kind: "worker" | "complaint" | "site";
  tone: "green" | "amber" | "blue" | "red" | "slate" | "violet";
  label: string;
  sub?: string;
  live?: boolean;
};

const toneMap = {
  green: { bg: "bg-emerald-500", ring: "bg-emerald-400" },
  amber: { bg: "bg-amber-500", ring: "bg-amber-400" },
  blue: { bg: "bg-sky-500", ring: "bg-sky-400" },
  red: { bg: "bg-rose-500", ring: "bg-rose-400" },
  slate: { bg: "bg-slate-400", ring: "bg-slate-300" },
  violet: { bg: "bg-violet-500", ring: "bg-violet-400" },
};

/** Stylised live-tracking map (placeholder for Google Maps / Mapbox). */
export function LiveMap({
  points,
  className,
  selected,
  onSelect,
  showControls = true,
  geofence,
}: {
  points: MapPoint[];
  className?: string;
  selected?: string | null;
  onSelect?: (id: string) => void;
  showControls?: boolean;
  geofence?: { x: number; y: number; r: number };
}) {
  const [hover, setHover] = useState<string | null>(null);
  const active = hover ?? selected ?? null;

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-[#eef2f6]", className)}>
      <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        {/* parks & water */}
        <path d="M0 470 C 140 430, 260 520, 420 500 S 700 560, 1000 520 L1000 600 L0 600 Z" fill="#cfe3f5" />
        <rect x="640" y="60" width="200" height="130" rx="18" fill="#dcefd9" />
        <rect x="80" y="300" width="150" height="110" rx="18" fill="#dcefd9" />
        {/* blocks */}
        {Array.from({ length: 6 }).map((_, r) =>
          Array.from({ length: 9 }).map((_, c) => {
            const x = 20 + c * 112;
            const y = 20 + r * 82;
            if ((c >= 6 && c <= 7 && r <= 1) || (c <= 1 && r >= 4 && r <= 4)) return null;
            return <rect key={`${r}-${c}`} x={x} y={y} width="92" height="62" rx="8" fill="#e2e8f0" opacity={0.55 + ((r * 7 + c * 3) % 4) * 0.1} />;
          }),
        )}
        {/* roads */}
        <g stroke="#ffffff" strokeLinecap="round" fill="none">
          <path d="M0 290 C 250 270, 480 330, 1000 250" strokeWidth="22" />
          <path d="M540 0 C 520 200, 600 380, 560 600" strokeWidth="18" />
          <path d="M0 110 L 1000 130" strokeWidth="10" />
          <path d="M240 0 L 300 600" strokeWidth="10" />
          <path d="M800 0 L 760 600" strokeWidth="10" />
        </g>
        <g stroke="#fcd34d" strokeWidth="2" strokeDasharray="10 10" fill="none" opacity=".8">
          <path d="M0 290 C 250 270, 480 330, 1000 250" />
          <path d="M540 0 C 520 200, 600 380, 560 600" />
        </g>
      </svg>

      {geofence && (
        <div
          className="absolute rounded-full border-2 border-dashed border-brand-500/70 bg-brand-500/10"
          style={{
            left: `${geofence.x}%`,
            top: `${geofence.y}%`,
            width: `${geofence.r * 2}%`,
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {points.map((p) => {
        const t = toneMap[p.tone];
        const isActive = active === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onMouseEnter={() => setHover(p.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSelect?.(p.id)}
            className={cn("absolute -translate-x-1/2 -translate-y-1/2", isActive ? "z-20" : "z-10")}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            aria-label={p.label}
          >
            {p.kind === "worker" ? (
              <span className="relative grid place-items-center">
                {p.live && <span className={cn("absolute size-4 animate-ping-slow rounded-full", t.ring)} />}
                <span className={cn("relative size-4 rounded-full border-[3px] border-white shadow-md", t.bg, isActive && "scale-125")} />
              </span>
            ) : p.kind === "site" ? (
              <span className={cn("grid size-7 place-items-center rounded-lg border-2 border-white text-[10px] font-bold text-white shadow-md", t.bg)}>
                {p.label.slice(0, 1)}
              </span>
            ) : (
              <span className="relative block">
                <svg viewBox="0 0 24 32" className={cn("h-7 w-5 drop-shadow-md transition-transform", isActive && "scale-125")}>
                  <path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.5 12 32 12 32s12-11.5 12-20.3C24 5.2 18.6 0 12 0z" className={cn("fill-current", { green: "text-emerald-500", amber: "text-amber-500", blue: "text-sky-500", red: "text-rose-500", slate: "text-slate-400", violet: "text-violet-500" }[p.tone])} />
                  <circle cx="12" cy="11.5" r="4.5" fill="white" />
                </svg>
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg bg-navy-950 px-2.5 py-1.5 text-left whitespace-nowrap text-white shadow-lift">
                <span className="block text-xs font-semibold">{p.label}</span>
                {p.sub && <span className="block text-[11px] text-white/70">{p.sub}</span>}
              </span>
            )}
          </button>
        );
      })}

      {showControls && (
        <>
          <div className="absolute top-3 right-3 flex flex-col overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-slate-200">
            <button className="p-2 text-slate-600 hover:bg-slate-50" aria-label="Zoom in">
              <Plus className="size-4" />
            </button>
            <span className="h-px bg-slate-200" />
            <button className="p-2 text-slate-600 hover:bg-slate-50" aria-label="Zoom out">
              <Minus className="size-4" />
            </button>
          </div>
          <div className="absolute right-3 bottom-3 flex gap-2">
            <button className="rounded-xl bg-white p-2 text-slate-600 shadow-soft ring-1 ring-slate-200 hover:bg-slate-50" aria-label="Layers">
              <Layers className="size-4" />
            </button>
            <button className="rounded-xl bg-white p-2 text-slate-600 shadow-soft ring-1 ring-slate-200 hover:bg-slate-50" aria-label="Recenter">
              <LocateFixed className="size-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function MapLegend({ items }: { items: { label: string; tone: keyof typeof toneMap }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <span className={cn("size-2.5 rounded-full", toneMap[i.tone].bg)} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
