"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatRpCompact } from "@/lib/format";
import type { MoMMetric } from "@/lib/validators/run-rate";

type Props = Readonly<{ rows: readonly MoMMetric[] }>;
const COLORS = ["#16a34a", "#2563eb", "#737373"] as const;

const buildChartRows = (rows: readonly MoMMetric[]): Record<string, string | number>[] => {
  const days = [...new Set(rows.map((row) => row.dayOfMonth))].sort((left, right) => left - right);
  const months = [...new Set(rows.map((row) => row.month))];
  return days.map((dayOfMonth) => ({
    dayOfMonth,
    ...Object.fromEntries(
      months.map((month) => [
        month,
        rows.find((row) => row.dayOfMonth === dayOfMonth && row.month === month)?.netSales ?? 0,
      ]),
    ),
  }));
};

export const MoMComparisonChart = ({ rows }: Props) => {
  const months = [...new Set(rows.map((row) => row.month))];
  return (
    <BrutalCard title="MoM Net Sales">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={buildChartRows(rows)}>
          <CartesianGrid strokeDasharray="4 4" />
          <XAxis dataKey="dayOfMonth" />
          <YAxis tickFormatter={(value: number) => formatRpCompact(value)} />
          <Tooltip formatter={(value: number) => formatRpCompact(value)} />
          {months.map((month, index) => (
            <Line key={month} type="monotone" dataKey={month} stroke={COLORS[index % COLORS.length]} strokeWidth={3} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </BrutalCard>
  );
};
