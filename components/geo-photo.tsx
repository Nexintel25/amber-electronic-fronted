import { Clock, MapPin, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const scenes = ["panel", "cable", "light", "motor"] as const;

/**
 * Placeholder for a GPS-tagged, timestamped field photo. Renders a stylised
 * scene with the same watermark overlay the mobile app burns into real photos.
 */
export function GeoPhoto({
  kind,
  seed = 0,
  lat = 28.6273,
  lng = 77.3725,
  time = "24 Sep 2026 · 10:42 AM",
  className,
  compact,
  verified = true,
}: {
  kind: "before" | "after" | "media";
  seed?: number;
  lat?: number;
  lng?: number;
  time?: string;
  className?: string;
  compact?: boolean;
  verified?: boolean;
}) {
  const scene = scenes[seed % scenes.length];
  const after = kind === "after";
  const bg = after
    ? ["from-slate-600 to-slate-800", "from-zinc-500 to-zinc-700", "from-slate-500 to-slate-700", "from-stone-500 to-stone-700"][seed % 4]
    : ["from-stone-700 to-stone-900", "from-zinc-700 to-neutral-900", "from-slate-700 to-slate-900", "from-neutral-600 to-stone-800"][seed % 4];

  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br", bg, className)}>
      <svg viewBox="0 0 160 120" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
        {scene === "panel" && (
          <g>
            <rect x="42" y="14" width="76" height="92" rx="3" fill="#cbd5e1" opacity=".85" />
            <rect x="48" y="20" width="64" height="80" rx="2" fill="#94a3b8" />
            {[0, 1, 2, 3].map((r) => (
              <g key={r}>
                {[0, 1, 2, 3, 4].map((c) => (
                  <rect key={c} x={52 + c * 11.5} y={26 + r * 18} width="8" height="13" rx="1" fill={after ? "#e2e8f0" : r === 1 && c === 2 ? "#1c1917" : "#e2e8f0"} />
                ))}
              </g>
            ))}
            {!after && <ellipse cx="80" cy="50" rx="12" ry="8" fill="#0c0a09" opacity=".55" />}
            <circle cx="104" cy="94" r="2.5" fill={after ? "#22c55e" : "#ef4444"} />
          </g>
        )}
        {scene === "cable" && (
          <g>
            <rect x="0" y="40" width="160" height="14" fill="#64748b" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path key={i} d={`M0 ${58 + i * 7} C 50 ${52 + i * 7}, 110 ${66 + i * 7}, 160 ${58 + i * 7}`} stroke={["#f97316", "#1e293b", "#dc2626", "#eab308", "#2563eb", "#16a34a"][i]} strokeWidth="4" fill="none" />
            ))}
            {!after ? <rect x="70" y="60" width="18" height="30" rx="3" fill="#d6d3d1" opacity=".5" /> : <rect x="68" y="58" width="22" height="36" rx="4" fill="#111827" />}
          </g>
        )}
        {scene === "light" && (
          <g>
            <rect x="0" y="0" width="160" height="20" fill="#475569" />
            {[30, 80, 130].map((x, i) => (
              <g key={x}>
                <line x1={x} y1="20" x2={x} y2="34" stroke="#94a3b8" strokeWidth="2" />
                <path d={`M${x - 16} 34 h32 l-6 10 h-20 z`} fill="#cbd5e1" />
                <ellipse cx={x} cy="46" rx="10" ry="3" fill={after || i !== 1 ? "#fef08a" : "#57534e"} opacity={after || i !== 1 ? 0.95 : 0.6} />
                {(after || i !== 1) && <path d={`M${x - 10} 46 L${x - 28} 120 L${x + 28} 120 L${x + 10} 46 z`} fill="#fef9c3" opacity=".12" />}
              </g>
            ))}
          </g>
        )}
        {scene === "motor" && (
          <g>
            <rect x="30" y="50" width="80" height="42" rx="8" fill="#1d4ed8" opacity=".75" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <rect key={i} x={36 + i * 10} y="46" width="4" height="50" rx="2" fill="#1e40af" />
            ))}
            <rect x="110" y="64" width="26" height="14" rx="3" fill="#94a3b8" />
            <rect x="50" y="34" width="30" height="16" rx="2" fill="#cbd5e1" />
            {!after && <circle cx="64" cy="42" r="7" fill="#ea580c" opacity=".5" />}
          </g>
        )}
      </svg>

      <span
        className={cn(
          "absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase shadow",
          kind === "before" ? "bg-rose-500" : kind === "after" ? "bg-emerald-500" : "bg-navy-700",
        )}
      >
        {kind === "media" ? "Attachment" : kind}
      </span>
      {verified && kind !== "media" && (
        <span className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-white/90 text-emerald-600 shadow">
          <ShieldCheck className="size-3" />
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2 pt-6 pb-1.5 font-mono text-white/95">
        <div className={cn("flex items-center gap-1", compact ? "text-[8px]" : "text-[10px]")}>
          <MapPin className="size-2.5 shrink-0 text-brand-300" />
          {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
        </div>
        {!compact && (
          <div className="flex items-center gap-1 text-[10px] text-white/80">
            <Clock className="size-2.5 shrink-0 text-brand-300" />
            {time}
          </div>
        )}
      </div>
    </div>
  );
}
