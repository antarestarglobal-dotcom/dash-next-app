import { db } from "@/db";
import {
  brands,
  platforms,
  channels,
  hosts,
  dailyMetrics,
  hourlyMetricBreakdowns,
  orders,
  products,
  productBundles,
  bundleItems,
  hostShiftGmv,
  hostOkr,
  stores,
  salesLineItems,
  marketingCosts,
  stockSnapshots,
  salesTargets,
  dailyStorePerformance,
  dailyMarketingBreakdown,
} from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { getImportById, updateImportStatus } from "./import-repository";
import { parseSpreadsheetSheetFull } from "@/lib/spreadsheet/parse-spreadsheet";
import { logInfo, logWarn, logError } from "@/lib/logger";
import { z } from "zod";
import { DomainError } from "@/lib/errors/domain-error";
import type {
  CohortParseResult,
} from "@/lib/spreadsheet/parsers/cohort-hourly-parser";
import type { HostGmvParseResult } from "@/lib/spreadsheet/parsers/host-gmv-parser";
import type { OrderDetailParseResult } from "@/lib/spreadsheet/parsers/order-detail-parser";
import type { MasterProductParseResult } from "@/lib/spreadsheet/parsers/master-product-parser";
import type { HostOkrParseResult } from "@/lib/spreadsheet/parsers/host-okr-parser";
import type { SalesLineItemsParseResult } from "@/lib/spreadsheet/parsers/sales-line-items-parser";
import type { MarketingCostsParseResult } from "@/lib/spreadsheet/parsers/marketing-costs-parser";
import type { StockSnapshotParseResult } from "@/lib/spreadsheet/parsers/stock-snapshot-parser";
import type { SalesTargetsParseResult } from "@/lib/spreadsheet/parsers/sales-targets-parser";
import type { DailyPerformanceParseResult } from "@/lib/spreadsheet/parsers/daily-performance-parser";
import type { ParsedTemplateType } from "@/lib/domain/import-domain";

const CHUNK_SIZE = 2000;
const RawImportPayloadSchema = z.object({ fileBase64: z.string().min(1) });

function getRequiredMapValue(
  map: Map<string, number>,
  key: string,
  label: string,
): number {
  const value = map.get(key);
  if (!value) {
    throw new DomainError("IMPORT_REFERENCE_NOT_FOUND", `${label} "${key}" tidak ditemukan`, {
      label,
      key,
    });
  }
  return value;
}

// Batch upsert helpers — insert all unique names at once, then fetch IDs in one query.

async function batchUpsertBrands(names: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(names.filter(Boolean))];
  if (unique.length === 0) return new Map();
  await db.insert(brands).values(unique.map((name) => ({ name }))).onConflictDoNothing();
  const rows = await db
    .select({ id: brands.id, name: brands.name })
    .from(brands)
    .where(inArray(brands.name, unique));
  return new Map(rows.map((r) => [r.name, r.id]));
}

async function batchUpsertPlatforms(names: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(names.filter(Boolean))];
  if (unique.length === 0) return new Map();
  await db
    .insert(platforms)
    .values(unique.map((name) => ({ name, normalizedName: name.toLowerCase().replace(/\s+/g, "_") })))
    .onConflictDoNothing();
  const rows = await db
    .select({ id: platforms.id, name: platforms.name })
    .from(platforms)
    .where(inArray(platforms.name, unique));
  return new Map(rows.map((r) => [r.name, r.id]));
}

async function batchUpsertChannels(names: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(names.filter(Boolean))];
  if (unique.length === 0) return new Map();
  await db.insert(channels).values(unique.map((name) => ({ name }))).onConflictDoNothing();
  const rows = await db
    .select({ id: channels.id, name: channels.name })
    .from(channels)
    .where(inArray(channels.name, unique));
  return new Map(rows.map((r) => [r.name, r.id]));
}

async function batchUpsertHosts(names: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(names.filter(Boolean))];
  if (unique.length === 0) return new Map();
  await db.insert(hosts).values(unique.map((name) => ({ name }))).onConflictDoNothing();
  const rows = await db
    .select({ id: hosts.id, name: hosts.name })
    .from(hosts)
    .where(inArray(hosts.name, unique));
  return new Map(rows.map((r) => [r.name, r.id]));
}

