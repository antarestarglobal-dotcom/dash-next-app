"use client";

import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatPct, formatRpCompact } from "@/lib/format";
import type { TargetProgressResponse } from "@/lib/validators/run-rate";

type Props = Readonly<{ targets: TargetProgressResponse }>;

const Row = ({ label, target, aktual, progress }: Readonly<{ label: string; target: number; aktual: number; progress: number }>) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-bold"><span>{label}</span><span>{formatRpCompact(aktual)} / {formatRpCompact(target)}</span></div>
    <div className="h-4 border-2 border-neutral-950 bg-white"><div className="h-full bg-green-400" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
    <p className="text-xs text-neutral-500">Progress {formatPct(progress)}</p>
  </div>
);

export const TargetProgressCard = ({ targets }: Props) => (
  <BrutalCard title="Target Progress">
    <div className="space-y-4">
      <Row label="Net Sales" target={targets.netSales.target} aktual={targets.netSales.aktual} progress={targets.netSales.progress ?? 0} />
      <Row label="Marketing Cost" target={targets.marketingCost.target} aktual={targets.marketingCost.aktual} progress={targets.marketingCost.efficiency ?? 0} />
      <Row label="Net Profit" target={targets.netProfit.target} aktual={targets.netProfit.aktual} progress={targets.netProfit.progress ?? 0} />
    </div>
  </BrutalCard>
);
