"use client";

import { BrutalCard } from "@/components/ui/BrutalCard";
import type { StockStatus } from "@/lib/validators/run-rate";

type Props = Readonly<{ stocks: readonly StockStatus[] }>;

export const StockTable = ({ stocks }: Props) => (
  <BrutalCard title="Stock Status">
    <div className="max-h-[560px] overflow-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-stone-100"><tr>{["Produk", "SKU", "Stok", "Avg Out", "Sisa Hari", "Tgl Habis", "Open PO"].map((header) => <th key={header} className="border-b-2 border-neutral-950 p-2 text-left">{header}</th>)}</tr></thead><tbody>{stocks.map((stock) => <tr key={stock.sku} className="border-b border-neutral-200"><td className="p-2 font-bold">{stock.productName}</td><td className="p-2">{stock.sku}</td><td className="p-2">{stock.totalQty}</td><td className="p-2">{stock.averageOut ?? "-"}</td><td className="p-2">{stock.limit0Days ?? "-"}</td><td className="p-2">{stock.dateLimit ?? "-"}</td><td className="p-2">{stock.qtyOpenPo ?? "-"}</td></tr>)}</tbody></table></div>
  </BrutalCard>
);
