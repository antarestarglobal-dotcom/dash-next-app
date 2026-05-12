"use client";

import { useState } from "react";
import { BrutalAlert } from "@/components/ui/BrutalAlert";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { RunRateFilters } from "@/components/run-rate/RunRateFilters";
import { SummaryCards } from "@/components/run-rate/overview/SummaryCards";
import { DailyNetSalesChart } from "@/components/run-rate/overview/DailyNetSalesChart";
import { MarketingRatioChart } from "@/components/run-rate/overview/MarketingRatioChart";
import { PlatformContributionChart } from "@/components/run-rate/overview/PlatformContributionChart";
import { TargetProgressCard } from "@/components/run-rate/overview/TargetProgressCard";
import { ProductKlasifikasiMatrix } from "@/components/run-rate/products/ProductKlasifikasiMatrix";
import { ProductPerformanceTable } from "@/components/run-rate/products/ProductPerformanceTable";
import { TopProductsChart } from "@/components/run-rate/products/TopProductsChart";
import { MarketingCostBreakdownChart } from "@/components/run-rate/marketing/MarketingCostBreakdownChart";
import { MarketingCostTable } from "@/components/run-rate/marketing/MarketingCostTable";
import { MarketingEfficiencyChart } from "@/components/run-rate/marketing/MarketingEfficiencyChart";
import { MoMSummaryCards } from "@/components/run-rate/mom/MoMSummaryCards";
import { MoMTable } from "@/components/run-rate/mom/MoMTable";
import { StockAlertCards } from "@/components/run-rate/stock/StockAlertCards";
import { StockTable } from "@/components/run-rate/stock/StockTable";
import { StockTimelineChart } from "@/components/run-rate/stock/StockTimelineChart";
import { MoMComparisonChart } from "@/components/run-rate/mom/MoMComparisonChart";
import { useRunRateDailyQuery } from "@/hooks/use-run-rate-daily-query";
import { useRunRateBrandsQuery } from "@/hooks/use-run-rate-brands-query";
import { useRunRateMarketingQuery } from "@/hooks/use-run-rate-marketing-query";
import { useRunRateMoMQuery } from "@/hooks/use-run-rate-mom-query";
import { useRunRatePlatformContributionQuery } from "@/hooks/use-run-rate-platform-contribution-query";
import { useRunRateProductsQuery } from "@/hooks/use-run-rate-products-query";
import { useRunRateStockQuery } from "@/hooks/use-run-rate-stock-query";
import { useRunRateSummaryQuery } from "@/hooks/use-run-rate-summary-query";
import { useRunRateTargetsQuery } from "@/hooks/use-run-rate-targets-query";
import type { RunRateFilter } from "@/lib/validators/run-rate";

const TABS = ["Overview", "Products", "Marketing", "Stock", "MoM Report"] as const;
type Tab = (typeof TABS)[number];

const currentPeriod = (): string => new Date().toISOString().slice(0, 7);

const previousMonths = (period: string): string[] => [0, 1, 2].map((offset) => {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(year, month - 1 - offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
});

const LoadingPanel = () => <p className="text-sm font-bold text-neutral-500">Memuat Run Rate...</p>;

const EmptyPanel = () => (
  <BrutalAlert variant="info">Belum ada data untuk filter ini. Import file XLSX terlebih dahulu.</BrutalAlert>
);

export default function RunRatePage() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [filters, setFilters] = useState<RunRateFilter>({ period: currentPeriod() });
  const brands = useRunRateBrandsQuery();
  const antarestarBrand = brands.data?.find((brand) => brand.name.toLowerCase() === "antarestar");
  const effectiveFilters = filters.brandId || !antarestarBrand
    ? filters
    : { ...filters, brandId: antarestarBrand.id };
  const summary = useRunRateSummaryQuery(effectiveFilters);
  const daily = useRunRateDailyQuery(effectiveFilters);
  const marketing = useRunRateMarketingQuery(effectiveFilters);
  const targets = useRunRateTargetsQuery(effectiveFilters);
  const platformContribution = useRunRatePlatformContributionQuery(effectiveFilters);
  const products = useRunRateProductsQuery({ ...effectiveFilters, sortBy: "netSales", order: "desc" });
  const stock = useRunRateStockQuery({ sortBy: "limit_0_days" });
  const mom = useRunRateMoMQuery({ months: previousMonths(effectiveFilters.period ?? currentPeriod()), storeId: effectiveFilters.storeId });
  const isLoading = activeTab === "Overview"
    ? summary.isLoading || daily.isLoading || marketing.isLoading || targets.isLoading
    : activeTab === "Products"
      ? products.isLoading
      : activeTab === "Marketing"
        ? marketing.isLoading
        : activeTab === "Stock"
          ? stock.isLoading
          : mom.isLoading;
  const isEmpty = activeTab === "Overview"
    ? daily.data?.length === 0
    : activeTab === "Products"
      ? products.data?.length === 0
      : activeTab === "Marketing"
        ? marketing.data?.daily.length === 0
        : activeTab === "Stock"
          ? stock.data?.length === 0
          : mom.data?.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div><p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Antarestar</p><h1 className="text-3xl font-black text-neutral-950">Run Rate Dashboard</h1></div>
      <RunRateFilters filters={effectiveFilters} onChange={setFilters} />
      <div className="flex flex-wrap gap-2">{TABS.map((tab) => <BrutalButton key={tab} variant={activeTab === tab ? "primary" : "secondary"} size="sm" onClick={() => setActiveTab(tab)}>{tab}</BrutalButton>)}</div>
      {(summary.isError || daily.isError || marketing.isError) && <BrutalAlert variant="error">Gagal memuat data Run Rate.</BrutalAlert>}
      {isLoading && <LoadingPanel />}
      {!isLoading && isEmpty && <EmptyPanel />}
      {activeTab === "Overview" && summary.data && daily.data && marketing.data && targets.data && <><SummaryCards summary={summary.data} /><div className="grid grid-cols-1 xl:grid-cols-2 gap-5"><DailyNetSalesChart data={daily.data} />{platformContribution.data ? <PlatformContributionChart rows={platformContribution.data.map((row) => ({ name: row.storeName, netSales: row.netSales }))} /> : <MarketingRatioChart marketing={marketing.data} />}</div><div className="grid grid-cols-1 xl:grid-cols-2 gap-5"><MarketingRatioChart marketing={marketing.data} /><TargetProgressCard targets={targets.data} /></div></>}
      {activeTab === "Products" && products.data && <div className="grid grid-cols-1 gap-5"><ProductKlasifikasiMatrix products={products.data} /><TopProductsChart products={products.data} /><ProductPerformanceTable products={products.data} /></div>}
      {activeTab === "Marketing" && marketing.data && <div className="grid grid-cols-1 xl:grid-cols-2 gap-5"><MarketingCostBreakdownChart marketing={marketing.data} /><MarketingEfficiencyChart marketing={marketing.data} /><div className="xl:col-span-2"><MarketingCostTable marketing={marketing.data} /></div></div>}
      {activeTab === "Stock" && stock.data && <div className="grid grid-cols-1 gap-5"><StockAlertCards stocks={stock.data} /><StockTimelineChart stocks={stock.data} /><StockTable stocks={stock.data} /></div>}
      {activeTab === "MoM Report" && mom.data && <div className="grid grid-cols-1 gap-5"><MoMSummaryCards rows={mom.data} /><MoMComparisonChart rows={mom.data} /><MoMTable rows={mom.data} /></div>}
    </div>
  );
}
