"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatRpCompact } from "@/lib/format";

type Props = Readonly<{ rows: readonly { name: string; netSales: number }[] }>;

const COLORS = ["#34d399", "#60a5fa", "#facc15", "#fb7185", "#a78bfa"] as const;

export const PlatformContributionChart = ({ rows }: Props) => (
  <BrutalCard title="Platform Contribution">
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={[...rows]} dataKey="netSales" nameKey="name" innerRadius={60} outerRadius={100}>
          {rows.map((row, index) => <Cell key={row.name} fill={COLORS[index % COLORS.length]} stroke="#171717" strokeWidth={2} />)}
        </Pie>
        <Tooltip formatter={(value: number) => formatRpCompact(value)} />
      </PieChart>
    </ResponsiveContainer>
  </BrutalCard>
);
