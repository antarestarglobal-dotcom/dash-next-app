"use client";

import React, { useMemo } from "react";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { formatPct, formatRpCompact, formatShortDate } from "@/lib/format";
import type { MoMMetric } from "@/lib/validators/run-rate";

type Props = Readonly<{ rows: readonly MoMMetric[] }>;

export const MoMTable = ({ rows }: Props) => {
  const months = useMemo(
    () => [...new Set(rows.map((r) => r.month))].sort((a, b) => b.localeCompare(a)),
    [rows],
  );
  const days = useMemo(
    () => [...new Set(rows.map((r) => r.dayOfMonth))].sort((a, b) => a - b),
    [rows],
  );

  const lookup = useMemo(() => {
    const m = new Map<string, MoMMetric>();
    for (const row of rows) m.set(`${row.month}|${row.dayOfMonth}`, row);
    return m;
  }, [rows]);

  if (rows.length === 0) {
    return (
      <BrutalCard title="Detail MoM per Hari">
        <p className="text-sm text-neutral-400 text-center py-8">Belum ada data.</p>
      </BrutalCard>
    );
  }

  return (
    <BrutalCard title="Detail MoM per Hari">
      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-neutral-950 bg-stone-100 text-[10px] uppercase tracking-widest">
              <th className="text-left px-3 py-2 sticky left-0 bg-stone-100">Tgl</th>
              {months.map((m) => (
                <th key={m} colSpan={3} className="text-center px-3 py-2 border-l border-neutral-300">
                  {m}
                </th>
              ))}
            </tr>
            <tr className="border-b border-neutral-200 bg-stone-50 text-[10px] text-neutral-500">
              <th className="px-3 py-1 sticky left-0 bg-stone-50" />
              {months.map((m) => (
                <React.Fragment key={m}>
                  <th className="text-right px-3 py-1 border-l border-neutral-200">Sales</th>
                  <th className="text-right px-3 py-1">NPM</th>
                  <th className="text-right px-3 py-1">Chance</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const firstMonth = months[0];
              const firstRow = lookup.get(`${firstMonth}|${day}`);
              return (
                <tr key={day} className="border-b border-neutral-100 hover:bg-stone-50">
                  <td className="px-3 py-2 font-bold sticky left-0 bg-white">
                    {firstRow ? formatShortDate(firstRow.date) : `Hari ${day}`}
                  </td>
                  {months.map((m) => {
                    const row = lookup.get(`${m}|${day}`);
                    return (
                      <React.Fragment key={m}>
                        <td className="px-3 py-2 text-right border-l border-neutral-100 font-bold">
                          {row ? formatRpCompact(row.netSales) : <span className="text-neutral-300">—</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row ? formatPct(row.npm, 1) : <span className="text-neutral-300">—</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row ? (
                            <span className={row.chance >= 0 ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
                              {row.chance >= 0 ? "+" : ""}{formatPct(row.chance, 1)}
                            </span>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </BrutalCard>
  );
};
