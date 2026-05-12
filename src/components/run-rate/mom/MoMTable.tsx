"use client";

import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatPct, formatRpCompact } from "@/lib/format";
import type { MoMMetric } from "@/lib/validators/run-rate";

type Props = Readonly<{ rows: readonly MoMMetric[] }>;

export const MoMTable = ({ rows }: Props) => (
  <BrutalCard title="MoM Table">
    <table className="w-full text-sm"><thead><tr>{["Tanggal", "Bulan", "Net Sales", "Net Profit", "NPM", "Chance"].map((header) => <th key={header} className="p-2 text-left">{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={`${row.month}-${row.date}`} className="border-t"><td className="p-2">{row.dayOfMonth}</td><td className="p-2">{row.month}</td><td className="p-2">{formatRpCompact(row.netSales)}</td><td className="p-2">{formatRpCompact(row.netProfit)}</td><td className="p-2">{formatPct(row.npm)}</td><td className={row.chance >= 0 ? "p-2 text-green-700" : "p-2 text-red-700"}>{formatPct(row.chance)}</td></tr>)}</tbody></table>
  </BrutalCard>
);
