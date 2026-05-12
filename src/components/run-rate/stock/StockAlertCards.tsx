"use client";

import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import type { StockStatus } from "@/lib/validators/run-rate";

type Props = Readonly<{ stocks: readonly StockStatus[] }>;

type Bucket = Readonly<{ label: string; count: number; color: string; border: string; icon: React.ElementType; note: string }>;

const categorize = (stocks: readonly StockStatus[]): readonly Bucket[] => {
  let kritis = 0, restok = 0, aman = 0, unknown = 0;
  for (const s of stocks) {
    if (s.limit0Days === null) unknown++;
    else if (s.limit0Days < 7) kritis++;
    else if (s.limit0Days <= 30) restok++;
    else aman++;
  }
  return [
    { label: "Kritis", count: kritis, color: "bg-red-100", border: "border-red-600", icon: AlertTriangle, note: "< 7 hari" },
    { label: "Perlu Restock", count: restok, color: "bg-yellow-100", border: "border-yellow-500", icon: RefreshCw, note: "7–30 hari" },
    { label: "Aman", count: aman, color: "bg-green-100", border: "border-green-600", icon: CheckCircle, note: "> 30 hari" },
    { label: "Tidak Diketahui", count: unknown, color: "bg-neutral-100", border: "border-neutral-400", icon: AlertTriangle, note: "no data" },
  ];
};

export const StockAlertCards = ({ stocks }: Props) => {
  const buckets = categorize(stocks);
  const total = stocks.length;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {buckets.map(({ label, count, color, border, icon: Icon, note }) => (
        <div
          key={label}
          className={`${color} border-2 ${border} shadow-[4px_4px_0px_#171717] p-4`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs font-black uppercase tracking-wide text-neutral-700">{label}</p>
            <Icon className="w-4 h-4 text-neutral-600" />
          </div>
          <p className="text-3xl font-black text-neutral-950">{count}</p>
          <p className="text-xs font-bold text-neutral-500 mt-1">
            {note} · {total > 0 ? ((count / total) * 100).toFixed(0) : 0}% SKU
          </p>
        </div>
      ))}
    </div>
  );
};
