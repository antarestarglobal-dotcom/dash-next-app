import * as XLSX from "xlsx";
import { detectTemplateBySheetName, detectTemplateByHeaderScan } from "./template-detector";
import { parseCohortHourly, type CohortParseResult } from "./parsers/cohort-hourly-parser";
import { parseHostGmv, type HostGmvParseResult } from "./parsers/host-gmv-parser";
import { parseOrderDetail, type OrderDetailParseResult } from "./parsers/order-detail-parser";
import {
  parseMasterProduct,
  type MasterProductParseResult,
} from "./parsers/master-product-parser";
import { parseHostOkr, type HostOkrParseResult } from "./parsers/host-okr-parser";
import { parseSalesLineItems, type SalesLineItemsParseResult } from "./parsers/sales-line-items-parser";
import { parseMarketingCosts, type MarketingCostsParseResult } from "./parsers/marketing-costs-parser";
import { parseStockSnapshot, type StockSnapshotParseResult } from "./parsers/stock-snapshot-parser";
import { parseSalesTargets, type SalesTargetsParseResult } from "./parsers/sales-targets-parser";
import { parseDailyPerformance, type DailyPerformanceParseResult } from "./parsers/daily-performance-parser";
import type { ParsedTemplateType } from "@/lib/domain/import-domain";

export interface ParsedResultByTemplate {
  cohort_hourly: CohortParseResult;
  host_gmv: HostGmvParseResult;
  order_detail: OrderDetailParseResult;
  master_product: MasterProductParseResult;
  host_okr: HostOkrParseResult;
  sales_line_items: SalesLineItemsParseResult;
  marketing_costs: MarketingCostsParseResult;
  stock_snapshot: StockSnapshotParseResult;
  sales_targets: SalesTargetsParseResult;
  daily_performance: DailyPerformanceParseResult;
}

export type KnownSheetParseResult = {
  [K in ParsedTemplateType]: {
    sheetName: string;
    templateType: K;
    parsed: ParsedResultByTemplate[K] | null;
    error: string | null;
  };
}[ParsedTemplateType];

export type UnknownSheetParseResult = {
  sheetName: string;
  templateType: "unknown";
  parsed: null;
  error: string | null;
};

export type SheetParseResult = KnownSheetParseResult | UnknownSheetParseResult;

// Preview: read only first N rows per sheet to keep it fast
const PREVIEW_ROW_LIMIT = 150;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

// Magic bytes for supported formats
// XLSX = ZIP archive starting with PK (0x50 0x4B)
// XLS  = OLE2 compound doc starting with 0xD0 0xCF 0x11 0xE0
function detectFileSignature(buffer: Buffer): "xlsx" | "xls" | "csv" | "unknown" {
  if (buffer.length < 4) return "unknown";
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) return "xlsx";
  if (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0)
    return "xls";
  // CSV has no magic bytes — detect by trying to read as UTF-8 text
  const sample = buffer.slice(0, 512).toString("utf8");
  if (/^[\x09\x0a\x0d\x20-\x7e-￿]*$/.test(sample)) return "csv";
  return "unknown";
}

export function validateFileBuffer(
  buffer: Buffer,
  fileName: string,
): { ok: true } | { ok: false; error: string } {
  if (buffer.length === 0) {
    return { ok: false, error: "File kosong" };
  }
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `File terlalu besar (${(buffer.length / 1024 / 1024).toFixed(1)} MB). Maksimal 50 MB`,
    };
  }

  const sig = detectFileSignature(buffer);
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (sig === "unknown") {
    return {
      ok: false,
      error: `Format file tidak dikenali. Pastikan file adalah XLSX, XLS, atau CSV yang valid (bukan file rename)`,
    };
  }
  // Warn if extension doesn't match content (e.g., .xlsx renamed from something else)
  if (ext === "xlsx" && sig !== "xlsx") {
    return {
      ok: false,
      error: `File memiliki ekstensi .xlsx tetapi isinya bukan format XLSX yang valid`,
    };
  }
  if (ext === "xls" && sig !== "xls") {
    return {
      ok: false,
      error: `File memiliki ekstensi .xls tetapi isinya bukan format XLS yang valid`,
    };
  }

  return { ok: true };
}

