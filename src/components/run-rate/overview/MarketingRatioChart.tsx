"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
const LABELS: Readonly<Record<Channel, string>> = {
  voucher: "Voucher",
  affiliate: "Affiliate",
  sample: "Sample",
  endorse: "Endorse",
  iklan: "Iklan",
  other: "Lainnya",
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
          <CartesianGrid strokeDasharray="4 4" stroke="#e5e5e5" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v: number) => formatRpCompact(v)}
            tick={{ fontSize: 11 }}
            width={60}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatRpCompact(value),
              LABELS[name as Channel] ?? name,
            ]}
            contentStyle={{ border: "2px solid #171717", borderRadius: 0, fontSize: 12 }}
          />
          <Legend
            formatter={(value: string) => LABELS[value as Channel] ?? value}
            wrapperStyle={{ fontSize: 11 }}
          />
          {CHANNELS.map((channel) => (
            <Bar
              key={channel}
              dataKey={channel}
              stackId="marketing"
              fill={COLORS[channel]}
              stroke="#171717"
              strokeWidth={1}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </BrutalCard>
  );
};
