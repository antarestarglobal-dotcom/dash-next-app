"use client";

import { Area, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatRpCompact } from "@/lib/format";
import type { DailyMetric } from "@/lib/validators/run-rate";

type Props = Readonly<{ data: readonly DailyMetric[] }>;

export const DailyNetSalesChart = ({ data }: Props) => (
  <BrutalCard title="Daily Net Sales">
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data.map((row) => ({ ...row, day: row.date.slice(-2) }))}>
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(value: number) => formatRpCompact(value)} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value: number) => formatRpCompact(value)} />
        <Area type="monotone" dataKey="netSales" fill="#86efac" stroke="#16a34a" fillOpacity={0.25} />
        <Line type="monotone" dataKey="netSales" stroke="#16a34a" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="netProfit" stroke="#2563eb" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </BrutalCard>
);
