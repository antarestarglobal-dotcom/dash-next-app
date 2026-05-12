"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatRpCompact } from "@/lib/format";
import type { MarketingResponse } from "@/lib/validators/run-rate";

type Props = Readonly<{ marketing: MarketingResponse }>;
type Channel = keyof MarketingResponse["byChannel"];

const CHANNELS: readonly Channel[] = ["voucher", "affiliate", "sample", "endorse", "iklan", "other"];
const COLORS: Readonly<Record<Channel, string>> = {
  voucher: "#facc15",
  affiliate: "#60a5fa",
  sample: "#f472b6",
  endorse: "#34d399",
  iklan: "#fb923c",
  other: "#a78bfa",
};

const buildStackedRows = (marketing: MarketingResponse): Record<string, string | number>[] => {
  const dates = [...new Set(marketing.daily.map((row) => row.date))].sort();
  return dates.map((date) => ({
    date,
    day: date.slice(-2),
    ...Object.fromEntries(
      CHANNELS.map((channel) => [
        channel,
        marketing.daily
          .filter((row) => row.date === date && row.variable === channel)
          .reduce((sum, row) => sum + row.totalCost, 0),
      ]),
    ),
  }));
};

export const MarketingRatioChart = ({ marketing }: Props) => {
  const chartRows = buildStackedRows(marketing);
  return (
    <BrutalCard title="Marketing Cost Harian">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartRows}>
          <CartesianGrid strokeDasharray="4 4" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(value: number) => formatRpCompact(value)} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => formatRpCompact(value)} />
          {CHANNELS.map((channel) => (
            <Bar key={channel} dataKey={channel} stackId="marketing" fill={COLORS[channel]} stroke="#171717" strokeWidth={1} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </BrutalCard>
  );
};
