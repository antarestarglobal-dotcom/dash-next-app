"use client";

import { BrutalCard } from "@/components/ui/BrutalCard";
import { cn } from "@/lib/utils";

interface HeatmapRow {
  date: string;
  hour: number;
  valuePercent: number | null;
}

interface HourlyHeatmapProps {
  data: HeatmapRow[];
}

function getIntensityClass(value: number | null): string {
  if (value === null) return "bg-neutral-100";
  if (value >= 8) return "bg-neutral-950 text-white";
  if (value >= 6) return "bg-neutral-700 text-white";
  if (value >= 4) return "bg-neutral-500 text-white";
  if (value >= 2) return "bg-neutral-300";
  if (value > 0) return "bg-neutral-200";
  return "bg-neutral-100";
}

export function HourlyHeatmap({ data }: HourlyHeatmapProps) {
  const dates = [...new Set(data.map((d) => d.date))].sort().slice(-14);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const lookup = new Map<string, number>();
  for (const row of data) {
    lookup.set(`${row.date}-${row.hour}`, row.valuePercent ?? 0);
  }

  return (
    <BrutalCard title="Hourly Distribution Heatmap">
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse min-w-max">
          <thead>
            <tr>
              <th className="w-20 px-2 py-1 text-left text-neutral-500 font-semibold">Date</th>
              {hours.map((h) => (
                <th key={h} className="w-7 px-0 py-1 text-center text-neutral-500 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((date) => (
              <tr key={date}>
                <td className="px-2 py-0.5 text-neutral-700 font-medium whitespace-nowrap">
                  {date}
                </td>
                {hours.map((h) => {
                  const val = lookup.get(`${date}-${h}`) ?? null;
                  return (
                    <td key={h} className="p-0.5" title={val !== null ? `${val.toFixed(2)}%` : "N/A"}>
                      <div
                        className={cn(
                          "w-6 h-5 border border-neutral-300",
                          getIntensityClass(val),
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {dates.length === 0 && (
          <p className="text-sm text-neutral-500 py-4">Belum ada data heatmap.</p>
        )}
      </div>
    </BrutalCard>
  );
}