async function batchUpsertStores(rows: Array<{ platform: string; store: string }>): Promise<Map<string, number>> {
  const unique = deduplicateBy(
    rows.filter((row) => row.platform && row.store),
    (row) => `${row.platform.toLowerCase()}|${row.store.toLowerCase()}`,
  );
  if (unique.length === 0) return new Map();
  await db
    .insert(stores)
    .values(
      unique.map((row) => ({
        name: row.store,
        platform: row.platform.toLowerCase(),
        storeType: row.store.toLowerCase().includes(" mp") ? "mp" : row.store.toLowerCase().includes("sport") ? "sport" : "official",
      })),
    )
    .onConflictDoNothing();
  const dbRows = await db.select({ id: stores.id, name: stores.name, platform: stores.platform }).from(stores);
  return new Map(dbRows.map((row) => [`${row.platform.toLowerCase()}|${row.name.toLowerCase()}`, row.id]));
}

async function getProductIdBySkuMap(skus: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(skus.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await db
    .select({ id: products.id, variantSku: products.variantSku, productName: products.productName })
    .from(products)
    .where(inArray(products.variantSku, unique));
  return new Map(rows.map((row) => [row.variantSku, row.id]));
}

async function getProductIdByNameMap(names: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(names.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await db
    .select({ id: products.id, productName: products.productName })
    .from(products)
    .where(inArray(products.productName, unique));
  return new Map(rows.map((row) => [row.productName, row.id]));
}

// Deduplicate rows by a composite key — PostgreSQL rejects ON CONFLICT DO UPDATE
// when the VALUES list itself contains duplicate conflict targets.
function deduplicateBy<T>(rows: T[], key: (row: T) => string): T[] {
  const seen = new Map<string, T>();
  for (const row of rows) {
    seen.set(key(row), row); // last occurrence wins
  }
  const result = [...seen.values()];
  if (result.length < rows.length) {
    logWarn("deduplicateBy", `Removed ${rows.length - result.length} duplicate rows before upsert`);
  }
  return result;
}

async function confirmCohortHourly(
  parsed: CohortParseResult,
  importId: string,
): Promise<void> {
  const meta = parsed.metadata;
  const dailyRowsRaw = parsed.dailyRows;

  // Deduplicate by date before bulk upsert
  const dailyRowsData = deduplicateBy(dailyRowsRaw, (r) => r.date);
  logInfo("confirmCohortHourly", `Processing ${dailyRowsData.length} daily rows`, { importId });

  const brandMap = await batchUpsertBrands([meta.brand ?? "Unknown"]);
  const platformMap = await batchUpsertPlatforms([meta.platform ?? "unknown"]);
  const channelMap = await batchUpsertChannels([meta.channel ?? "Unknown"]);
  const brandKey = meta.brand ?? "Unknown";
  const platformKey = meta.platform ?? "unknown";
  const channelKey = meta.channel ?? "Unknown";
  const brandId = getRequiredMapValue(brandMap, brandKey, "Brand");
  const platformId = getRequiredMapValue(platformMap, platformKey, "Platform");
  const channelId = getRequiredMapValue(channelMap, channelKey, "Channel");
  const metric = meta.metric ?? "net_sales";

  const upserted = await db
    .insert(dailyMetrics)
    .values(
      dailyRowsData.map((row) => ({
        brandId,
        platformId,
        channelId,
        metric,
        date: row.date,
        dayName: row.dayName,
        total: row.total?.toString() ?? null,
        contributionPercent: row.contributionPercent?.toString() ?? null,
        sourceImportId: importId,
      })),
    )
    .onConflictDoUpdate({
      target: [
        dailyMetrics.brandId,
        dailyMetrics.platformId,
        dailyMetrics.channelId,
        dailyMetrics.metric,
        dailyMetrics.date,
      ],
      set: {
        dayName: sql`excluded.day_name`,
        total: sql`excluded.total`,
        contributionPercent: sql`excluded.contribution_percent`,
        sourceImportId: sql`excluded.source_import_id`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: dailyMetrics.id, date: dailyMetrics.date });

  const dateToId = new Map(upserted.map((r) => [r.date, r.id]));
  const dailyIds = upserted.map((r) => r.id);

  if (dailyIds.length > 0) {
    await db
      .delete(hourlyMetricBreakdowns)
      .where(inArray(hourlyMetricBreakdowns.dailyMetricId, dailyIds));
  }

  const hourlyValues = dailyRowsData.flatMap((row) => {
    const dailyMetricId = dateToId.get(row.date);
    if (!dailyMetricId) return [];
    // Deduplicate hourly rows within each day
    const uniqueHours = deduplicateBy(row.hours, (h) => String(h.hour));
    return uniqueHours.map((h) => ({
      dailyMetricId,
      hour: h.hour,
      valuePercent: h.valuePercent?.toString() ?? null,
    }));
  });

  logInfo("confirmCohortHourly", `Inserting ${hourlyValues.length} hourly breakdowns`, { importId });

  for (let i = 0; i < hourlyValues.length; i += CHUNK_SIZE) {
    await db.insert(hourlyMetricBreakdowns).values(hourlyValues.slice(i, i + CHUNK_SIZE));
  }
}

async function confirmHostGmv(
  parsed: HostGmvParseResult,
  importId: string,
): Promise<void> {
  const rawRows = parsed.rows;

  // Deduplicate by unique constraint: host+platform+date+shift
  const rows = deduplicateBy(rawRows, (r) => `${r.host}|${r.platform}|${r.date}|${r.shift}`);
  logInfo("confirmHostGmv", `Processing ${rows.length} rows`, { importId });

  const hostMap = await batchUpsertHosts([...new Set(rows.map((r) => r.host))]);
  const platformMap = await batchUpsertPlatforms([...new Set(rows.map((r) => r.platform))]);

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    logInfo("confirmHostGmv", `Chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(rows.length / CHUNK_SIZE)}`, { importId });
    await db
      .insert(hostShiftGmv)
      .values(
        chunk.map((row) => ({
          hostId: getRequiredMapValue(hostMap, row.host, "Host"),
          platformId: getRequiredMapValue(platformMap, row.platform, "Platform"),
          date: row.date,
          shift: row.shift,
          gmv: row.gmv?.toString() ?? null,
          sourceImportId: importId,
        })),
      )
      .onConflictDoUpdate({
        target: [hostShiftGmv.hostId, hostShiftGmv.platformId, hostShiftGmv.date, hostShiftGmv.shift],
        set: {
          gmv: sql`excluded.gmv`,
          sourceImportId: sql`excluded.source_import_id`,
          updatedAt: sql`now()`,
        },
      });
  }
}

async function confirmOrderDetail(
  parsed: OrderDetailParseResult,
  importId: string,
): Promise<void> {
  const orderRows = parsed.orders;

  logInfo("confirmOrderDetail", `Processing ${orderRows.length} rows`, { importId });

  // Build dimension maps once for the entire file
  const brandMap = await batchUpsertBrands(
    orderRows.map((r) => r.brand).filter((b): b is string => Boolean(b)),
  );
  const platformMap = await batchUpsertPlatforms(
    orderRows.map((r) => r.platform).filter((p): p is string => Boolean(p)),
  );

  for (let i = 0; i < orderRows.length; i += CHUNK_SIZE) {
    const chunk = orderRows.slice(i, i + CHUNK_SIZE);
    logInfo("confirmOrderDetail", `Chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(orderRows.length / CHUNK_SIZE)}`, { importId });
    await db
      .insert(orders)
      .values(
        chunk.map((row) => ({
          orderDate: row.orderDate,
          orderTime: row.orderTime ?? null,
          brandId: row.brand ? (brandMap.get(row.brand) ?? null) : null,
          platformId: row.platform ? (platformMap.get(row.platform) ?? null) : null,
          invoice: row.invoice,
          netSales: row.netSales?.toString() ?? null,
          sku: row.sku,
          quantity: row.quantity,
          sourceImportId: importId,
        })),
      )
      .onConflictDoNothing();
  }
}

async function confirmMasterProduct(
  parsed: MasterProductParseResult,
  importId: string,
): Promise<void> {
  const productRowsRaw = parsed.products;

  // Deduplicate products by variantSku
  const productRows = deduplicateBy(productRowsRaw, (r) => r.variantSku);
  logInfo("confirmMasterProduct", `Processing ${productRows.length} products`, { importId });

  const bundleRows = parsed.bundles;

  for (let i = 0; i < productRows.length; i += CHUNK_SIZE) {
    const chunk = productRows.slice(i, i + CHUNK_SIZE);
    await db
      .insert(products)
      .values(
        chunk.map((row) => ({
          category: row.category,
          productName: row.productName,
          parentSku: row.parentSku,
          variantName: row.variantName,
          variantSku: row.variantSku,
          hpp: row.hpp?.toString() ?? null,
          sellingPrice: row.sellingPrice?.toString() ?? null,
          sourceImportId: importId,
        })),
      )
      .onConflictDoUpdate({
        target: products.variantSku,
        set: {
          category: sql`excluded.category`,
          productName: sql`excluded.product_name`,
          parentSku: sql`excluded.parent_sku`,
          variantName: sql`excluded.variant_name`,
          hpp: sql`excluded.hpp`,
          sellingPrice: sql`excluded.selling_price`,
          sourceImportId: sql`excluded.source_import_id`,
          updatedAt: sql`now()`,
        },
      });
  }

  // Bundles are typically small — sequential upsert is fine
  for (const bundle of bundleRows) {
    const [upserted] = await db
      .insert(productBundles)
      .values({
        bundleName: bundle.bundleName,
        bundleCode: bundle.bundleCode,
        sourceImportId: importId,
      })
      .onConflictDoUpdate({
        target: productBundles.bundleCode,
        set: { bundleName: bundle.bundleName, sourceImportId: importId, updatedAt: sql`now()` },
      })
      .returning();

    if (!upserted) {
      throw new Error(`Gagal upsert bundle ${bundle.bundleCode}`);
    }

    await db.delete(bundleItems).where(eq(bundleItems.bundleId, upserted.id));
    if (bundle.items.length > 0) {
      await db.insert(bundleItems).values(
        bundle.items.map((item) => ({
          bundleId: upserted.id,
          productName: item.productName,
          quantity: item.quantity,
        })),
      );
    }
  }
}

async function confirmHostOkr(
  parsed: HostOkrParseResult,
  importId: string,
): Promise<void> {
  const rawRows = parsed.rows;

  // Deduplicate by unique constraint: host+platform+date+shift
  const rows = deduplicateBy(rawRows, (r) => `${r.host}|${r.platform}|${r.date}|${r.shift}`);
  logInfo("confirmHostOkr", `Processing ${rows.length} rows`, { importId });

  const hostMap = await batchUpsertHosts([...new Set(rows.map((r) => r.host))]);
  const platformMap = await batchUpsertPlatforms([...new Set(rows.map((r) => r.platform))]);

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    logInfo("confirmHostOkr", `Chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(rows.length / CHUNK_SIZE)}`, { importId });
    await db
      .insert(hostOkr)
      .values(
        chunk.map((row) => ({
          hostId: getRequiredMapValue(hostMap, row.host, "Host"),
          platformId: getRequiredMapValue(platformMap, row.platform, "Platform"),
          date: row.date,
          shift: row.shift,
          ctr: row.ctr?.toString() ?? null,
          aov: row.aov?.toString() ?? null,
          sourceImportId: importId,
        })),
      )
      .onConflictDoUpdate({
        target: [hostOkr.hostId, hostOkr.platformId, hostOkr.date, hostOkr.shift],
        set: {
          ctr: sql`excluded.ctr`,
          aov: sql`excluded.aov`,
          sourceImportId: sql`excluded.source_import_id`,
          updatedAt: sql`now()`,
        },
      });
  }
}

async function confirmSalesLineItems(parsed: SalesLineItemsParseResult, importId: string): Promise<void> {
  const rows = deduplicateBy(parsed.rows, (row) => `${row.date}|${row.platform}|${row.store}|${row.sku}|${row.produk}`);
  const brandMap = await batchUpsertBrands(rows.map((row) => row.brand));
  const storeMap = await batchUpsertStores(rows.map((row) => ({ platform: row.platform, store: row.store })));
  const productMap = await getProductIdBySkuMap(rows.map((row) => row.sku));
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await db.insert(salesLineItems).values(chunk.map((row) => ({
      date: row.date,
      storeId: storeMap.get(`${row.platform.toLowerCase()}|${row.store.toLowerCase()}`) ?? null,
      brandId: brandMap.get(row.brand) ?? null,
      productId: productMap.get(row.sku) ?? null,
      category: row.kategori,
      productName: row.produk,
      sku: row.sku,
      qty: row.qty,
      hargaJual: row.hargaJual.toString(),
      hpp: row.hpp.toString(),
      marginRp: row.marginRp.toString(),
      marginPct: row.marginPct.toString(),
      netSales: row.netSales.toString(),
      netProfit: row.netProfit.toString(),
      sourceImportId: importId,
    }))).onConflictDoUpdate({
      target: [salesLineItems.date, salesLineItems.storeId, salesLineItems.sku, salesLineItems.productName],
      set: { qty: sql`excluded.qty`, hargaJual: sql`excluded.harga_jual`, hpp: sql`excluded.hpp`, marginRp: sql`excluded.margin_rp`, marginPct: sql`excluded.margin_pct`, netSales: sql`excluded.net_sales`, netProfit: sql`excluded.net_profit`, sourceImportId: sql`excluded.source_import_id`, updatedAt: sql`now()` },
    });
  }
}

