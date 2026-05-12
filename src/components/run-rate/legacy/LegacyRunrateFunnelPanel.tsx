"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatPct, formatRpCompact } from "@/lib/format";
import type { LegacyFunnelResponse, LegacyRunrateResponse } from "@/lib/validators/run-rate";

type PartialProps = Readonly<{ runrate?: LegacyRunrateResponse; funnel?: LegacyFunnelResponse }>;

export const LegacyRunrateFunnelPanel = ({ runrate, funnel }: PartialProps) => {
  const topProduct = runrate?.products[0] ?? null;
  const chartData =
    funnel?.funnelProduk.slice(0, 10).map((item) => ({
      name: item.name,
      orders: item.orders,
      cr: item.cr,
    })) ?? [];

  if (!runrate && !funnel) return null;

  return (
    <BrutalCard title="Global Legacy Snapshot">
      {runrate ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
          <StatTile label="Periode" value={runrate.month} />
          <StatTile label="Progress" value={formatPct(runrate.progress, 2)} />
          <StatTile
            label="Top Product"
            value={topProduct?.name ?? "-"}
            sub={topProduct ? `${formatRpCompact(topProduct.gross)} gross` : undefined}
          />
        </div>
      ) : (
        <p className="text-sm font-bold text-neutral-500 mb-4">Data runrate legacy belum tersedia.</p>
      )}

      {funnel && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 56, left: 8 }}>
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis
              dataKey="name"
              interval={0}
              angle={-35}
              textAnchor="end"
              height={84}
              tick={{ fontSize: 10 }}
            />
            <YAxis yAxisId="left" width={42} />
            <YAxis
              yAxisId="right"
              orientation="right"
              width={44}
              tickFormatter={(value: number) => formatPct(value, 0)}
            />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === "cr" ? [formatPct(value), "CR"] : [value, "Orders"]
              }
            />
            <Bar yAxisId="left" dataKey="orders" fill="#60a5fa" stroke="#171717" strokeWidth={1} />
            <Line yAxisId="right" dataKey="cr" stroke="#171717" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm font-bold text-neutral-500">Data funnel legacy belum tersedia.</p>
      )}
    </BrutalCard>
  );
};

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-2 border-neutral-950 p-3 bg-white">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">{label}</p>
      <p className="text-sm font-black text-neutral-950 line-clamp-2">{value}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </div>
  );
}
