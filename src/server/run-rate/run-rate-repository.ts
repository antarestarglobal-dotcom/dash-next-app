import { db } from "@/db";
import {
  brands,
  dailyStorePerformance,
  marketingCosts,
  products,
  salesLineItems,
  salesTargets,
  stockSnapshots,
  stores,
} from "@/db/schema";
import { classifyAll } from "./classification";
import { and, asc, desc, eq, gte, ilike, inArray, lte, sql, type SQL } from "drizzle-orm";
import {
  DailyResponseSchema,
  MarketingResponseSchema,
  MoMResponseSchema,
  ProductResponseSchema,
  StockResponseSchema,
  StoresResponseSchema,
  SummaryResponseSchema,
  TargetProgressResponseSchema,
  BrandsResponseSchema,
  PlatformContributionResponseSchema,
  type MarketingFilter,
  type ProductFilter,
  type RunRateFilter,
  type StockFilter,
} from "@/lib/validators/run-rate";

const CHANNELS = ["voucher", "affiliate", "sample", "endorse", "iklan", "other"] as const;
const DATE_LENGTH = 10 as const;

const toNumber = (value: string | number | null | undefined): number => Number(value ?? 0);

const calculateRatio = (numerator: number, denominator: number): number =>
  denominator === 0 ? 0 : (numerator / denominator) * 100;

const toDateRange = (filter: RunRateFilter): Readonly<{ startDate?: string; endDate?: string }> => {
  if (filter.startDate || filter.endDate) return filter;
  if (!filter.period) return {};
  const [yearText, monthText] = filter.period.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const totalDays = new Date(year, month, 0).getDate();
  return { startDate: `${filter.period}-01`, endDate: `${filter.period}-${String(totalDays).padStart(2, "0")}` };
};

const calculateProgressHari = (period?: string): number => {
  const today = new Date();
  const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const selectedPeriod = period ?? currentPeriod;
  const [yearText, monthText] = selectedPeriod.split("-");
  const totalDays = new Date(Number(yearText), Number(monthText), 0).getDate();
  const day = selectedPeriod === currentPeriod ? today.getDate() : totalDays;
  return calculateRatio(day, totalDays);
};

