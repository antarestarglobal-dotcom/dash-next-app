"use client";

import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatPct, formatRpCompact } from "@/lib/format";
import type { MoMMetric } from "@/lib/validators/run-rate";

type Props = Readonly<{ rows: readonly MoMMetric[] }>;

export const MoMSummaryCards = ({ rows }: Props) => {
  const total = rows.reduce((sum, row) => sum + row.netSales, 0);
  const avgChance = rows.length === 0 ? 0 : rows.reduce((sum, row) => sum + row.chance, 0) / rows.length;
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><BrutalCard><p className="text-xs font-black uppercase">Net Sales Total</p><p className="text-3xl font-black">{formatRpCompact(total)}</p></BrutalCard><BrutalCard><p className="text-xs font-black uppercase">Avg Chance</p><p className="text-3xl font-black">{formatPct(avgChance)}</p></BrutalCard></div>;
};
