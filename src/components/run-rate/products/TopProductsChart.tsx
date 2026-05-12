"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatRpCompact } from "@/lib/format";
import type { ProductMetric } from "@/lib/validators/run-rate";

type Props = Readonly<{ products: readonly ProductMetric[] }>;

export const TopProductsChart = ({ products }: Props) => (
  <BrutalCard title="Top Products">
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={products.slice(0, 20)} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis type="number" tickFormatter={(value: number) => formatRpCompact(value)} />
        <YAxis dataKey="productName" type="category" width={120} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(value: number) => formatRpCompact(value)} />
        <Bar dataKey="netSales" fill="#60a5fa" stroke="#171717" strokeWidth={1} />
      </BarChart>
    </ResponsiveContainer>
  </BrutalCard>
);
