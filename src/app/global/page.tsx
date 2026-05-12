"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DailyMetricsTable } from "@/components/dashboard/DailyMetricsTable";
import { DailyTrendChart } from "@/components/dashboard/DailyTrendChart";
import { HostLeaderboardInsights } from "@/components/dashboard/HostLeaderboardInsights";
import { HourlyHeatmap } from "@/components/dashboard/HourlyHeatmap";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { LegacyRunrateFunnelPanel } from "@/components/run-rate/legacy/LegacyRunrateFunnelPanel";
import { MarketingCostBreakdownChart } from "@/components/run-rate/marketing/MarketingCostBreakdownChart";
import { MarketingCostTable } from "@/components/run-rate/marketing/MarketingCostTable";
import { MarketingEfficiencyChart } from "@/components/run-rate/marketing/MarketingEfficiencyChart";
import { MoMComparisonChart } from "@/components/run-rate/mom/MoMComparisonChart";
import { MoMSummaryCards } from "@/components/run-rate/mom/MoMSummaryCards";
import { MoMTable } from "@/components/run-rate/mom/MoMTable";
import { DailyNetSalesChart } from "@/components/run-rate/overview/DailyNetSalesChart";
import { MarketingRatioChart } from "@/components/run-rate/overview/MarketingRatioChart";
import { PlatformContributionChart } from "@/components/run-rate/overview/PlatformContributionChart";
import { SummaryCards } from "@/components/run-rate/overview/SummaryCards";
import { TargetProgressCard } from "@/components/run-rate/overview/TargetProgressCard";
import { ProductContributionParetoChart } from "@/components/run-rate/products/ProductContributionParetoChart";
import { ProductKlasifikasiMatrix } from "@/components/run-rate/products/ProductKlasifikasiMatrix";
import { ProductPerformanceTable } from "@/components/run-rate/products/ProductPerformanceTable";
import { TopProductsChart } from "@/components/run-rate/products/TopProductsChart";
import { RunRateFilters } from "@/components/run-rate/RunRateFilters";
import { StockAlertCards } from "@/components/run-rate/stock/StockAlertCards";
import { StockTable } from "@/components/run-rate/stock/StockTable";
import { StockTimelineChart } from "@/components/run-rate/stock/StockTimelineChart";
import { BrutalAlert } from "@/components/ui/BrutalAlert";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { useDashboardQuery } from "@/hooks/use-dashboard-query";
import { useFunnelLegacyQuery } from "@/hooks/use-funnel-legacy-query";
import { useRunRateBrandsQuery } from "@/hooks/use-run-rate-brands-query";
import { useRunRateDailyQuery } from "@/hooks/use-run-rate-daily-query";
import { useRunRateMarketingQuery } from "@/hooks/use-run-rate-marketing-query";
import { useRunRateMoMQuery } from "@/hooks/use-run-rate-mom-query";
import { useRunRatePlatformContributionQuery } from "@/hooks/use-run-rate-platform-contribution-query";
import { useRunRateProductsQuery } from "@/hooks/use-run-rate-products-query";
import { useRunRateStockQuery } from "@/hooks/use-run-rate-stock-query";
import { useRunRateSummaryQuery } from "@/hooks/use-run-rate-summary-query";
import { useRunRateTargetsQuery } from "@/hooks/use-run-rate-targets-query";
import { useRunrateLegacyQuery } from "@/hooks/use-runrate-legacy-query";
import { ApiError } from "@/lib/api-client";
import { mapLegacyProductsToRunRateMetrics } from "@/lib/domain/legacy-runrate-products";
import { reportLegacyApiError } from "@/lib/telemetry/legacy-api";
import type { DashboardFilter } from "@/lib/validators/dashboard";
import type { RunRateFilter } from "@/lib/validators/run-rate";

const TABS = ["Overview", "Products", "DoD", "Host Leaderboard", "Funnel", "Marketing", "Stock", "MoM Report"] as const;
type Tab = (typeof TABS)[number];

const currentPeriod = (): string => new Date().toISOString().slice(0, 7);