function safeReadWorkbook(buffer: Buffer, sheetRows?: number): XLSX.WorkBook {
  try {
    return XLSX.read(buffer, {
      type: "buffer",
      cellDates: false,
      raw: true,
      dense: false,
      ...(sheetRows ? { sheetRows } : {}),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`XLSX tidak dapat membaca file: ${msg}`);
  }
}

function sheetToRows(sheet: XLSX.WorkSheet): unknown[][] {
  try {
    return XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      raw: true,
    }) as unknown[][];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Gagal membaca isi sheet: ${msg}`);
  }
}

export function parseSpreadsheetBufferPreview(buffer: Buffer): SheetParseResult[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = safeReadWorkbook(buffer, PREVIEW_ROW_LIMIT);
  } catch (err) {
    // Workbook-level parse failure — return one synthetic error result
    return [
      {
        sheetName: "(error)",
        templateType: "unknown",
        parsed: null,
        error: err instanceof Error ? err.message : "Gagal membaca workbook",
      },
    ];
  }

  const results: SheetParseResult[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    let rows: unknown[][];
    try {
      rows = sheetToRows(sheet);
    } catch (err) {
      results.push({
        sheetName,
        templateType: "unknown",
        parsed: null,
        error: err instanceof Error ? err.message : "Gagal membaca baris sheet",
      });
      continue;
    }

    let templateType = detectTemplateBySheetName(sheetName);
    if (templateType === "unknown") {
      templateType = detectTemplateByHeaderScan(rows);
    }

    if (templateType === "unknown") {
      results.push({ sheetName, templateType, parsed: null, error: null });
      continue;
    }

    try {
        switch (templateType) {
          case "cohort_hourly":
            results.push({
              sheetName,
              templateType,
              parsed: parseCohortHourly(rows),
              error: null,
            });
            break;
          case "host_gmv":
            results.push({ sheetName, templateType, parsed: parseHostGmv(rows), error: null });
            break;
          case "order_detail":
            results.push({
              sheetName,
              templateType,
              parsed: parseOrderDetail(rows, true, 50),
              error: null,
            });
            break;
          case "master_product":
            results.push({
              sheetName,
              templateType,
              parsed: parseMasterProduct(rows),
              error: null,
            });
            break;
          case "host_okr":
            results.push({ sheetName, templateType, parsed: parseHostOkr(rows), error: null });
            break;
          case "sales_line_items":
            results.push({ sheetName, templateType, parsed: parseSalesLineItems(rows), error: null });
            break;
          case "marketing_costs":
            results.push({ sheetName, templateType, parsed: parseMarketingCosts(rows), error: null });
            break;
          case "stock_snapshot":
            results.push({ sheetName, templateType, parsed: parseStockSnapshot(rows), error: null });
            break;
          case "sales_targets":
            results.push({ sheetName, templateType, parsed: parseSalesTargets(rows), error: null });
            break;
          case "daily_performance":
            results.push({ sheetName, templateType, parsed: parseDailyPerformance(rows), error: null });
            break;
        }
      } catch (err) {
        results.push({
          sheetName,
        templateType,
        parsed: null,
        error: err instanceof Error ? err.message : "Parse error",
      });
    }
  }

  return results;
}

// Full parse: reads all rows — used at confirm time
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "cohort_hourly",
): ParsedResultByTemplate["cohort_hourly"];
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "host_gmv",
): ParsedResultByTemplate["host_gmv"];
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "order_detail",
): ParsedResultByTemplate["order_detail"];
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "master_product",
): ParsedResultByTemplate["master_product"];
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "host_okr",
): ParsedResultByTemplate["host_okr"];
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "sales_line_items",
): ParsedResultByTemplate["sales_line_items"];
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "marketing_costs",
): ParsedResultByTemplate["marketing_costs"];
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "stock_snapshot",
): ParsedResultByTemplate["stock_snapshot"];
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "sales_targets",
): ParsedResultByTemplate["sales_targets"];
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "daily_performance",
): ParsedResultByTemplate["daily_performance"];
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: ParsedTemplateType,
): ParsedResultByTemplate[ParsedTemplateType] {
  const workbook = safeReadWorkbook(buffer);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet "${sheetName}" tidak ditemukan`);

  const rows = sheetToRows(sheet);

  switch (templateType) {
    case "cohort_hourly":
      return parseCohortHourly(rows);
    case "host_gmv":
      return parseHostGmv(rows);
    case "order_detail":
      return parseOrderDetail(rows, false);
    case "master_product":
      return parseMasterProduct(rows);
    case "host_okr":
      return parseHostOkr(rows);
    case "sales_line_items":
      return parseSalesLineItems(rows);
    case "marketing_costs":
      return parseMarketingCosts(rows);
    case "stock_snapshot":
      return parseStockSnapshot(rows);
    case "sales_targets":
      return parseSalesTargets(rows);
    case "daily_performance":
      return parseDailyPerformance(rows);
  }
}
