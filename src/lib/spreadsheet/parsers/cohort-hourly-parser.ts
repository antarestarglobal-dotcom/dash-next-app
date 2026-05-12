import { parseIndonesianNumber, parseIndonesianPercent } from "../helpers/parse-number";
import { parseAnyDate, parsePeriod, getDayNameFromDate } from "../helpers/parse-date";
import { detectHourFromHeader } from "../helpers/parse-time";
import { isEmptyRow, isStopRow } from "../helpers/normalize";
import type { CohortDailyRow, CohortMetadata } from "../../validators/import";

export interface CohortParseResult {
  templateType: "cohort_hourly";
  metadata: CohortMetadata;
  summary: {
    dailyRows: number;
    hourColumns: number;
    startDate: string | null;
    endDate: string | null;
    rejectedRowsCount: number;
  };
  dailyRows: CohortDailyRow[];
  warnings: string[];
  rejectedRows: Array<{ rowIndex: number; reason: string; raw: unknown[] }>;
}

const METADATA_KEYS: Record<string, string> = {
  periode: "period",
  metric: "metric",
  platform: "platform",
  brand: "brand",
  channel: "channel",
};

export function parseCohortHourly(rows: unknown[][]): CohortParseResult {
  const warnings: string[] = [];
  const rejectedRows: Array<{ rowIndex: number; reason: string; raw: unknown[] }> = [];

  // Step 1: Extract metadata from top rows
  const rawMetadata: Record<string, unknown> = {};
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    const key = String(row[0] ?? "")
      .trim()
      .toLowerCase()
      .replace(":", "");
    const metaKey = METADATA_KEYS[key];
    if (metaKey && !rawMetadata[metaKey]) {
      rawMetadata[metaKey] = row[1];
    }
  }

  const period = parsePeriod(rawMetadata.period) ?? "unknown";
  const metric = String(rawMetadata.metric ?? "net_sales")
    .toLowerCase()
    .replace(/\s+/g, "_");
  const platform = String(rawMetadata.platform ?? "unknown")
    .toLowerCase()
    .replace(/\s+/g, "_");
  const brand = String(rawMetadata.brand ?? "unknown");
  const channel = String(rawMetadata.channel ?? "unknown");

  // Step 2: Find header row
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    const cells = row.map((c) => String(c ?? "").trim().toLowerCase());
    const hasTanggal = cells.some((c) => c.includes("tanggal") || c.includes("date"));
    const hasTotal = cells.some((c) => c === "total");
    if (hasTanggal && hasTotal) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    return {
      templateType: "cohort_hourly",
      metadata: { period, metric, platform, brand, channel },
      summary: { dailyRows: 0, hourColumns: 0, startDate: null, endDate: null, rejectedRowsCount: 0 },
      dailyRows: [],
      warnings: ["Header row tidak ditemukan"],
      rejectedRows: [],
    };
  }

  const headerRow = rows[headerRowIdx];
  if (!headerRow) throw new Error("Header row is undefined");

  // Step 3: Map hour columns
  const hourColMap: Map<number, number> = new Map(); // col index -> hour
  let tanggalCol = -1;
  let hariCol = -1;
  let totalCol = -1;
  let percentCol = -1;

  for (let i = 0; i < headerRow.length; i++) {
    const cell = String(headerRow[i] ?? "").trim().toLowerCase();
    if (cell.includes("tanggal") || cell.includes("date")) tanggalCol = i;
    else if (cell === "hari" || cell.includes("day")) hariCol = i;
    else if (cell === "total") totalCol = i;
    else if (cell === "%") percentCol = i;
    else {
      const rawCell = headerRow[i];
      const hour = detectHourFromHeader(rawCell);
      if (hour !== null) hourColMap.set(i, hour);
    }
  }

  if (hourColMap.size < 24) {
    warnings.push(`Hanya ${hourColMap.size} kolom jam ditemukan (kurang dari 24).`);
  }

  // Step 4: Parse data rows
  const dailyRows: CohortDailyRow[] = [];

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || isEmptyRow(row)) continue;
    if (isStopRow(row)) break;

    const rawDate = tanggalCol >= 0 ? row[tanggalCol] : null;
    const dateStr = parseAnyDate(rawDate);

    if (!dateStr) {
      rejectedRows.push({ rowIndex: i, reason: "Tanggal tidak valid", raw: row });
      continue;
    }

    let dayName = hariCol >= 0 ? String(row[hariCol] ?? "").trim() : "";
    if (!dayName || /^\d/.test(dayName)) {
      dayName = getDayNameFromDate(dateStr);
    }

    const total = totalCol >= 0 ? parseIndonesianNumber(row[totalCol]) : null;
    const contributionPercent =
      percentCol >= 0 ? parseIndonesianPercent(row[percentCol]) : null;

    const hours = Array.from(hourColMap.entries()).map(([colIdx, hour]) => ({
      hour,
      valuePercent: parseIndonesianPercent(row[colIdx]),
    }));

    dailyRows.push({ date: dateStr, dayName, total, contributionPercent, hours });
  }

  const dates = dailyRows.map((r) => r.date).sort();

  return {
    templateType: "cohort_hourly",
    metadata: { period, metric, platform, brand, channel },
    summary: {
      dailyRows: dailyRows.length,
      hourColumns: hourColMap.size,
      startDate: dates[0] ?? null,
      endDate: dates[dates.length - 1] ?? null,
      rejectedRowsCount: rejectedRows.length,
    },
    dailyRows,
    warnings,
    rejectedRows,
  };
}
