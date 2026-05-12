"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatRpCompact } from "@/lib/format";

type Props = Readonly<{ rows: readonly { name: string; netSales: number }[] }>;

const COLORS = ["#34d399", "#60a5fa", "#facc15", "#fb7185", "#a78bfa", "#fb923c"] as const;

export const PlatformContributionChart = ({ rows }: Props) => {
  const total = rows.reduce((sum, r) => sum + r.netSales, 0);

  return (
    <BrutalCard title="Kontribusi Platform / Toko">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[...rows]}
                dataKey="netSales"
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
                formatter={(value: number) => [formatRpCompact(value), "Net Sales"]}
                contentStyle={{ border: "2px solid #171717", borderRadius: 0, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom legend */}
        <div className="flex-1 w-full space-y-2">
          {rows.map((row, index) => {
            const pct = total > 0 ? (row.netSales / total) * 100 : 0;
            return (
              <div key={row.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-3 h-3 flex-shrink-0 border border-neutral-950"
                  style={{ background: COLORS[index % COLORS.length] }}
                />
                <span className="flex-1 font-medium truncate" title={row.name}>
                  {row.name}
                </span>
                <span className="font-bold text-neutral-950">{formatRpCompact(row.netSales)}</span>
                <span className="text-neutral-400 w-12 text-right">{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </BrutalCard>
  );
};
