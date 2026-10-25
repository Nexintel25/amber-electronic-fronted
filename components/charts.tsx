"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Validated categorical order (dataviz reference palette, light mode). */
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

const axis = { fontSize: 12, fill: "#64748b" };
const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    boxShadow: "0 12px 32px -12px rgb(15 28 56 / .25)",
    fontSize: 12,
    padding: "8px 12px",
  },
  labelStyle: { fontWeight: 700, color: "#0f172a", marginBottom: 4 },
  itemStyle: { color: "#334155", padding: 0 },
};

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <span className="size-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function NoData({ height, noApi }: { height: number; noApi?: boolean }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400" style={{ height }}>
      {noApi ? "API not available" : "No data found"}
    </div>
  );
}

export function TrendArea({
  data,
  xKey,
  series,
  height = 260,
  noApi,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; label: string; color: string }[];
  height?: number;
  noApi?: boolean;
}) {
  if (!data.length) return <NoData height={height} noApi={noApi} />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="#eef2f6" />
          <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={axis} tickLine={false} axisLine={false} />
          <Tooltip {...tooltipStyle} cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#g-${s.key})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Bars({
  data,
  xKey,
  series,
  height = 260,
  layout = "horizontal",
  unit,
  noApi,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; label: string; color: string }[];
  height?: number;
  layout?: "horizontal" | "vertical";
  unit?: string;
  noApi?: boolean;
}) {
  if (!data.length) return <NoData height={height} noApi={noApi} />;
  const vertical = layout === "vertical";
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={vertical ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 12, left: vertical ? 8 : -18, bottom: 0 }}
          barGap={2}
          barCategoryGap={vertical ? 10 : "28%"}
        >
          <CartesianGrid vertical={vertical} horizontal={!vertical} stroke="#eef2f6" />
          {vertical ? (
            <>
              <XAxis type="number" tick={axis} tickLine={false} axisLine={false} unit={unit} />
              <YAxis type="category" dataKey={xKey} tick={axis} tickLine={false} axisLine={false} width={92} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={false} />
              <YAxis tick={axis} tickLine={false} axisLine={false} unit={unit} />
            </>
          )}
          <Tooltip {...tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={28} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({
  data,
  height = 220,
  centerLabel,
  centerValue,
  colors = SERIES,
  noApi,
}: {
  data: { name: string; value: number }[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  colors?: string[];
  noApi?: boolean;
}) {
  if (!data.length) return <NoData height={height} noApi={noApi} />;
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip {...tooltipStyle} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%" paddingAngle={1.5} stroke="#fff" strokeWidth={2}>
            {data.map((d, i) => (
              <Cell key={d.name} fill={colors[i % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{centerValue}</p>
            <p className="text-xs text-slate-500">{centerLabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}
