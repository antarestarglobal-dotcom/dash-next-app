import { db } from "@/db";
import { dailyMetrics, hourlyMetricBreakdowns, hostShiftGmv, hosts } from "@/db/schema";
import { eq, and, gte, lte, sql, desc, type SQL } from "drizzle-orm";
import type { DashboardFilter } from "@/lib/validators/dashboard";

function buildDailyMetricConditions(filters: DashboardFilter): SQL[] {
  const conditions: SQL[] = [];
  if (filters.brandId) conditions.push(eq(dailyMetrics.brandId, filters.brandId));
  if (filters.platformId) conditions.push(eq(dailyMetrics.platformId, filters.platformId));
  if (filters.channelId) conditions.push(eq(dailyMetrics.channelId, filters.channelId));
  if (filters.metric) conditions.push(eq(dailyMetrics.metric, filters.metric));
  if (filters.startDate) conditions.push(gte(dailyMetrics.date, filters.startDate));
  if (filters.endDate) conditions.push(lte(dailyMetrics.date, filters.endDate));
  return conditions;
}

function buildHostGmvConditions(filters: DashboardFilter): SQL[] {
  const conditions: SQL[] = [];
  if (filters.platformId) conditions.push(eq(hostShiftGmv.platformId, filters.platformId));
  if (filters.startDate) conditions.push(gte(hostShiftGmv.date, filters.startDate));
  if (filters.endDate) conditions.push(lte(hostShiftGmv.date, filters.endDate));
  return conditions;
}

export async function getDailyMetrics(filters: DashboardFilter) {
  const conditions = buildDailyMetricConditions(filters);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db.query.dailyMetrics.findMany({
    where,
    orderBy: [dailyMetrics.date],
  });
}

export async function getDashboardSummary(filters: DashboardFilter) {
  const conditions = buildDailyMetricConditions(filters);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [agg] = await db
    .select({
      totalMtd: sql<string>`sum(${dailyMetrics.total})`,
      dailyAvg: sql<string>`avg(${dailyMetrics.total})`,
      bestDayTotal: sql<string>`max(${dailyMetrics.total})`,
      rowCount: sql<number>`count(*)`,
    })
    .from(dailyMetrics)
    .where(where);

  return {
    totalMtd: agg?.totalMtd ? parseFloat(agg.totalMtd) : 0,
    dailyAvg: agg?.dailyAvg ? parseFloat(agg.dailyAvg) : 0,
    bestDayTotal: agg?.bestDayTotal ? parseFloat(agg.bestDayTotal) : 0,
    rowCount: Number(agg?.rowCount ?? 0),
  };
}

export async function getHourlyHeatmap(filters: DashboardFilter) {
  const metricConditions = buildDailyMetricConditions(filters);

  const metricWhere = metricConditions.length > 0 ? and(...metricConditions) : undefined;

  return db
    .select({
      date: dailyMetrics.date,
      hour: hourlyMetricBreakdowns.hour,
      valuePercent: hourlyMetricBreakdowns.valuePercent,
    })
    .from(hourlyMetricBreakdowns)
    .innerJoin(dailyMetrics, eq(hourlyMetricBreakdowns.dailyMetricId, dailyMetrics.id))
    .where(metricWhere)
    .orderBy(dailyMetrics.date, hourlyMetricBreakdowns.hour);
}

export async function getHostLeaderboard(filters: DashboardFilter) {
  const conditions = buildHostGmvConditions(filters);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      hostId: hostShiftGmv.hostId,
      hostName: hosts.name,
      totalGmv: sql<string>`sum(${hostShiftGmv.gmv})`,
    })
    .from(hostShiftGmv)
    .innerJoin(hosts, eq(hostShiftGmv.hostId, hosts.id))
    .where(where)
    .groupBy(hostShiftGmv.hostId, hosts.name)
    .orderBy(desc(sql`sum(${hostShiftGmv.gmv})`));
}

export async function getBestHour(filters: DashboardFilter) {
  const metricConditions = buildDailyMetricConditions(filters);

  const metricWhere = metricConditions.length > 0 ? and(...metricConditions) : undefined;

  const [row] = await db
    .select({
      hour: hourlyMetricBreakdowns.hour,
      avgPercent: sql<string>`avg(${hourlyMetricBreakdowns.valuePercent})`,
    })
    .from(hourlyMetricBreakdowns)
    .innerJoin(dailyMetrics, eq(hourlyMetricBreakdowns.dailyMetricId, dailyMetrics.id))
    .where(metricWhere)
    .groupBy(hourlyMetricBreakdowns.hour)
    .orderBy(desc(sql`avg(${hourlyMetricBreakdowns.valuePercent})`))
    .limit(1);

  return row
    ? { hour: row.hour, avgPercent: parseFloat(row.avgPercent) }
    : { hour: null, avgPercent: 0 };
}