async function confirmMarketingCosts(parsed: MarketingCostsParseResult, importId: string): Promise<void> {
  const rows = deduplicateBy(parsed.rows, (row) => `${row.date}|${row.variable}|${row.platform}|${row.storeOrBrand}|${row.produk}|${row.sku}`);
  const brandMap = await batchUpsertBrands(rows.map((row) => row.storeOrBrand).filter((name): name is string => Boolean(name)));
  const storeMap = await batchUpsertStores(rows.map((row) => ({ platform: row.platform ?? "unknown", store: row.storeOrBrand ?? "Unknown" })));
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await db.insert(marketingCosts).values(chunk.map((row) => ({
      date: row.date,
      variable: row.variable,
      platform: row.platform,
      storeId: row.platform && row.storeOrBrand ? storeMap.get(`${row.platform.toLowerCase()}|${row.storeOrBrand.toLowerCase()}`) ?? null : null,
      brandId: row.storeOrBrand ? brandMap.get(row.storeOrBrand) ?? null : null,
      category: row.kategori,
      productName: row.produk,
      sku: row.sku,
      qty: row.qty,
      totalCost: row.totalBiaya.toString(),
      nilaiProduk: row.nilaiProduk?.toString() ?? null,
      ongkosKirim: row.ongkosKirim?.toString() ?? null,
      rateCard: row.rateCard?.toString() ?? null,
      slot: row.slot,
      keterangan: row.keterangan,
      sourceImportId: importId,
    }))).onConflictDoUpdate({
      target: [marketingCosts.date, marketingCosts.variable, marketingCosts.storeId, marketingCosts.brandId, marketingCosts.productName, marketingCosts.sku],
      set: { totalCost: sql`excluded.total_cost`, nilaiProduk: sql`excluded.nilai_produk`, ongkosKirim: sql`excluded.ongkos_kirim`, rateCard: sql`excluded.rate_card`, slot: sql`excluded.slot`, keterangan: sql`excluded.keterangan`, sourceImportId: sql`excluded.source_import_id`, updatedAt: sql`now()` },
    });
  }
}

