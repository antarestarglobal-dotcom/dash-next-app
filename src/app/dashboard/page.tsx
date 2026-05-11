"use client";

import { useState } from "react";
import { useDashboardQuery } from "@/hooks/use-dashboard-query";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { DailyTrendChart } from "@/components/dashboard/DailyTrendChart";
import { HourlyHeatmap } from "@/components/dashboard/HourlyHeatmap";
import { HostLeaderboard } from "@/components/dashboard/HostLeaderboard";
import { DailyMetricsTable } from "@/components/dashboard/DailyMetricsTable";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { BrutalAlert } from "@/components/ui/BrutalAlert";
import type { DashboardFilter } from "@/lib/validators/dashboard";

interface DashboardData {
  summary: { totalMtd: number; dailyAvg: number; bestDayTotal: number; rowCount: number };
  dailyMetrics: unknown[];
  heatmap: unknown[];
  hostLeaderboard: unknown[];
  bestHour: { hour: number | null; avgPercent: number };
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilter>({});
  const { data, isLoading, isError, error } = useDashboardQuery(filters);

  const dashboard = data as DashboardData | undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-0.5">
            Overview
          </p>
          <h1 className="text-2xl font-black text-neutral-950">Dashboard</h1>
        </div>
        <DashboardFilters filters={filters} onChange={setFilters} />
      </div>

      {isLoading && <p className="text-sm text-neutral-500">Memuat dashboard...</p>}
      {isError && <BrutalAlert variant="error">{(error as Error).message}</BrutalAlert>}

      {!isLoading && !isError && dashboard && (
        <>
          <MetricCards summary={dashboard.summary} bestHour={dashboard.bestHour} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DailyTrendChart
              data={dashboard.dailyMetrics as Parameters<typeof DailyTrendChart>[0]["data"]}
            />
            <HostLeaderboard
              data={
                dashboard.hostLeaderboard as Parameters<typeof HostLeaderboard>[0]["data"]
              }
            />
          </div>

          <HourlyHeatmap
            data={dashboard.heatmap as Parameters<typeof HourlyHeatmap>[0]["data"]}
          />

          <DailyMetricsTable
            data={
              dashboard.dailyMetrics as Parameters<typeof DailyMetricsTable>[0]["data"]
            }
          />
        </>
      )}

      {!isLoading && !isError && !dashboard && (
        <BrutalAlert variant="info">
          Belum ada data. Import file XLSX/CSV terlebih dahulu.
        </BrutalAlert>
      )}
    </div>
  );
}
