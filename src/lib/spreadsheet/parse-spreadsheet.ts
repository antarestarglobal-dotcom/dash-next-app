import ExcelJS from "exceljs";
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
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// ─── File signature detection ────────────────────────────────────────────────

function detectFileSignature(buffer: Buffer): "xlsx" | "xls" | "csv" | "unknown" {
  if (buffer.length < 4) return "unknown";
  // XLSX = ZIP magic bytes PK (0x50 0x4B)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) return "xlsx";
  // XLS = OLE2 compound document (0xD0 0xCF 0x11 0xE0)
  if (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0)
    return "xls";
  // CSV has no magic bytes — detect by UTF-8 printable content
  const sample = buffer.slice(0, 512).toString("utf8");
  if (/^[\x09\x0a\x0d\x20-\x7e-￿]*$/.test(sample)) return "csv";
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

// ─── ExcelJS reader (XLSX only) ───────────────────────────────────────────────

function getCellValue(cell: ExcelJS.Cell): unknown {
  const v = cell.value;
  if (v === null || v === undefined) return null;

  // Formula — use cached result
  if (typeof v === "object" && "formula" in v) {
    const fv = (v as ExcelJS.CellFormulaValue).result;
    if (fv instanceof Error) return null;
    return fv ?? null;
  }
  // Rich text — flatten to plain string
  if (typeof v === "object" && "richText" in v) {
    return (v as ExcelJS.CellRichTextValue).richText.map((rt) => rt.text).join("");
  }
  // Hyperlink — use display text or address
  if (typeof v === "object" && "text" in v && "hyperlink" in v) {
    const hv = v as ExcelJS.CellHyperlinkValue;
    return typeof hv.text === "string" ? hv.text : hv.hyperlink;
  }
  // Error cell
  if (typeof v === "object" && "error" in v) return null;
  // Date — keep as Date so parsers can handle it
  if (v instanceof Date) return v;

  return v;
}

function worksheetToRows(ws: ExcelJS.Worksheet, limit?: number): unknown[][] {
  const rows: unknown[][] = [];
  const maxRow = limit ? Math.min(ws.rowCount, limit) : ws.rowCount;

  for (let r = 1; r <= maxRow; r++) {
    const row = ws.getRow(r);
    const cells: unknown[] = [];
    let colCount = 0;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      colCount = colNumber;
      cells[colNumber - 1] = getCellValue(cell);
    });

    // Trim trailing nulls (match xlsx behaviour)
    while (cells.length > 0 && cells[cells.length - 1] === null) cells.pop();

    rows.push(cells.length > 0 ? cells : new Array(colCount).fill(null));
  }

  return rows;
}

async function readSheetsWithExcelJs(
  buffer: Buffer,
  limit?: number,
): Promise<Array<{ name: string; rows: unknown[][] }>> {
  const wb = new ExcelJS.Workbook();
  // ExcelJS types lag behind @types/node generic Buffer<T>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(buffer as any);

  const result: Array<{ name: string; rows: unknown[][] }> = [];
  wb.eachSheet((ws) => {
    result.push({ name: ws.name, rows: worksheetToRows(ws, limit) });
  });
  return result;
}

// ─── xlsx reader (XLS + CSV fallback) ────────────────────────────────────────

function readSheetsWithXlsx(
  buffer: Buffer,
  limit?: number,
): Array<{ name: string; rows: unknown[][] }> {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: false,
      raw: true,
      dense: false,
      ...(limit ? { sheetRows: limit } : {}),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`XLSX tidak dapat membaca file: ${msg}`);
  }

  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    let rows: unknown[][] = [];
    try {
      rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
        raw: true,
      }) as unknown[][];
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Gagal membaca isi sheet "${name}": ${msg}`);
    }
    return { name, rows };
  });
}

// ─── Unified dispatcher ───────────────────────────────────────────────────────

async function readAllSheets(
  buffer: Buffer,
  sig: "xlsx" | "xls" | "csv",
  limit?: number,
): Promise<Array<{ name: string; rows: unknown[][] }>> {
  if (sig === "xlsx") {
    return readSheetsWithExcelJs(buffer, limit);
  }
  // XLS and CSV fall back to xlsx library (sync, wrapped in promise)
  return readSheetsWithXlsx(buffer, limit);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseSpreadsheetBufferPreview(buffer: Buffer): Promise<SheetParseResult[]> {
  const sig = detectFileSignature(buffer);
  if (sig === "unknown") {
    return [
      {
        sheetName: "(error)",
        templateType: "unknown",
        parsed: null,
        error: "Format file tidak dikenali",
      },
    ];
  }

  let sheets: Array<{ name: string; rows: unknown[][] }>;
  try {
    sheets = await readAllSheets(buffer, sig, PREVIEW_ROW_LIMIT);
  } catch (err) {
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

  for (const { name: sheetName, rows } of sheets) {
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

export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "cohort_hourly",
): Promise<ParsedResultByTemplate["cohort_hourly"]>;
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "host_gmv",
): Promise<ParsedResultByTemplate["host_gmv"]>;
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "order_detail",
): Promise<ParsedResultByTemplate["order_detail"]>;
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "master_product",
): Promise<ParsedResultByTemplate["master_product"]>;
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "host_okr",
): Promise<ParsedResultByTemplate["host_okr"]>;
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "sales_line_items",
): Promise<ParsedResultByTemplate["sales_line_items"]>;
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "marketing_costs",
): Promise<ParsedResultByTemplate["marketing_costs"]>;
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "stock_snapshot",
): Promise<ParsedResultByTemplate["stock_snapshot"]>;
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "sales_targets",
): Promise<ParsedResultByTemplate["sales_targets"]>;
export function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: "daily_performance",
): Promise<ParsedResultByTemplate["daily_performance"]>;
export async function parseSpreadsheetSheetFull(
  buffer: Buffer,
  sheetName: string,
  templateType: ParsedTemplateType,
): Promise<ParsedResultByTemplate[ParsedTemplateType]> {
  const sig = detectFileSignature(buffer);
  if (sig === "unknown") throw new Error("Format file tidak dikenali");

  const sheets = await readAllSheets(buffer, sig);
  const target = sheets.find((s) => s.name === sheetName);
  if (!target) throw new Error(`Sheet "${sheetName}" tidak ditemukan`);

  const rows = target.rows;
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