async function confirmStockSnapshot(parsed: StockSnapshotParseResult, importId: string): Promise<void> {
  const snapshotDate = new Date().toISOString().slice(0, 10);
  const rows = deduplicateBy(parsed.rows, (row) => `${snapshotDate}|${row.sku}`);
  const productMap = await getProductIdBySkuMap(rows.map((row) => row.sku));
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await db.insert(stockSnapshots).values(chunk.map((row) => ({
      snapshotDate,
      productId: productMap.get(row.sku) ?? null,
      productName: row.productName,
      sku: row.sku,
      category: row.category,
      hpp: row.hpp?.toString() ?? null,
      totalQty: row.qty,
      averageOut: row.averageOut?.toString() ?? null,
      averageRound: row.averageRound?.toString() ?? null,
      limit0Days: row.limit0Days?.toString() ?? null,
      dateLimit: row.dateLimit,
      qtyOpenPo: row.qtyOpenPo,
      sourceImportId: importId,
    }))).onConflictDoUpdate({
      target: [stockSnapshots.snapshotDate, stockSnapshots.sku],
      set: { totalQty: sql`excluded.total_qty`, averageOut: sql`excluded.average_out`, averageRound: sql`excluded.average_round`, limit0Days: sql`excluded.limit_0_days`, dateLimit: sql`excluded.date_limit`, qtyOpenPo: sql`excluded.qty_open_po`, sourceImportId: sql`excluded.source_import_id`, updatedAt: sql`now()` },
    });
  }
}

