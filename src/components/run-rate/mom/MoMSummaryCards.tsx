"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { formatPct, formatRpCompact } from "@/lib/format";
import type { MoMMetric } from "@/lib/validators/run-rate";

type Props = Readonly<{ rows: readonly MoMMetric[] }>;

type MonthSummary = Readonly<{
  month: string;
  netSales: number;
  netProfit: number;
  avgNpm: number;
}>;

const buildSummaries = (rows: readonly MoMMetric[]): readonly MonthSummary[] => {
  const map = new Map<string, { netSales: number; netProfit: number; npmSum: number; count: number }>();
  for (const row of rows) {
    const acc = map.get(row.month) ?? { netSales: 0, netProfit: 0, npmSum: 0, count: 0 };
    acc.netSales += row.netSales;
    acc.netProfit += row.netProfit;
    acc.npmSum += row.npm;
    acc.count += 1;
    map.set(row.month, acc);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, acc]) => ({
      month,
      netSales: acc.netSales,
      netProfit: acc.netProfit,
      avgNpm: acc.count > 0 ? acc.npmSum / acc.count : 0,
    }));
};

const Delta = ({ value }: Readonly<{ value: number }>) => {
  const Icon = value >= 0 ? ArrowUp : ArrowDown;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-bold ${value >= 0 ? "text-green-700" : "text-red-700"}`}>
      <Icon className="w-3 h-3" />
      {formatPct(Math.abs(value), 1)}
    </span>
  );
};

export const MoMSummaryCards = ({ rows }: Props) => {
  const summaries = useMemo(() => buildSummaries(rows), [rows]);

  if (summaries.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-neutral-950 shadow-[4px_4px_0px_#171717] p-4 col-span-3 text-center text-sm text-neutral-400">
          Belum ada data.
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-${Math.min(summaries.length, 3)} gap-4`}>
      {summaries.map((s, idx) => {
        const prev = summaries[idx + 1];
        const delta = prev && prev.netSales > 0 ? ((s.netSales - prev.netSales) / prev.netSales) * 100 : null;
        return (
          <div key={s.month} className="bg-white border-2 border-neutral-950 shadow-[4px_4px_0px_#171717] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">{s.month}</p>
            <div className="flex items-end justify-between gap-2 mb-1">
              <p className="text-2xl font-black text-neutral-950">{formatRpCompact(s.netSales)}</p>
              {delta !== null && <Delta value={delta} />}
            </div>
            <p className="text-xs font-bold text-neutral-600">
              Net Sales · Profit {formatRpCompact(s.netProfit)} · NPM {formatPct(s.avgNpm, 1)}
            </p>
          </div>
        );
      })}
    </div>
  );
};
