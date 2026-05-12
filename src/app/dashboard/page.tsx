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
    <div className="flex flex-col gap-5">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between flex-wrap gap-4 pb-5 border-b-2 border-neutral-200">
        <div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
            Overview
          </p>
          <h1 className="text-2xl font-black text-neutral-950 leading-none">Dashboard</h1>
        </div>
        <DashboardFilters filters={filters} onChange={setFilters} />
      </div>

      {/* ── Loading / error states ────────────────────────────────────────── */}
      {isLoading && (
        <p className="text-sm text-neutral-400 font-medium">Memuat dashboard…</p>
      )}
      {isError && (
        <BrutalAlert variant="error">{(error as Error).message}</BrutalAlert>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {!isLoading && !isError && dashboard && (
        <>
          {/* Row 1 — hero metrics */}
          <MetricCards summary={dashboard.summary} bestHour={dashboard.bestHour} />

          {/* Row 2 — trend chart (full width) */}
          <DailyTrendChart
            data={dashboard.dailyMetrics as Parameters<typeof DailyTrendChart>[0]["data"]}
          />

          {/* Row 3 — heatmap + leaderboard side by side */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
            <div className="xl:col-span-2">
              <HourlyHeatmap
                data={dashboard.heatmap as Parameters<typeof HourlyHeatmap>[0]["data"]}
              />
            </div>
            <div className="xl:col-span-1">
              <HostLeaderboard
                data={dashboard.hostLeaderboard as Parameters<typeof HostLeaderboard>[0]["data"]}
              />
            </div>
          </div>

          {/* Row 4 — detail table (recedes visually, no shadow) */}
          <DailyMetricsTable
            data={dashboard.dailyMetrics as Parameters<typeof DailyMetricsTable>[0]["data"]}
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
