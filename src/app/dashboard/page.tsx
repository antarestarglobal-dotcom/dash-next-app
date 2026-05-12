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

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilter>({});
  const { data, isLoading, isError, error } = useDashboardQuery(filters);

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
      {isError && (
        <BrutalAlert variant="error">
          {error instanceof Error ? error.message : "Terjadi kesalahan"}
        </BrutalAlert>
      )}

      {!isLoading && !isError && data && (
        <>
          <MetricCards summary={data.summary} bestHour={data.bestHour} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DailyTrendChart data={data.dailyMetrics} />
            <HostLeaderboard data={data.hostLeaderboard} />
          </div>

          <HourlyHeatmap data={data.heatmap} />

          <DailyMetricsTable data={data.dailyMetrics} />
        </>
      )}

      {!isLoading && !isError && !data && (
        <BrutalAlert variant="info">
          Belum ada data. Import file XLSX/CSV terlebih dahulu.
        </BrutalAlert>
      )}
    </div>
  );
}