const previousMonths = (period: string): string[] =>
  [0, 1, 2].map((offset) => {
    const [year, month] = period.split("-").map(Number);
    const date = new Date(year, month - 1 - offset, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

function formatLegacyError(source: "runrate" | "funnel", error: unknown): string {
  const sourceLabel = source === "runrate" ? "Runrate" : "Funnel";
  if (error instanceof ApiError) {
    if (error.code === "NETWORK_ERROR") return `${sourceLabel} legacy tidak dapat dihubungi.`;
    if (error.status > 0) return `${sourceLabel} legacy gagal (HTTP ${error.status}).`;
    return `${sourceLabel} legacy gagal (${error.code}).`;
  }
  if (error instanceof Error) return `${sourceLabel} legacy gagal (${error.message}).`;
  return `${sourceLabel} legacy gagal.`;
}

export default function GlobalPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [runRateFilters, setRunRateFilters] = useState<RunRateFilter>({ period: currentPeriod() });
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilter>({});

  const brands = useRunRateBrandsQuery();
  const antarestarBrand = brands.data?.find((b) => b.name.toLowerCase() === "antarestar");
  const effectiveFilters =
    runRateFilters.brandId || !antarestarBrand
      ? runRateFilters
      : { ...runRateFilters, brandId: antarestarBrand.id };

  const summary = useRunRateSummaryQuery(effectiveFilters);
  const daily = useRunRateDailyQuery(effectiveFilters);
  const marketing = useRunRateMarketingQuery(effectiveFilters);
  const targets = useRunRateTargetsQuery(effectiveFilters);
  const platformContribution = useRunRatePlatformContributionQuery(effectiveFilters);
  const products = useRunRateProductsQuery({ ...effectiveFilters, sortBy: "netSales", order: "desc" });
  const stock = useRunRateStockQuery({ sortBy: "limit_0_days" });
  const mom = useRunRateMoMQuery({
    months: previousMonths(effectiveFilters.period ?? currentPeriod()),
    storeId: effectiveFilters.storeId,
  });
  const dashboard = useDashboardQuery(dashboardFilters);
  const runrateLegacy = useRunrateLegacyQuery();
  const funnelLegacy = useFunnelLegacyQuery();

  useEffect(() => {
    if (!runrateLegacy.isError || !runrateLegacy.error) return;
    reportLegacyApiError("runrate", runrateLegacy.error, {
      errorUpdatedAt: runrateLegacy.errorUpdatedAt,
    });
  }, [runrateLegacy.isError, runrateLegacy.error, runrateLegacy.errorUpdatedAt]);

  useEffect(() => {
    if (!funnelLegacy.isError || !funnelLegacy.error) return;
    reportLegacyApiError("funnel", funnelLegacy.error, {
      errorUpdatedAt: funnelLegacy.errorUpdatedAt,
    });
  }, [funnelLegacy.isError, funnelLegacy.error, funnelLegacy.errorUpdatedAt]);

  const legacyErrorMessages = [
    runrateLegacy.isError && runrateLegacy.error
      ? formatLegacyError("runrate", runrateLegacy.error)
      : null,
    funnelLegacy.isError && funnelLegacy.error ? formatLegacyError("funnel", funnelLegacy.error) : null,
  ].filter((message): message is string => Boolean(message));

  const productRows = useMemo(() => {
    if (runrateLegacy.data) return mapLegacyProductsToRunRateMetrics(runrateLegacy.data);
    return products.data;
  }, [runrateLegacy.data, products.data]);

  const isProductsLoading = runrateLegacy.isLoading || (!runrateLegacy.isError && products.isLoading);
  const isFunnelLoading = runrateLegacy.isLoading || funnelLegacy.isLoading;

  const isLoading =
    activeTab === "Overview"
      ? summary.isLoading || daily.isLoading || marketing.isLoading || targets.isLoading
      : activeTab === "Products"
        ? isProductsLoading
      : activeTab === "DoD"
          ? dashboard.isLoading
          : activeTab === "Host Leaderboard"
            ? dashboard.isLoading
          : activeTab === "Funnel"
            ? isFunnelLoading
            : activeTab === "Marketing"
              ? marketing.isLoading
              : activeTab === "Stock"
                ? stock.isLoading
                : mom.isLoading;

  const isEmpty =
    activeTab === "Overview"
      ? daily.data?.length === 0
      : activeTab === "Products"
        ? (productRows?.length ?? 0) === 0
      : activeTab === "DoD"
          ? (dashboard.data?.dailyMetrics.length ?? 0) === 0
          : activeTab === "Host Leaderboard"
            ? (dashboard.data?.hostLeaderboard.length ?? 0) === 0
          : activeTab === "Funnel"
            ? !runrateLegacy.data && !funnelLegacy.data
            : activeTab === "Marketing"
              ? marketing.data?.daily.length === 0
              : activeTab === "Stock"
                ? stock.data?.length === 0
                : mom.data?.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Antarestar</p>
        <h1 className="text-3xl font-black text-neutral-950">Global Command Center</h1>
      </div>

      {activeTab === "DoD" ? (
        <DashboardFilters filters={dashboardFilters} onChange={setDashboardFilters} />
      ) : (
        <RunRateFilters filters={effectiveFilters} onChange={setRunRateFilters} />
      )}

      <div className="flex flex-wrap gap-2 border-b-2 border-neutral-200 pb-3">
        {TABS.map((tab) => (
          <BrutalButton
            key={tab}
            variant={activeTab === tab ? "primary" : "secondary"}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </BrutalButton>
        ))}
      </div>

      {(summary.isError || daily.isError || marketing.isError) && activeTab !== "DoD" && (
        <BrutalAlert variant="error">Gagal memuat data Run Rate.</BrutalAlert>
      )}

      {dashboard.isError && (activeTab === "DoD" || activeTab === "Host Leaderboard") && (
        <BrutalAlert variant="error">
          {dashboard.error instanceof Error ? dashboard.error.message : "Gagal memuat data dashboard."}
        </BrutalAlert>
      )}

      {legacyErrorMessages.length > 0 && (activeTab === "Funnel" || activeTab === "Products") && (
        <BrutalAlert variant="info">
          Sebagian data Global Legacy belum tersedia. {legacyErrorMessages.join(" ")}
        </BrutalAlert>
      )}

      {isLoading && <p className="text-sm font-bold text-neutral-400">Memuat data…</p>}

      {!isLoading && isEmpty && (
        <BrutalAlert variant="info">
          Belum ada data untuk kategori ini. <a href="/imports" className="underline font-bold">Import data</a>{" "}
          dari Google Sheets atau XLSX terlebih dahulu.
        </BrutalAlert>
      )}

      {activeTab === "Overview" && summary.data && daily.data && marketing.data && targets.data && (
        <div className="flex flex-col gap-5">
          <SummaryCards summary={summary.data} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <DailyNetSalesChart data={daily.data} />
            {platformContribution.data && platformContribution.data.length > 0 ? (
              <PlatformContributionChart
                rows={platformContribution.data.map((r) => ({
                  name: r.storeName,
                  netSales: r.netSales,
                }))}
              />
            ) : (
              <MarketingRatioChart marketing={marketing.data} />
            )}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <MarketingRatioChart marketing={marketing.data} />
            <TargetProgressCard targets={targets.data} />
          </div>
        </div>
      )}

      {activeTab === "Products" && productRows && (
        <div className="flex flex-col gap-5">
          {runrateLegacy.data && (
            <BrutalAlert variant="info">
              Product tab menggunakan data global legacy ({runrateLegacy.data.month}).
            </BrutalAlert>
          )}
          <ProductKlasifikasiMatrix products={productRows} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <TopProductsChart products={productRows} />
            <ProductContributionParetoChart products={productRows} />
          </div>
          <ProductPerformanceTable products={productRows} />
        </div>
      )}

      {activeTab === "DoD" && dashboard.data && (
        <div className="flex flex-col gap-5">
          <MetricCards summary={dashboard.data.summary} bestHour={dashboard.data.bestHour} />
          <DailyTrendChart data={dashboard.data.dailyMetrics} />
          <HourlyHeatmap data={dashboard.data.heatmap} />
          <DailyMetricsTable data={dashboard.data.dailyMetrics} />
        </div>
      )}

      {activeTab === "Host Leaderboard" && dashboard.data && (
        <HostLeaderboardInsights data={dashboard.data.hostLeaderboard} />
      )}

      {activeTab === "Funnel" && (runrateLegacy.data || funnelLegacy.data) && (
        <LegacyRunrateFunnelPanel runrate={runrateLegacy.data} funnel={funnelLegacy.data} />
      )}

      {activeTab === "Marketing" && marketing.data && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <MarketingCostBreakdownChart marketing={marketing.data} />
          <MarketingEfficiencyChart marketing={marketing.data} />
          <div className="xl:col-span-2">
            <MarketingCostTable marketing={marketing.data} />
          </div>
        </div>
      )}

      {activeTab === "Stock" && stock.data && (
        <div className="flex flex-col gap-5">
          <StockAlertCards stocks={stock.data} />
          <StockTimelineChart stocks={stock.data} />
          <StockTable stocks={stock.data} />
        </div>
      )}

      {activeTab === "MoM Report" && mom.data && (
        <div className="flex flex-col gap-5">
          <MoMSummaryCards rows={mom.data} />
          <MoMComparisonChart rows={mom.data} />
          <MoMTable rows={mom.data} />
        </div>
      )}
    </div>
  );
}