const previousPeriod = (period: string): string => {
  const [yearText, monthText] = period.split("-");
  const date = new Date(Number(yearText), Number(monthText) - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const buildDailyConditions = (filter: RunRateFilter): SQL[] => {
  const range = toDateRange(filter);
  return [
    filter.storeId ? eq(dailyStorePerformance.storeId, filter.storeId) : undefined,
    filter.brandId ? eq(dailyStorePerformance.brandId, filter.brandId) : undefined,
    range.startDate ? gte(dailyStorePerformance.date, range.startDate) : undefined,
    range.endDate ? lte(dailyStorePerformance.date, range.endDate) : undefined,
  ].filter((condition): condition is SQL => condition !== undefined);
};

const buildSalesConditions = (filter: RunRateFilter): SQL[] => {
  const range = toDateRange(filter);
  return [
    filter.storeId ? eq(salesLineItems.storeId, filter.storeId) : undefined,
    filter.brandId ? eq(salesLineItems.brandId, filter.brandId) : undefined,
    range.startDate ? gte(salesLineItems.date, range.startDate) : undefined,
    range.endDate ? lte(salesLineItems.date, range.endDate) : undefined,
  ].filter((condition): condition is SQL => condition !== undefined);
};

const buildMarketingConditions = (filter: MarketingFilter): SQL[] => {
  const range = toDateRange(filter);
  return [
    filter.storeId ? eq(marketingCosts.storeId, filter.storeId) : undefined,
    filter.brandId ? eq(marketingCosts.brandId, filter.brandId) : undefined,
    filter.variable ? eq(marketingCosts.variable, filter.variable) : undefined,
    range.startDate ? gte(marketingCosts.date, range.startDate) : undefined,
    range.endDate ? lte(marketingCosts.date, range.endDate) : undefined,
  ].filter((condition): condition is SQL => condition !== undefined);
};

const orderProductBy = (filter: ProductFilter): SQL => {
  const direction = filter.order === "asc" ? asc : desc;
  const expression = filter.sortBy === "netProfit"
    ? sql`sum(${salesLineItems.netProfit})`
    : filter.sortBy === "npm"
      ? sql`case when sum(${salesLineItems.netSales}) = 0 then 0 else sum(${salesLineItems.netProfit}) / sum(${salesLineItems.netSales}) end`
      : filter.sortBy === "contributionSales"
        ? sql`sum(${salesLineItems.netSales})`
        : sql`sum(${salesLineItems.netSales})`;
  return direction(expression);
};

export const getStores = async () => {
  const rows = await db
    .select({ id: stores.id, name: stores.name, platform: stores.platform, storeType: stores.storeType })
    .from(stores)
    .orderBy(asc(stores.platform), asc(stores.name));
  return StoresResponseSchema.parse(rows);
};

export const getBrands = async () => {
  const rows = await db
    .select({ id: brands.id, name: brands.name })
    .from(brands)
    .orderBy(asc(brands.name));
  return BrandsResponseSchema.parse(rows);
};

export const getPlatformContribution = async (filter: RunRateFilter) => {
  const conditions = buildDailyConditions(filter);
  const rows = await db
    .select({
      storeId: stores.id,
      storeName: stores.name,
      netSales: sql<string>`coalesce(sum(${dailyStorePerformance.netSales}), 0)`,
    })
    .from(dailyStorePerformance)
    .innerJoin(stores, eq(dailyStorePerformance.storeId, stores.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(stores.id, stores.name)
    .orderBy(desc(sql`sum(${dailyStorePerformance.netSales})`));
  return PlatformContributionResponseSchema.parse(rows);
};

const getSummaryAggregate = async (filter: RunRateFilter) => {
  const conditions = buildDailyConditions(filter);
  const [row] = await db
    .select({
      netSales: sql<string>`coalesce(sum(${dailyStorePerformance.netSales}), 0)`,
      netProfit: sql<string>`coalesce(sum(${dailyStorePerformance.netProfit}), 0)`,
      margin: sql<string>`coalesce(sum(${dailyStorePerformance.margin}), 0)`,
      marketingCost: sql<string>`coalesce(sum(${dailyStorePerformance.marketingCost}), 0)`,
      gmv: sql<string>`coalesce(sum(${dailyStorePerformance.gmv}), 0)`,
    })
    .from(dailyStorePerformance)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  return {
    netSales: toNumber(row?.netSales),
    netProfit: toNumber(row?.netProfit),
    margin: toNumber(row?.margin),
    marketingCost: toNumber(row?.marketingCost),
    gmv: toNumber(row?.gmv),
  };
};

export const getRunRateSummary = async (filter: RunRateFilter) => {
  const current = await getSummaryAggregate(filter);
  const last = filter.period
    ? await getSummaryAggregate({ ...filter, period: previousPeriod(filter.period) })
    : { netSales: 0, netProfit: 0, margin: 0, marketingCost: 0, gmv: 0 };
  return SummaryResponseSchema.parse({
    netSales: current.netSales,
    netProfit: current.netProfit,
    npm: calculateRatio(current.netProfit, current.netSales),
    margin: calculateRatio(current.margin, current.netSales),
    marketingCost: current.marketingCost,
    marketingRatio: calculateRatio(current.marketingCost, current.netSales),
    gmv: current.gmv,
    progressHari: calculateProgressHari(filter.period),
    vsLastMonth: {
      netSales: calculateRatio(current.netSales - last.netSales, last.netSales),
      netProfit: calculateRatio(current.netProfit - last.netProfit, last.netProfit),
      npm: calculateRatio(current.netProfit, current.netSales) - calculateRatio(last.netProfit, last.netSales),
    },
  });
};

export const getDailyPerformance = async (filter: RunRateFilter) => {
  const conditions = buildDailyConditions(filter);
  const rows = await db
    .select({
      date: dailyStorePerformance.date,
      netSales: sql<string>`coalesce(sum(${dailyStorePerformance.netSales}), 0)`,
      netProfit: sql<string>`coalesce(sum(${dailyStorePerformance.netProfit}), 0)`,
      marketingCost: sql<string>`coalesce(sum(${dailyStorePerformance.marketingCost}), 0)`,
      gmv: sql<string>`coalesce(sum(${dailyStorePerformance.gmv}), 0)`,
      liveGmv: sql<string>`coalesce(sum(${dailyStorePerformance.liveGmv}), 0)`,
    })
    .from(dailyStorePerformance)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(dailyStorePerformance.date)
    .orderBy(asc(dailyStorePerformance.date));
  return DailyResponseSchema.parse(
    rows.map((row) => {
      const netSales = toNumber(row.netSales);
      const netProfit = toNumber(row.netProfit);
      return { ...row, netSales, netProfit, npm: calculateRatio(netProfit, netSales), marketingCost: toNumber(row.marketingCost), gmv: toNumber(row.gmv), liveGmv: toNumber(row.liveGmv) };
    }),
  );
};

export const getProductPerformance = async (filter: ProductFilter) => {
  const conditions = buildSalesConditions(filter);
  const rows = await db
    .select({
      productId: products.id,
      productName: products.productName,
      invoiceCount: sql<number>`count(*)`,
      netSales: sql<string>`coalesce(sum(${salesLineItems.netSales}), 0)`,
      margin: sql<string>`coalesce(sum(${salesLineItems.marginRp}), 0)`,
      qty: sql<string>`coalesce(sum(${salesLineItems.qty}), 0)`,
      netProfit: sql<string>`coalesce(sum(${salesLineItems.netProfit}), 0)`,
      stok: sql<number | null>`max(${stockSnapshots.totalQty})`,
      estimasiHabisHari: sql<string | null>`max(${stockSnapshots.limit0Days})`,
    })
    .from(salesLineItems)
    .innerJoin(products, eq(salesLineItems.productId, products.id))
    .leftJoin(stockSnapshots, eq(salesLineItems.sku, stockSnapshots.sku))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(products.id, products.productName)
    .orderBy(orderProductBy(filter))
    .limit(200);
  const totalSales = rows.reduce((sum, row) => sum + toNumber(row.netSales), 0);
  const totalProfit = rows.reduce((sum, row) => sum + toNumber(row.netProfit), 0);
  const classified = classifyAll(
    rows.map((row) => {
      const netSales = toNumber(row.netSales);
      const netProfit = toNumber(row.netProfit);
      return {
        productId: row.productId,
        productName: row.productName,
        invoiceCount: Number(row.invoiceCount),
        netSales,
        margin: toNumber(row.margin),
        aov: calculateRatio(netSales, Number(row.invoiceCount)) / 100,
        npm: calculateRatio(netProfit, netSales),
        contributionSales: calculateRatio(netSales, totalSales),
        contributionProfit: calculateRatio(netProfit, totalProfit),
        netProfit,
        stok: row.stok,
        estimasiHabisHari: row.estimasiHabisHari === null ? null : toNumber(row.estimasiHabisHari),
      };
    }),
  );
  return ProductResponseSchema.parse(
    classified
      .filter((product) => !filter.klasifikasi || product.klasifikasi === filter.klasifikasi)
      .map((product) => ({
        productId: product.productId,
        productName: product.productName,
        invoiceCount: product.invoiceCount,
        netSales: product.netSales,
        margin: product.margin,
        aov: product.aov,
        npm: product.npm,
        contributionSales: product.contributionSales,
        contributionProfit: product.contributionProfit,
        klasifikasi: product.klasifikasi,
        stok: product.stok,
        estimasiHabisHari: product.estimasiHabisHari,
      })),
  );
};

export const getMarketingBreakdown = async (filter: MarketingFilter) => {
  const conditions = buildMarketingConditions(filter);
  const daily = await db
    .select({ date: marketingCosts.date, variable: marketingCosts.variable, totalCost: sql<string>`coalesce(sum(${marketingCosts.totalCost}), 0)` })
    .from(marketingCosts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(marketingCosts.date, marketingCosts.variable)
    .orderBy(asc(marketingCosts.date));
  const byChannel = Object.fromEntries(
    CHANNELS.map((channel) => [
      channel,
      daily.filter((row) => row.variable === channel).reduce((sum, row) => sum + toNumber(row.totalCost), 0),
    ]),
  );
  return MarketingResponseSchema.parse({
    total: Object.values(byChannel).reduce((sum, value) => sum + value, 0),
    byChannel,
    daily: daily.map((row) => ({ date: row.date, variable: row.variable, totalCost: toNumber(row.totalCost) })),
  });
};

export const getTargetProgress = async (filter: RunRateFilter) => {
  const period = filter.period ?? new Date().toISOString().slice(0, 7);
  const conditions = [
    eq(salesTargets.period, period),
    filter.storeId ? eq(salesTargets.storeId, filter.storeId) : undefined,
    filter.brandId ? eq(salesTargets.brandId, filter.brandId) : undefined,
  ].filter((condition): condition is SQL => condition !== undefined);
  const [targets, actual] = await Promise.all([
    db.select({ type: salesTargets.type, total: sql<string>`coalesce(sum(${salesTargets.nominal}), 0)` }).from(salesTargets).where(and(...conditions)).groupBy(salesTargets.type),
    getSummaryAggregate(filter),
  ]);
  const targetByType = (type: string): number => toNumber(targets.find((target) => target.type === type)?.total);
  const netSalesTarget = targetByType("net_sales");
  const marketingTarget = targetByType("marketing_cost");
  const netProfitTarget = targetByType("net_profit");
  return TargetProgressResponseSchema.parse({
    netSales: { target: netSalesTarget, aktual: actual.netSales, progress: calculateRatio(actual.netSales, netSalesTarget) },
    marketingCost: { target: marketingTarget, aktual: actual.marketingCost, efficiency: calculateRatio(actual.marketingCost, actual.netSales), gap: marketingTarget - actual.marketingCost },
    netProfit: { target: netProfitTarget, aktual: actual.netProfit, progress: calculateRatio(actual.netProfit, netProfitTarget) },
  });
};

export const getStockStatus = async (filter: StockFilter) => {
  const conditions = [
    filter.snapshotDate ? eq(stockSnapshots.snapshotDate, filter.snapshotDate) : undefined,
    filter.kategori ? ilike(stockSnapshots.category, `%${filter.kategori}%`) : undefined,
    filter.minDays !== undefined ? gte(stockSnapshots.limit0Days, String(filter.minDays)) : undefined,
    filter.maxDays !== undefined ? lte(stockSnapshots.limit0Days, String(filter.maxDays)) : undefined,
  ].filter((condition): condition is SQL => condition !== undefined);
  const orderBy = filter.sortBy === "total_qty"
    ? asc(stockSnapshots.totalQty)
    : filter.sortBy === "average_out"
      ? desc(stockSnapshots.averageOut)
      : asc(stockSnapshots.limit0Days);
  const rows = await db
    .select({
      productName: stockSnapshots.productName,
      sku: stockSnapshots.sku,
      totalQty: stockSnapshots.totalQty,
      averageOut: stockSnapshots.averageOut,
      limit0Days: stockSnapshots.limit0Days,
      dateLimit: stockSnapshots.dateLimit,
      qtyOpenPo: stockSnapshots.qtyOpenPo,
    })
    .from(stockSnapshots)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(500);
  return StockResponseSchema.parse(rows);
};

export const getMoMComparison = async (months: readonly string[], storeId?: number) => {
  const conditions = [
    inArray(sql<string>`to_char(${dailyStorePerformance.date}, 'YYYY-MM')`, [...months]),
    storeId ? eq(dailyStorePerformance.storeId, storeId) : undefined,
  ].filter((condition): condition is SQL => condition !== undefined);
  const rows = await db
    .select({
      month: sql<string>`to_char(${dailyStorePerformance.date}, 'YYYY-MM')`,
      date: dailyStorePerformance.date,
      dayOfMonth: sql<number>`extract(day from ${dailyStorePerformance.date})`,
      netSales: sql<string>`coalesce(sum(${dailyStorePerformance.netSales}), 0)`,
      netProfit: sql<string>`coalesce(sum(${dailyStorePerformance.netProfit}), 0)`,
    })
    .from(dailyStorePerformance)
    .where(and(...conditions))
    .groupBy(sql`to_char(${dailyStorePerformance.date}, 'YYYY-MM')`, dailyStorePerformance.date)
    .orderBy(asc(dailyStorePerformance.date));
  const previousByDay = new Map<string, number>();
  const mapped = rows.map((row) => {
    const previous = previousByDay.get(String(row.dayOfMonth)) ?? 0;
    const netSales = toNumber(row.netSales);
    previousByDay.set(String(row.dayOfMonth), netSales);
    const netProfit = toNumber(row.netProfit);
    return { month: row.month, date: row.date.slice(0, DATE_LENGTH), dayOfMonth: Number(row.dayOfMonth), netSales, netProfit, npm: calculateRatio(netProfit, netSales), chance: calculateRatio(netSales - previous, previous) };
  });
  return MoMResponseSchema.parse(mapped);
};

export const getDoDComparison = async (period: string, storeId?: number) =>
  getMoMComparison([period], storeId);
