import { parseIndonesianNumber } from "../helpers/parse-number";
import { parseAnyDate } from "../helpers/parse-date";
import { normalizePlatformName, normalizeShift, isEmptyRow } from "../helpers/normalize";
import { findHeaderRow } from "../helpers/detect-header";
import type { HostOkrRow } from "../../validators/import";

interface HostOkrParseResult {
  templateType: "host_okr";
  summary: { validRows: number; rejectedRowsCount: number };
  rows: HostOkrRow[];
  warnings: string[];
  rejectedRows: Array<{ rowIndex: number; reason: string; raw: unknown[] }>;
}

export function parseHostOkr(rows: unknown[][]): HostOkrParseResult {
  const warnings: string[] = [];
  const rejectedRows: Array<{ rowIndex: number; reason: string; raw: unknown[] }> = [];

  const headerIdx = findHeaderRow(rows, ["host", "tanggal", "shift"]);
  if (headerIdx === -1) {
    return {
      templateType: "host_okr",
      summary: { validRows: 0, rejectedRowsCount: 0 },
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
    else if (cell.includes("ctr")) colMap.ctr = i;
    else if (cell.includes("aov")) colMap.aov = i;
  }

  const parsedRows: HostOkrRow[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || isEmptyRow(row)) continue;

    const host = String(row[colMap.host ?? 0] ?? "").trim();
    if (!host) continue;

    const dateStr = parseAnyDate(row[colMap.date ?? 1]);
    if (!dateStr) {
      rejectedRows.push({ rowIndex: i, reason: "Tanggal tidak valid", raw: row });
      continue;
    }

    const platform = normalizePlatformName(row[colMap.platform ?? 2]);
    const shift = normalizeShift(row[colMap.shift ?? 3]);
    const ctr = colMap.ctr !== undefined ? parseIndonesianNumber(row[colMap.ctr]) : null;
    const aov = colMap.aov !== undefined ? parseIndonesianNumber(row[colMap.aov]) : null;

    parsedRows.push({ host, date: dateStr, platform, shift, ctr, aov });
  }

  if (colMap.ctr === undefined) warnings.push("Kolom CTR tidak ditemukan.");
  if (colMap.aov === undefined) warnings.push("Kolom AOV tidak ditemukan.");

  return {
    templateType: "host_okr",
    summary: { validRows: parsedRows.length, rejectedRowsCount: rejectedRows.length },
    rows: parsedRows,
    warnings,
    rejectedRows,
  };
}
