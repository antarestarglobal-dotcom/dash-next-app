"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import type { StockStatus } from "@/lib/validators/run-rate";

type Props = Readonly<{ stocks: readonly StockStatus[] }>;

export const StockTimelineChart = ({ stocks }: Props) => (
  <BrutalCard title="Stock Timeline">
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={stocks.slice(0, 30).map((stock) => ({ ...stock, days: stock.limit0Days ?? 0 }))} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis type="number" />
        <YAxis dataKey="sku" type="category" width={120} tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="days" fill="#fb923c" stroke="#171717" />
      </BarChart>
    </ResponsiveContainer>
  </BrutalCard>
);