async function confirmSalesTargets(parsed: SalesTargetsParseResult, importId: string): Promise<void> {
  const rows = deduplicateBy(parsed.rows, (row) => `${row.period}|${row.brand}|${row.produk}|${row.platform}|${row.type}`);
  const brandMap = await batchUpsertBrands(rows.map((row) => row.brand));
  const productMap = await getProductIdByNameMap(rows.map((row) => row.produk).filter((name): name is string => Boolean(name)));
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await db.insert(salesTargets).values(chunk.map((row) => ({
      period: row.period,
      brandId: brandMap.get(row.brand) ?? null,
      productId: row.produk ? productMap.get(row.produk) ?? null : null,
      storeId: null,
      platform: row.platform,
      type: row.type,
      nominal: row.nominal.toString(),
      sourceImportId: importId,
    }))).onConflictDoUpdate({
      target: [salesTargets.period, salesTargets.brandId, salesTargets.productId, salesTargets.storeId, salesTargets.type],
      set: { nominal: sql`excluded.nominal`, platform: sql`excluded.platform`, sourceImportId: sql`excluded.source_import_id`, updatedAt: sql`now()` },
    });
  }
}

async function confirmDailyPerformance(parsed: DailyPerformanceParseResult, importId: string): Promise<void> {
  const rows = deduplicateBy(parsed.rows, (row) => row.date);
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await db.insert(dailyStorePerformance).values(chunk.map((row) => ({
      date: row.date,
      storeId: null,
      brandId: null,
      netSales: row.netSales.toString(),
      margin: row.margin.toString(),
      gpm: row.gpm.toString(),
      marketingCost: row.marketingCost.toString(),
      marketingRatio: row.marketingRatio.toString(),
      netProfit: row.netProfit.toString(),
      npm: row.npm.toString(),
      totalIklan: row.totalIklan.toString(),
      iklan: row.iklan.toString(),
      gmv: row.gmv.toString(),
      liveGmv: row.liveGmv.toString(),
      contribution: row.contribution.toString(),
      hawa: row.hawa.toString(),
      sourceImportId: importId,
    }))).onConflictDoUpdate({
      target: [dailyStorePerformance.date, dailyStorePerformance.storeId, dailyStorePerformance.brandId],
      set: { netSales: sql`excluded.net_sales`, margin: sql`excluded.margin`, gpm: sql`excluded.gpm`, marketingCost: sql`excluded.marketing_cost`, marketingRatio: sql`excluded.marketing_ratio`, netProfit: sql`excluded.net_profit`, npm: sql`excluded.npm`, totalIklan: sql`excluded.total_iklan`, iklan: sql`excluded.iklan`, gmv: sql`excluded.gmv`, liveGmv: sql`excluded.live_gmv`, contribution: sql`excluded.contribution`, hawa: sql`excluded.hawa`, sourceImportId: sql`excluded.source_import_id`, updatedAt: sql`now()` },
    });
  }
  if (parsed.breakdownRows.length > 0) {
    await db.insert(dailyMarketingBreakdown).values(parsed.breakdownRows.map((row) => ({
      date: row.date,
      storeId: null,
      brandId: null,
      variable: row.variable,
      contribution: row.contribution.toString(),
      hawa: row.hawa.toString(),
      totalCost: row.hawa.toString(),
      sourceImportId: importId,
    }))).onConflictDoUpdate({
      target: [dailyMarketingBreakdown.date, dailyMarketingBreakdown.storeId, dailyMarketingBreakdown.brandId, dailyMarketingBreakdown.variable],
      set: { contribution: sql`excluded.contribution`, hawa: sql`excluded.hawa`, totalCost: sql`excluded.total_cost`, sourceImportId: sql`excluded.source_import_id`, updatedAt: sql`now()` },
    });
  }
}

