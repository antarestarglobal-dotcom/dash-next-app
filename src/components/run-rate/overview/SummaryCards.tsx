"use client";

import { ArrowDown, ArrowUp, CalendarDays, Megaphone, Percent, TrendingUp, Wallet } from "lucide-react";
import { formatPct, formatRp, formatRpCompact } from "@/lib/format";
import type { SummaryResponse } from "@/lib/validators/run-rate";

type Props = Readonly<{ summary: SummaryResponse }>;

const NPM_GOOD = 10 as const;
const NPM_WARNING = 7 as const;

const npmClass = (npm: number): string =>
  npm >= NPM_GOOD ? "bg-green-300" : npm >= NPM_WARNING ? "bg-yellow-300" : "bg-red-300";

const Delta = ({ value }: Readonly<{ value: number }>) => {
  const Icon = value >= 0 ? ArrowUp : ArrowDown;
  return <span className={value >= 0 ? "text-green-700" : "text-red-700"}><Icon className="inline h-3 w-3" /> {formatPct(value)}</span>;
};

const Card = ({ label, value, sub, color = "bg-white", icon: Icon }: Readonly<{ label: string; value: string; sub?: React.ReactNode; color?: string; icon: React.ElementType }>) => (
  <div className={`${color} border-2 border-neutral-950 shadow-[4px_4px_0px_#171717] p-4`}>
    <div className="flex items-start justify-between gap-3"><p className="text-xs font-black uppercase tracking-wide text-neutral-700">{label}</p><Icon className="h-4 w-4" /></div>
    <p className="mt-3 text-2xl font-black text-neutral-950 leading-tight">{value}</p>
    {sub && <p className="mt-1 text-xs font-bold text-neutral-600">{sub}</p>}
  </div>
);

export const SummaryCards = ({ summary }: Props) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
    <Card label="Net Sales" value={formatRpCompact(summary.netSales)} sub={<Delta value={summary.vsLastMonth.netSales} />} icon={TrendingUp} />
    <Card label="Net Profit" value={formatRpCompact(summary.netProfit)} sub={<Delta value={summary.vsLastMonth.netProfit} />} icon={Wallet} />
    <Card label="NPM" value={formatPct(summary.npm)} sub={<Delta value={summary.vsLastMonth.npm} />} color={npmClass(summary.npm)} icon={Percent} />
    <Card label="Margin" value={formatPct(summary.margin)} icon={Percent} />
    <Card label="Mkt Cost" value={formatRpCompact(summary.marketingCost)} sub={`Ratio ${formatPct(summary.marketingRatio)}`} icon={Megaphone} />
    <Card label="Progress Hari" value={formatPct(summary.progressHari)} sub={formatRp(summary.gmv)} icon={CalendarDays} />
  </div>
);
