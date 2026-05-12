"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatRpCompact } from "@/lib/format";
import type { DailyMetric } from "@/lib/validators/run-rate";

type Props = Readonly<{ data: readonly DailyMetric[] }>;

const NAMES: Record<string, string> = {
  netSales: "Net Sales",
  netProfit: "Net Profit",
};

export const DailyNetSalesChart = ({ data }: Props) => (
  <BrutalCard title="Daily Net Sales vs Net Profit">
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data.map((row) => ({ ...row, day: row.date.slice(-2) }))}>
        <defs>
          <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="#e5e5e5" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v: number) => formatRpCompact(v)} tick={{ fontSize: 11 }} width={64} />
        <Tooltip
          formatter={(value: number, name: string) => [formatRpCompact(value), NAMES[name] ?? name]}
          contentStyle={{ border: "2px solid #171717", borderRadius: 0, fontSize: 12 }}
        />
        <Legend
          formatter={(value: string) => NAMES[value] ?? value}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Area
          type="monotone"
          dataKey="netSales"
          stroke="#16a34a"
          strokeWidth={2.5}
          fill="url(#gradSales)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="netProfit"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#gradProfit)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  </BrutalCard>
);
