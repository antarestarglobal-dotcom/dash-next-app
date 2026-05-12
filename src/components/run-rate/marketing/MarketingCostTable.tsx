"use client";

import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatRpCompact } from "@/lib/format";
import type { MarketingResponse } from "@/lib/validators/run-rate";

type Props = Readonly<{ marketing: MarketingResponse }>;

export const MarketingCostTable = ({ marketing }: Props) => (
  <BrutalCard title="Marketing Cost Detail">
    <table className="w-full text-sm"><thead><tr><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Channel</th><th className="p-2 text-left">Cost</th></tr></thead><tbody>{marketing.daily.map((row) => <tr key={`${row.date}-${row.variable}`} className="border-t"><td className="p-2">{row.date}</td><td className="p-2 font-bold">{row.variable}</td><td className="p-2">{formatRpCompact(row.totalCost)}</td></tr>)}</tbody></table>
  </BrutalCard>
);
