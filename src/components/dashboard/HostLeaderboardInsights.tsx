"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HostLeaderboard, type HostRow } from "@/components/dashboard/HostLeaderboard";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatCurrency, formatNumber } from "@/lib/utils";

type Props = Readonly<{ data: HostRow[] }>;

export function HostLeaderboardInsights({ data }: Props) {
  const [topScope, setTopScope] = useState<10 | 20>(10);
  const [mode, setMode] = useState<"gmv" | "share">("gmv");

  const normalized = useMemo(
    () =>
      data
        .map((row) => ({
          ...row,
          total: row.totalGmv ?? 0,
        }))
        .sort((a, b) => b.total - a.total),
    [data],
  );

  const totalGmv = normalized.reduce((sum, row) => sum + row.total, 0);
  const topHost = normalized[0] ?? null;
  const topHostShare = topHost && totalGmv > 0 ? (topHost.total / totalGmv) * 100 : 0;
  const topFiveShare =
    totalGmv > 0
      ? (normalized.slice(0, 5).reduce((sum, row) => sum + row.total, 0) / totalGmv) * 100
      : 0;
  const avgPerHost = normalized.length > 0 ? totalGmv / normalized.length : 0;

  const scopedRows = normalized.slice(0, topScope);
  const chartData = scopedRows.map((row) => {
    const share = totalGmv > 0 ? (row.total / totalGmv) * 100 : 0;
    return {
      host: row.hostName,
      total: row.total,
      share,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricTile label="Top Host" value={topHost?.hostName ?? "-"} sub={formatCurrency(topHost?.total)} />
        <MetricTile label="Kontribusi Top Host" value={`${topHostShare.toFixed(2)}%`} sub="dari total GMV host" />
        <MetricTile label="Kontribusi Top 5" value={`${topFiveShare.toFixed(2)}%`} sub="konsentrasi performa" />
        <MetricTile
          label="Rata-rata per Host"
          value={formatCurrency(avgPerHost)}
          sub={`${formatNumber(normalized.length)} host`}
        />
      </div>

      <BrutalCard title={`Distribusi GMV Host (Top ${topScope})`}>
        <div className="flex flex-wrap gap-2 mb-4">
          <BrutalButton
            size="sm"
            variant={topScope === 10 ? "primary" : "secondary"}
            onClick={() => setTopScope(10)}
          >
            Top 10
          </BrutalButton>
          <BrutalButton
            size="sm"
            variant={topScope === 20 ? "primary" : "secondary"}
            onClick={() => setTopScope(20)}
          >
            Top 20
          </BrutalButton>
          <BrutalButton
            size="sm"
            variant={mode === "gmv" ? "primary" : "secondary"}
            onClick={() => setMode("gmv")}
          >
            GMV
          </BrutalButton>
          <BrutalButton
            size="sm"
            variant={mode === "share" ? "primary" : "secondary"}
            onClick={() => setMode("share")}
          >
            % Share
          </BrutalButton>
        </div>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: 24, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="host"
              interval={0}
              angle={-30}
              textAnchor="end"
              height={90}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              tickFormatter={(v: number) =>
                mode === "gmv" ? `${(v / 1_000_000).toFixed(0)}jt` : `${v.toFixed(1)}%`
              }
              width={48}
            />
            <Tooltip
              formatter={(value: number) =>
                mode === "gmv"
                  ? [formatCurrency(value), "Total GMV"]
                  : [`${value.toFixed(2)}%`, "Share GMV"]
              }
              contentStyle={{
                border: "2px solid #171717",
                borderRadius: 0,
                boxShadow: "3px 3px 0px #171717",
              }}
            />
            <Bar dataKey={mode === "gmv" ? "total" : "share"} fill="#171717" />
          </BarChart>
        </ResponsiveContainer>
      </BrutalCard>

      <HostLeaderboard data={normalized} pageSize={20} />
    </div>
  );
}

function MetricTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border-2 border-neutral-950 shadow-[3px_3px_0px_#171717] p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</p>
      <p className="text-lg font-black text-neutral-950 mt-1 leading-tight">{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}