export async function confirmImport(importId: string): Promise<void> {
  const t0 = Date.now();
  const importRecord = await getImportById(importId);

  if (!importRecord) throw new DomainError("IMPORT_NOT_FOUND", "Import tidak ditemukan", { importId });
  if (importRecord.status === "imported") {
    throw new DomainError("IMPORT_ALREADY_CONFIRMED", "Import sudah dikonfirmasi", { importId });
  }
  if (importRecord.status === "failed") {
    throw new DomainError("IMPORT_FAILED_STATE", "Import gagal, tidak bisa dikonfirmasi", {
      importId,
    });
  }
  if (importRecord.templateType === "unknown") {
    throw new DomainError("IMPORT_UNKNOWN_TEMPLATE", "Template type unknown tidak dapat dikonfirmasi", {
      importId,
      templateType: importRecord.templateType,
    });
  }

  const templateType: ParsedTemplateType = importRecord.templateType;

  logInfo("confirmImport", `Starting confirm`, { importId, templateType });

  const parsedRaw = RawImportPayloadSchema.safeParse(importRecord.rawJson);
  if (!parsedRaw.success) {
    throw new DomainError(
      "IMPORT_ORIGINAL_FILE_MISSING",
      "File original tidak ditemukan, upload ulang untuk import",
      { importId },
    );
  }

  const fileBase64 = parsedRaw.data.fileBase64;

  const fileBuffer = Buffer.from(fileBase64, "base64");
  const sheetName = importRecord.sheetName ?? "";

  try {
    switch (templateType) {
      case "cohort_hourly":
        await confirmCohortHourly(
          parseSpreadsheetSheetFull(fileBuffer, sheetName, "cohort_hourly"),
          importId,
        );
        break;
      case "host_gmv":
        await confirmHostGmv(parseSpreadsheetSheetFull(fileBuffer, sheetName, "host_gmv"), importId);
        break;
      case "order_detail":
        await confirmOrderDetail(
          parseSpreadsheetSheetFull(fileBuffer, sheetName, "order_detail"),
          importId,
        );
        break;
      case "master_product":
        await confirmMasterProduct(
          parseSpreadsheetSheetFull(fileBuffer, sheetName, "master_product"),
          importId,
        );
        break;
      case "host_okr":
        await confirmHostOkr(parseSpreadsheetSheetFull(fileBuffer, sheetName, "host_okr"), importId);
        break;
      case "sales_line_items":
        await confirmSalesLineItems(parseSpreadsheetSheetFull(fileBuffer, sheetName, "sales_line_items"), importId);
        break;
      case "marketing_costs":
        await confirmMarketingCosts(parseSpreadsheetSheetFull(fileBuffer, sheetName, "marketing_costs"), importId);
        break;
      case "stock_snapshot":
        await confirmStockSnapshot(parseSpreadsheetSheetFull(fileBuffer, sheetName, "stock_snapshot"), importId);
        break;
      case "sales_targets":
        await confirmSalesTargets(parseSpreadsheetSheetFull(fileBuffer, sheetName, "sales_targets"), importId);
        break;
      case "daily_performance":
        await confirmDailyPerformance(parseSpreadsheetSheetFull(fileBuffer, sheetName, "daily_performance"), importId);
        break;
    }

    logInfo("confirmImport", `Parse complete`, { importId, templateType });

    await updateImportStatus(importId, "imported");
    logInfo("confirmImport", `Done in ${Date.now() - t0}ms`, { importId, templateType });
  } catch (err) {
    logError("confirmImport", err, { importId, templateType });
    await updateImportStatus(
      importId,
      "failed",
      err instanceof Error ? err.message : "Confirm error",
    );
    throw err;
  }
}
