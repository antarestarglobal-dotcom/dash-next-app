"use client";

import { BrutalCard } from "@/components/ui/BrutalCard";
import type { StockStatus } from "@/lib/validators/run-rate";

type Props = Readonly<{ stocks: readonly StockStatus[] }>;

const rowClass = (days: number | null): string => {
  if (days === null) return "";
  if (days < 7) return "bg-red-50";
  if (days <= 30) return "bg-yellow-50";
  return "";
};

const daysCell = (days: number | null): React.ReactNode => {
  if (days === null) return <span className="text-neutral-400">—</span>;
  const cls =
    days < 7
      ? "font-black text-red-700"
      : days <= 30
        ? "font-bold text-yellow-700"
        : "font-bold text-green-700";
  return <span className={cls}>{days}</span>;
};

const HEADERS = ["Produk", "SKU", "Stok", "Avg Out/Hari", "Sisa Hari", "Tgl Habis", "Open PO"] as const;

export const StockTable = ({ stocks }: Props) => (
  <BrutalCard title={`Stock Status (${stocks.length} SKU)`}>
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b-2 border-neutral-950 bg-stone-100 text-[10px] uppercase tracking-widest">
            {HEADERS.map((h) => (
              <th key={h} className={`px-3 py-2 ${h === "Produk" ? "text-left" : "text-right"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stocks.map((s) => (
            <tr key={s.sku} className={`border-b border-neutral-200 ${rowClass(s.limit0Days)}`}>
              <td className="px-3 py-2 font-bold max-w-[200px] truncate" title={s.productName}>
                {s.productName}
              </td>
              <td className="px-3 py-2 text-right font-mono text-[10px]">{s.sku}</td>
              <td className="px-3 py-2 text-right font-bold">{s.totalQty.toLocaleString("id-ID")}</td>
              <td className="px-3 py-2 text-right">
                {s.averageOut !== null ? s.averageOut.toFixed(1) : <span className="text-neutral-400">—</span>}
              </td>
              <td className="px-3 py-2 text-right">{daysCell(s.limit0Days)}</td>
              <td className="px-3 py-2 text-right">
                {s.dateLimit ?? <span className="text-neutral-400">—</span>}
              </td>
              <td className="px-3 py-2 text-right">
                {s.qtyOpenPo !== null ? s.qtyOpenPo.toLocaleString("id-ID") : <span className="text-neutral-400">—</span>}
              </td>
            </tr>
          ))}
          {stocks.length === 0 && (
            <tr>
              <td colSpan={HEADERS.length} className="py-8 text-center text-neutral-400">
                Belum ada data stok.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </BrutalCard>
);
