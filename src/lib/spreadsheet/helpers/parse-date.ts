// Days between Excel epoch (Dec 30, 1899) and JS epoch (Jan 1, 1970)
const EXCEL_EPOCH_OFFSET_DAYS = 25569;
const MONTH_MAP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  mei: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  agu: 7,
  sep: 8,
  oct: 9,
  okt: 9,
  nov: 10,
  dec: 11,
  des: 11,
  januari: 0,
  februari: 1,
  maret: 2,
  april: 3,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  desember: 11,
};

export function parseExcelSerialDate(serial: number): string {
  const date = new Date((serial - EXCEL_EPOCH_OFFSET_DAYS) * 86400000);
  return toIsoDate(date);
}

function toIsoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseAnyDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    if (value > 40000 && value < 60000) return parseExcelSerialDate(value);
    return null;
  }

  if (value instanceof Date) return toIsoDate(value);

  const str = String(value).trim();
  if (!str) return null;

  // ISO format: 2026-04-01
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // 01-Apr-2026 or 01/Apr/2026
  const dmyMatch = str.match(/^(\d{1,2})[-/]([A-Za-z]+)[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const monthKey = dmyMatch[2].toLowerCase();
    const year = parseInt(dmyMatch[3], 10);
    const month = MONTH_MAP[monthKey];
    if (month !== undefined) {
      return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  // dd/mm/yyyy or dd-mm-yyyy
  const numericMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (numericMatch) {
    const day = numericMatch[1].padStart(2, "0");
    const month = numericMatch[2].padStart(2, "0");
    const year = numericMatch[3];
    return `${year}-${month}-${day}`;
  }

  return null;
}

export function parsePeriod(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    if (value > 40000 && value < 60000) {
      const dateStr = parseExcelSerialDate(value);
      return dateStr.substring(0, 7);
    }
    return null;
  }

  const str = String(value).trim();

  // Already in YYYY-MM
  if (/^\d{4}-\d{2}$/.test(str)) return str;

  // "April-2026" or "April 2026"
  const monthYearMatch = str.match(/^([A-Za-z]+)[-\s]+(\d{4})$/);
  if (monthYearMatch) {
    const monthKey = monthYearMatch[1].toLowerCase();
    const year = monthYearMatch[2];
    const month = MONTH_MAP[monthKey];
    if (month !== undefined) {
      return `${year}-${String(month + 1).padStart(2, "0")}`;
    }
  }

  // "MEI 2026" -> already handled above (uppercase)
  return null;
}

export function getDayNameFromDate(dateStr: string, locale = "id-ID"): string {
  try {
    const date = new Date(dateStr + "T00:00:00Z");
    return date.toLocaleDateString(locale, { weekday: "long", timeZone: "UTC" });
  } catch {
    return "";
  }
}
