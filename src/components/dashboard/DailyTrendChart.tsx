"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatCurrency } from "@/lib/utils";

interface DailyMetricRow {
  date: string;
  dayName: string | null;
  total: string | null;
  contributionPercent: string | null;
}

type ChartTab = "trend" | "contribution" | "weekday";

const TABS: { key: ChartTab; label: string }[] = [
  { key: "trend", label: "Net Sales" },
  { key: "contribution", label: "Kontribusi %" },
  { key: "weekday", label: "Per Hari" },
];

const DAY_ORDER_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const DAY_ORDER_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function dayIndex(name: string): number {
  const i = DAY_ORDER_ID.indexOf(name);
  if (i >= 0) return i;
  const j = DAY_ORDER_EN.indexOf(name);
  return j >= 0 ? j : 99;
}

const TOOLTIP_STYLE = {
  border: "2px solid #171717",
  borderRadius: 0,
  fontSize: 12,
  fontWeight: 600,
  boxShadow: "3px 3px 0px #171717",
  background: "#fff",
  padding: "8px 12px",
};

const AXIS_TICK = { fontSize: 11, fill: "#737373" };

interface DailyTrendChartProps {
  data: DailyMetricRow[];
}

export function DailyTrendChart({ data }: DailyTrendChartProps) {
  const [activeTab, setActiveTab] = useState<ChartTab>("trend");

  // ── Trend data ────────────────────────────────────────────────────────────
  const trendData = useMemo(
    () =>
      data.map((r) => ({
        date: r.date.slice(5), // MM-DD
        total: r.total ? parseFloat(r.total) : 0,
      })),
    [data],
  );

  const avgTotal = useMemo(
    () =>
      trendData.length ? trendData.reduce((s, r) => s + r.total, 0) / trendData.length : 0,
    [trendData],
  );

  // ── Contribution % data ───────────────────────────────────────────────────
  const contribData = useMemo(
    () =>
      data
        .filter((r) => r.contributionPercent !== null)
        .map((r) => ({
          date: r.date.slice(5),
          pct: r.contributionPercent ? parseFloat(r.contributionPercent) : 0,
        })),
    [data],
  );

  const avgPct = useMemo(
    () =>
      contribData.length
        ? contribData.reduce((s, r) => s + r.pct, 0) / contribData.length
        : 0,
    [contribData],
  );

  // ── Weekday average data ──────────────────────────────────────────────────
  const weekdayData = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const r of data) {
      if (!r.dayName || !r.total) continue;
      const e = map.get(r.dayName) ?? { sum: 0, count: 0 };
      e.sum += parseFloat(r.total);
      e.count += 1;
      map.set(r.dayName, e);
    }
    return [...map.keys()]
      .sort((a, b) => dayIndex(a) - dayIndex(b))
      .map((day) => {
        const e = map.get(day)!;
        return { day, avg: e.sum / e.count };
      });
  }, [data]);

  const maxWeekdayAvg = useMemo(
    () => Math.max(...weekdayData.map((d) => d.avg), 0),
    [weekdayData],
  );

  if (data.length === 0) {
    return (
      <BrutalCard title="Tren Harian">
        <p className="text-sm text-neutral-400 text-center py-20">Belum ada data</p>
      </BrutalCard>
    );
  }

  return (
    <BrutalCard
      title="Tren Harian"
      headerAction={
        <div className="flex">
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                "px-4 py-1.5 text-xs font-bold uppercase tracking-wide border-2 border-neutral-950 transition-colors",
                i > 0 ? "-ml-[2px]" : "",
                activeTab === tab.key
                  ? "bg-neutral-950 text-white"
                  : "bg-white text-neutral-600 hover:bg-stone-100",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
    >
      {/* ── Stat strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 divide-x divide-neutral-100 bg-stone-50 border-b border-neutral-200 -mx-5 -mt-5 mb-5">
        {activeTab === "trend" && (
          <>
            <StatCell label="Total Periode" value={formatCurrency(trendData.reduce((s, r) => s + r.total, 0))} />
            <StatCell label="Rata-rata Harian" value={formatCurrency(avgTotal)} />
            <StatCell label="Hari Terbaik" value={formatCurrency(Math.max(...trendData.map((r) => r.total)))} />
          </>
        )}
        {activeTab === "contribution" && (
          <>
            <StatCell label="Total Hari" value={`${contribData.length} hari`} />
            <StatCell label="Rata-rata Kontribusi" value={`${avgPct.toFixed(2)}%`} />
            <StatCell label="Kontribusi Tertinggi" value={`${Math.max(...contribData.map((r) => r.pct), 0).toFixed(2)}%`} />
          </>
        )}
        {activeTab === "weekday" && (
          <>
            <StatCell label="Hari Terbaik" value={weekdayData[0]?.day ?? "—"} />
            <StatCell label="Rata-rata Tertinggi" value={formatCurrency(maxWeekdayAvg)} />
            <StatCell label="Hari Dianalisis" value={`${weekdayData.length} hari`} />
          </>
        )}
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      {activeTab === "trend" && (
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={trendData} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#171717" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#171717" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="date"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "#d4d4d4" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}jt`}
              width={44}
            />
            <ReferenceLine
              y={avgTotal}
              stroke="#a3a3a3"
              strokeDasharray="5 3"
              label={{
                value: "avg",
                position: "insideTopRight",
                fontSize: 10,
                fill: "#a3a3a3",
              }}
            />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), "Net Sales"]}
              contentStyle={TOOLTIP_STYLE}
              cursor={{ stroke: "#171717", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#171717"
              strokeWidth={2}
              fill="url(#gradTotal)"
              dot={false}
              activeDot={{ r: 5, fill: "#171717", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {activeTab === "contribution" && (
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={contribData} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="date"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "#d4d4d4" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v.toFixed(1)}%`}
              width={44}
            />
            <ReferenceLine
              y={avgPct}
              stroke="#a3a3a3"
              strokeDasharray="5 3"
              label={{
                value: "avg",
                position: "insideTopRight",
                fontSize: 10,
                fill: "#a3a3a3",
              }}
            />
            <Tooltip
              formatter={(v: number) => [`${v.toFixed(2)}%`, "Kontribusi"]}
              contentStyle={TOOLTIP_STYLE}
              cursor={{ stroke: "#171717", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <Line
              type="monotone"
              dataKey="pct"
              stroke="#171717"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#171717", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {activeTab === "weekday" && (
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={weekdayData} margin={{ top: 16, right: 16, bottom: 0, left: 0 }} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis
              dataKey="day"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "#d4d4d4" }}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}jt`}
              width={44}
            />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), "Rata-rata"]}
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "#f5f5f5" }}
            />
            <Bar dataKey="avg" stroke="#171717" strokeWidth={2} radius={0}>
              {weekdayData.map((entry, index) => (
                <Cell
                  key={entry.day}
                  fill={entry.avg === maxWeekdayAvg ? "#171717" : "#e5e5e5"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </BrutalCard>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5 truncate">
        {label}
      </p>
      <p className="text-sm font-black text-neutral-950 truncate">{value}</p>
    </div>
  );
}
