"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatRpCompact } from "@/lib/format";
import type { MarketingResponse } from "@/lib/validators/run-rate";

type Props = Readonly<{ marketing: MarketingResponse }>;
type Channel = keyof MarketingResponse["byChannel"];

const CHANNELS: readonly Channel[] = ["voucher", "affiliate", "sample", "endorse", "iklan", "other"];
const EFFICIENCY_LIMIT = 20 as const;

const buildRows = (marketing: MarketingResponse): Record<string, string | number>[] =>
  [...new Set(marketing.daily.map((row) => row.date))].sort().map((date) => ({
    day: date.slice(-2),
    ratioLimit: EFFICIENCY_LIMIT,
    ...Object.fromEntries(
      CHANNELS.map((channel) => [
        channel,
        marketing.daily
          .filter((row) => row.date === date && row.variable === channel)
          .reduce((sum, row) => sum + row.totalCost, 0),
      ]),
    ),
  }));

export const MarketingEfficiencyChart = ({ marketing }: Props) => (
  <BrutalCard title="Marketing Efficiency">
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={buildRows(marketing)}>
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis dataKey="day" />
        <YAxis tickFormatter={(value: number) => formatRpCompact(value)} />
        <Tooltip formatter={(value: number) => formatRpCompact(value)} />
        {CHANNELS.map((channel) => (
          <Bar key={channel} dataKey={channel} stackId="marketing" fill="#facc15" stroke="#171717" />
        ))}
        <Line dataKey="ratioLimit" stroke="#dc2626" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  </BrutalCard>
);
