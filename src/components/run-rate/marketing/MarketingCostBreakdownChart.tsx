"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatRpCompact } from "@/lib/format";
import type { MarketingResponse } from "@/lib/validators/run-rate";

type Props = Readonly<{ marketing: MarketingResponse }>;

const COLORS = ["#facc15", "#60a5fa", "#f472b6", "#34d399", "#fb923c", "#a78bfa"] as const;

const LABELS: Record<string, string> = {
  voucher: "Voucher",
  affiliate: "Affiliate",
  sample: "Sample",
  endorse: "Endorse",
  iklan: "Iklan / Ads",
  other: "Lainnya",
};

export const MarketingCostBreakdownChart = ({ marketing }: Props) => {
  const rows = Object.entries(marketing.byChannel)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));
  const total = rows.reduce((sum, r) => sum + r.value, 0);

  return (
    <BrutalCard title="Marketing Cost Breakdown">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={rows}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={85}
                paddingAngle={2}
              >
                {rows.map((row, index) => (
                  <Cell
                    key={row.name}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#171717"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatRpCompact(value),
                  LABELS[name] ?? name,
                ]}
                contentStyle={{ border: "2px solid #171717", borderRadius: 0, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom legend */}
        <div className="flex-1 w-full space-y-2">
          {rows.map((row, index) => {
            const pct = total > 0 ? (row.value / total) * 100 : 0;
            return (
              <div key={row.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-3 h-3 flex-shrink-0 border border-neutral-950"
                  style={{ background: COLORS[index % COLORS.length] }}
                />
                <span className="flex-1 font-medium">{LABELS[row.name] ?? row.name}</span>
                <span className="font-bold text-neutral-950">{formatRpCompact(row.value)}</span>
                <span className="text-neutral-400 w-12 text-right">{pct.toFixed(1)}%</span>
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="text-xs text-neutral-400 text-center py-4">Belum ada data marketing.</p>
          )}
        </div>
      </div>
    </BrutalCard>
  );
};
