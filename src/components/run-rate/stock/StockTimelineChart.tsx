"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import type { StockStatus } from "@/lib/validators/run-rate";

type Props = Readonly<{ stocks: readonly StockStatus[] }>;

const barColor = (days: number): string => {
  if (days < 7) return "#dc2626";
  if (days <= 14) return "#f97316";
  if (days <= 30) return "#eab308";
  return "#16a34a";
};

export const StockTimelineChart = ({ stocks }: Props) => {
  const rows = useMemo(
    () =>
      [...stocks]
        .filter((s) => s.limit0Days !== null)
        .sort((a, b) => (a.limit0Days ?? 0) - (b.limit0Days ?? 0))
        .slice(0, 30)
        .map((s) => ({ sku: s.sku, days: s.limit0Days ?? 0, productName: s.productName })),
    [stocks],
  );

  if (rows.length === 0) {
    return (
      <BrutalCard title="Sisa Stok per SKU (top 30 paling kritis)">
        <p className="text-sm text-neutral-400 text-center py-12">Belum ada data stok.</p>
      </BrutalCard>
    );
  }

  return (
    <BrutalCard title="Sisa Stok per SKU (top 30 paling kritis)">
      <ResponsiveContainer width="100%" height={Math.max(280, rows.length * 22)}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 48, bottom: 0, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#737373" }}
            tickLine={false}
            axisLine={{ stroke: "#d4d4d4" }}
            label={{ value: "Hari", position: "insideRight", offset: 8, fontSize: 10, fill: "#737373" }}
          />
          <YAxis
            dataKey="sku"
            type="category"
            width={110}
            tick={{ fontSize: 9, fill: "#525252" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ border: "2px solid #171717", borderRadius: 0, fontSize: 11 }}
            formatter={(value: number, _key, entry) => [
              `${value} hari`,
              (entry.payload as { productName: string }).productName,
            ]}
          />
          <ReferenceLine x={7} stroke="#dc2626" strokeDasharray="4 3" label={{ value: "7h", fontSize: 9, fill: "#dc2626" }} />
          <ReferenceLine x={30} stroke="#eab308" strokeDasharray="4 3" label={{ value: "30h", fontSize: 9, fill: "#854d0e" }} />
          <Bar dataKey="days" radius={0} stroke="#171717" strokeWidth={1}>
            {rows.map((r) => (
              <Cell key={r.sku} fill={barColor(r.days)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </BrutalCard>
  );
};
