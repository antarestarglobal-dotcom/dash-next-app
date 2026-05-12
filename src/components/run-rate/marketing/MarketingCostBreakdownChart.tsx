"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatRpCompact } from "@/lib/format";
import type { MarketingResponse } from "@/lib/validators/run-rate";

type Props = Readonly<{ marketing: MarketingResponse }>;

const COLORS = ["#facc15", "#60a5fa", "#f472b6", "#34d399", "#fb923c", "#a78bfa"] as const;

export const MarketingCostBreakdownChart = ({ marketing }: Props) => {
  const rows = Object.entries(marketing.byChannel).map(([name, value]) => ({ name, value }));
  return <BrutalCard title="Marketing Breakdown"><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={rows} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>{rows.map((row, index) => <Cell key={row.name} fill={COLORS[index % COLORS.length]} stroke="#171717" strokeWidth={2} />)}</Pie><Tooltip formatter={(value: number) => formatRpCompact(value)} /></PieChart></ResponsiveContainer></BrutalCard>;
};
