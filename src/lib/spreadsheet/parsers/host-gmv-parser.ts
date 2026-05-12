import { parseIndonesianNumber } from "../helpers/parse-number";
import { parseAnyDate } from "../helpers/parse-date";
import { normalizePlatformName, normalizeShift, isEmptyRow } from "../helpers/normalize";
import { findHeaderRow } from "../helpers/detect-header";
import type { HostGmvRow } from "../../validators/import";

export interface HostGmvParseResult {
  templateType: "host_gmv";
  summary: {
    validRows: number;
    rejectedRowsCount: number;
    startDate: string | null;
    endDate: string | null;
  };
  rows: HostGmvRow[];
  warnings: string[];
  rejectedRows: Array<{ rowIndex: number; reason: string; raw: unknown[] }>;
}

export function parseHostGmv(rows: unknown[][]): HostGmvParseResult {
  const warnings: string[] = [];
  const rejectedRows: Array<{ rowIndex: number; reason: string; raw: unknown[] }> = [];

  const headerIdx = findHeaderRow(rows, ["host", "tanggal", "gmv"]);
  if (headerIdx === -1) {
    return {
      templateType: "host_gmv",
      summary: { validRows: 0, rejectedRowsCount: 0, startDate: null, endDate: null },
      rows: [],
      warnings: ["Header row tidak ditemukan"],
      rejectedRows: [],
    };
  }

  const header = rows[headerIdx]!;
  const colMap: Record<string, number> = {};
  for (let i = 0; i < header.length; i++) {
    const cell = String(header[i] ?? "").trim().toLowerCase();
    if (cell.includes("host")) colMap.host = i;
    else if (cell.includes("tanggal") || cell.includes("date")) colMap.date = i;
    else if (cell.includes("platform")) colMap.platform = i;
    else if (cell.includes("shift")) colMap.shift = i;
    else if (cell.includes("gmv")) colMap.gmv = i;
  }

  const parsedRows: HostGmvRow[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || isEmptyRow(row)) continue;

    const host = String(row[colMap.host ?? 0] ?? "").trim();
    if (!host) {
      rejectedRows.push({ rowIndex: i, reason: "Host kosong", raw: row });
      continue;
    }

    const dateStr = parseAnyDate(row[colMap.date ?? 1]);
    if (!dateStr) {
      rejectedRows.push({ rowIndex: i, reason: "Tanggal tidak valid", raw: row });
      continue;
    }

    const platform = normalizePlatformName(row[colMap.platform ?? 2]);
    const shift = normalizeShift(row[colMap.shift ?? 3]);
    const gmv = parseIndonesianNumber(row[colMap.gmv ?? 4]);

    parsedRows.push({ host, date: dateStr, platform, shift, gmv });
  }

  if (parsedRows.length === 0) {
    warnings.push("Tidak ada baris valid yang dapat diparsing.");
  }

  const dates = parsedRows.map((r) => r.date).sort();

  return {
    templateType: "host_gmv",
    summary: {
      validRows: parsedRows.length,
      rejectedRowsCount: rejectedRows.length,
      startDate: dates[0] ?? null,
      endDate: dates[dates.length - 1] ?? null,
    },
    rows: parsedRows,
    warnings,
    rejectedRows,
  };
}
