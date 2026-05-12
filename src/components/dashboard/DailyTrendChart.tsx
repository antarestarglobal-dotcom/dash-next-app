"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatCurrency } from "@/lib/utils";

interface DailyMetricRow {
  date: string;
  total: number | null;
}

interface DailyTrendChartProps {
  data: DailyMetricRow[];
}

export function DailyTrendChart({ data }: DailyTrendChartProps) {
  const chartData = data.map((row) => ({
    date: row.date,
    total: row.total ?? 0,
  }));

  return (
    <BrutalCard title="Daily Trend">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#525252" }}
            tickLine={false}
            axisLine={{ stroke: "#171717" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#525252" }}
            tickLine={false}
            axisLine={{ stroke: "#171717" }}
            tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}jt`}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), "Net Sales"]}
            contentStyle={{
              border: "2px solid #171717",
              borderRadius: "0px",
              fontSize: 12,
              fontWeight: 500,
              boxShadow: "3px 3px 0px #171717",
            }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#171717"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#171717" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </BrutalCard>
  );
}
