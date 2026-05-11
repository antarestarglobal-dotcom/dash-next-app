import * as XLSX from "xlsx";
import { detectTemplateBySheetName, detectTemplateByHeaderScan } from "./template-detector";
import { parseCohortHourly } from "./parsers/cohort-hourly-parser";
import { parseHostGmv } from "./parsers/host-gmv-parser";
import { parseOrderDetail } from "./parsers/order-detail-parser";
import { parseMasterProduct } from "./parsers/master-product-parser";
import { parseHostOkr } from "./parsers/host-okr-parser";
import type { TemplateType } from "../validators/import";

export interface SheetParseResult {
  sheetName: string;
  templateType: TemplateType;
  parsed: Record<string, unknown> | null;
  error: string | null;
}

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
      let parsed: Record<string, unknown>;

      switch (templateType) {
        case "cohort_hourly":
          parsed = parseCohortHourly(rows) as unknown as Record<string, unknown>;
          break;
        case "host_gmv":
          parsed = parseHostGmv(rows) as unknown as Record<string, unknown>;
          break;
        case "order_detail":
          parsed = parseOrderDetail(rows, true, 50) as unknown as Record<string, unknown>;
          break;
        case "master_product":
          parsed = parseMasterProduct(rows) as unknown as Record<string, unknown>;
          break;
        case "host_okr":
          parsed = parseHostOkr(rows) as unknown as Record<string, unknown>;
          break;
        default:
          parsed = {};
      }

      results.push({ sheetName, templateType, parsed, error: null });
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
  templateType: TemplateType,
): Record<string, unknown> {
  const workbook = safeReadWorkbook(buffer);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet "${sheetName}" tidak ditemukan`);

  const rows = sheetToRows(sheet);

  switch (templateType) {
    case "cohort_hourly":
      return parseCohortHourly(rows) as unknown as Record<string, unknown>;
    case "host_gmv":
      return parseHostGmv(rows) as unknown as Record<string, unknown>;
    case "order_detail":
      return parseOrderDetail(rows, false) as unknown as Record<string, unknown>;
    case "master_product":
      return parseMasterProduct(rows) as unknown as Record<string, unknown>;
    case "host_okr":
      return parseHostOkr(rows) as unknown as Record<string, unknown>;
    default:
      throw new Error(`Template type "${templateType}" tidak didukung`);
  }
}
