"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatRpCompact } from "@/lib/format";
import type { MoMMetric } from "@/lib/validators/run-rate";

type Props = Readonly<{ rows: readonly MoMMetric[] }>;

const MONTH_COLORS = ["#16a34a", "#2563eb", "#737373", "#dc2626", "#9333ea"] as const;

const buildChartRows = (
  rows: readonly MoMMetric[],
  months: readonly string[],
): Record<string, string | number>[] => {
  const days = [...new Set(rows.map((r) => r.dayOfMonth))].sort((a, b) => a - b);
  const lookup = new Map(rows.map((r) => [`${r.month}|${r.dayOfMonth}`, r.netSales]));
  return days.map((d) => ({
    day: `Hari ${d}`,
    ...Object.fromEntries(months.map((m) => [m, lookup.get(`${m}|${d}`) ?? null])),
  }));
};

export const MoMComparisonChart = ({ rows }: Props) => {
  const months = useMemo(
    () => [...new Set(rows.map((r) => r.month))].sort((a, b) => b.localeCompare(a)),
    [rows],
  );
  const data = useMemo(() => buildChartRows(rows, months), [rows, months]);

  if (rows.length === 0) {
    return (
      <BrutalCard title="MoM Net Sales Comparison">
        <p className="text-sm text-neutral-400 text-center py-12">Belum ada data.</p>
      </BrutalCard>
    );
  }

  return (
    <BrutalCard title="MoM Net Sales Comparison">
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "#737373" }}
            tickLine={false}
            axisLine={{ stroke: "#d4d4d4" }}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#737373" }}
            tickFormatter={(v: number) => formatRpCompact(v)}
            width={64}
          />
          <Tooltip
            contentStyle={{ border: "2px solid #171717", borderRadius: 0, fontSize: 11 }}
            formatter={(value: number, key) => [formatRpCompact(value), String(key)]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {/* Today marker for the most recent month — day-of-month of today */}
          <ReferenceLine
            x={`Hari ${new Date().getDate()}`}
            stroke="#171717"
            strokeDasharray="4 2"
            label={{ value: "Today", position: "top", fontSize: 9, fill: "#525252" }}
          />
          {months.map((m, i) => (
            <Line
              key={m}
              type="monotone"
              dataKey={m}
              stroke={MONTH_COLORS[i % MONTH_COLORS.length]}
              strokeWidth={i === 0 ? 2.5 : 1.5}
              dot={false}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </BrutalCard>
  );
};
