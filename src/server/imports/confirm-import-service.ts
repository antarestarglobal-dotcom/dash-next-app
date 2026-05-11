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
} from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { getImportById, updateImportStatus } from "./import-repository";
import { parseSpreadsheetSheetFull } from "@/lib/spreadsheet/parse-spreadsheet";
import { logInfo, logWarn, logError } from "@/lib/logger";
import type { TemplateType } from "@/lib/validators/import";

const CHUNK_SIZE = 2000;

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
  parsed: Record<string, unknown>,
  importId: string,
): Promise<void> {
  const meta = parsed.metadata as Record<string, string>;
  const dailyRowsRaw = parsed.dailyRows as Array<{
    date: string;
    dayName: string;
    total: number | null;
    contributionPercent: number | null;
    hours: Array<{ hour: number; valuePercent: number | null }>;
  }>;

  // Deduplicate by date before bulk upsert
  const dailyRowsData = deduplicateBy(dailyRowsRaw, (r) => r.date);
  logInfo("confirmCohortHourly", `Processing ${dailyRowsData.length} daily rows`, { importId });

  const brandMap = await batchUpsertBrands([meta.brand ?? "Unknown"]);
  const platformMap = await batchUpsertPlatforms([meta.platform ?? "unknown"]);
  const channelMap = await batchUpsertChannels([meta.channel ?? "Unknown"]);
  const brandId = brandMap.get(meta.brand ?? "Unknown")!;
  const platformId = platformMap.get(meta.platform ?? "unknown")!;
  const channelId = channelMap.get(meta.channel ?? "Unknown")!;
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
  parsed: Record<string, unknown>,
  importId: string,
): Promise<void> {
  const rawRows = parsed.rows as Array<{
    host: string;
    date: string;
    platform: string;
    shift: string;
    gmv: number | null;
  }>;

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
          hostId: hostMap.get(row.host)!,
          platformId: platformMap.get(row.platform)!,
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
  parsed: Record<string, unknown>,
  importId: string,
): Promise<void> {
  const orderRows = parsed.orders as Array<{
    orderDate: string;
    orderTime: string | null;
    brand: string | null;
    platform: string | null;
    invoice: string;
    netSales: number | null;
    sku: string | null;
    quantity: number | null;
  }>;

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
  parsed: Record<string, unknown>,
  importId: string,
): Promise<void> {
  const productRowsRaw = parsed.products as Array<{
    category: string | null;
    productName: string;
    parentSku: string | null;
    variantName: string | null;
    variantSku: string;
    hpp: number | null;
    sellingPrice: number | null;
  }>;

  // Deduplicate products by variantSku
  const productRows = deduplicateBy(productRowsRaw, (r) => r.variantSku);
  logInfo("confirmMasterProduct", `Processing ${productRows.length} products`, { importId });

  const bundleRows = parsed.bundles as Array<{
    bundleName: string;
    bundleCode: string;
    items: Array<{ productName: string; quantity: number }>;
  }>;

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

    await db.delete(bundleItems).where(eq(bundleItems.bundleId, upserted!.id));
    if (bundle.items.length > 0) {
      await db.insert(bundleItems).values(
        bundle.items.map((item) => ({
          bundleId: upserted!.id,
          productName: item.productName,
          quantity: item.quantity,
        })),
      );
    }
  }
}

async function confirmHostOkr(
  parsed: Record<string, unknown>,
  importId: string,
): Promise<void> {
  const rawRows = parsed.rows as Array<{
    host: string;
    date: string;
    platform: string;
    shift: string;
    ctr: number | null;
    aov: number | null;
  }>;

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
          hostId: hostMap.get(row.host)!,
          platformId: platformMap.get(row.platform)!,
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

export async function confirmImport(importId: string): Promise<void> {
  const t0 = Date.now();
  const importRecord = await getImportById(importId);

  if (!importRecord) throw new Error("Import tidak ditemukan");
  if (importRecord.status === "imported") throw new Error("Import sudah dikonfirmasi");
  if (importRecord.status === "failed") throw new Error("Import gagal, tidak bisa dikonfirmasi");

  const templateType = importRecord.templateType as TemplateType;
  const rawJson = importRecord.rawJson as Record<string, unknown>;

  logInfo("confirmImport", `Starting confirm`, { importId, templateType });

  const fileBase64 = rawJson.fileBase64 as string | undefined;
  if (!fileBase64) throw new Error("File original tidak ditemukan, upload ulang untuk import");

  const fileBuffer = Buffer.from(fileBase64, "base64");
  const sheetName = importRecord.sheetName ?? "";

  const parsed = parseSpreadsheetSheetFull(fileBuffer, sheetName, templateType);
  logInfo("confirmImport", `Parse complete`, { importId, templateType });

  try {
    switch (templateType) {
      case "cohort_hourly":
        await confirmCohortHourly(parsed, importId);
        break;
      case "host_gmv":
        await confirmHostGmv(parsed, importId);
        break;
      case "order_detail":
        await confirmOrderDetail(parsed, importId);
        break;
      case "master_product":
        await confirmMasterProduct(parsed, importId);
        break;
      case "host_okr":
        await confirmHostOkr(parsed, importId);
        break;
      default:
        throw new Error(`Template type "${templateType}" tidak didukung`);
    }

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
