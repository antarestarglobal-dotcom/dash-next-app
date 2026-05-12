"use client";

import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatPct, formatRpCompact } from "@/lib/format";
import type { ProductMetric } from "@/lib/validators/run-rate";

type Props = Readonly<{ products: readonly ProductMetric[] }>;

const badgeClass = (days: number | null): string =>
  days === null ? "bg-neutral-200" : days < 7 ? "bg-red-300" : days <= 30 ? "bg-yellow-300" : "bg-green-300";

export const ProductPerformanceTable = ({ products }: Props) => (
  <BrutalCard title="Product Performance">
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-stone-100"><tr>{["Produk", "Invoice", "Net Sales", "Margin", "AOV", "NPM", "Contrib", "Klasifikasi", "Stok", "Est. Habis"].map((header) => <th key={header} className="border-b-2 border-neutral-950 p-2 text-left">{header}</th>)}</tr></thead>
        <tbody>{products.map((product) => <tr key={product.productId} className="border-b border-neutral-200"><td className="p-2 font-bold">{product.productName}</td><td className="p-2">{product.invoiceCount}</td><td className="p-2">{formatRpCompact(product.netSales)}</td><td className="p-2">{formatRpCompact(product.margin)}</td><td className="p-2">{formatRpCompact(product.aov)}</td><td className="p-2">{formatPct(product.npm)}</td><td className="p-2">{formatPct(product.contributionSales)}</td><td className="p-2 font-bold">{product.klasifikasi}</td><td className="p-2">{product.stok ?? "-"}</td><td className="p-2"><span className={`${badgeClass(product.estimasiHabisHari)} border border-neutral-950 px-2 py-1 font-bold`}>{product.estimasiHabisHari ?? "-"}</span></td></tr>)}</tbody>
      </table>
    </div>
  </BrutalCard>
);
