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
import { z } from "zod";
import { DomainError } from "@/lib/errors/domain-error";
import type {
  CohortParseResult,
} from "@/lib/spreadsheet/parsers/cohort-hourly-parser";
import type { HostGmvParseResult } from "@/lib/spreadsheet/parsers/host-gmv-parser";
import type { OrderDetailParseResult } from "@/lib/spreadsheet/parsers/order-detail-parser";
import type { MasterProductParseResult } from "@/lib/spreadsheet/parsers/master-product-parser";
import type { HostOkrParseResult } from "@/lib/spreadsheet/parsers/host-okr-parser";
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
          await parseSpreadsheetSheetFull(fileBuffer, sheetName, "cohort_hourly"),
          importId,
        );
        break;
      case "host_gmv":
        await confirmHostGmv(await parseSpreadsheetSheetFull(fileBuffer, sheetName, "host_gmv"), importId);
        break;
      case "order_detail":
        await confirmOrderDetail(
          await parseSpreadsheetSheetFull(fileBuffer, sheetName, "order_detail"),
          importId,
        );
        break;
      case "master_product":
        await confirmMasterProduct(
          await parseSpreadsheetSheetFull(fileBuffer, sheetName, "master_product"),
          importId,
        );
        break;
      case "host_okr":
        await confirmHostOkr(await parseSpreadsheetSheetFull(fileBuffer, sheetName, "host_okr"), importId);
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
