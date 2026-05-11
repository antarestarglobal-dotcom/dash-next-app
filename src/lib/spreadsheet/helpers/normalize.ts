export function normalizePlatformName(value: unknown): string {
  if (!value) return "unknown";
  const str = String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return str || "unknown";
}

export function normalizeMetricName(value: unknown): string {
  if (!value) return "unknown";
  const str = String(value).trim().toLowerCase().replace(/\s+/g, "_");
  return str || "unknown";
}

export function normalizeShift(value: unknown): string {
  if (!value) return "";
  return String(value).trim().toUpperCase().replace(/\s+/g, " ");
}

export function isEmptyRow(row: unknown[]): boolean {
  return row.every(
    (cell) => cell === null || cell === undefined || String(cell).trim() === "",
  );
}

const STOP_WORDS = ["total", "section", "summary", "grand total", "subtotal"];

export function isStopRow(row: unknown[]): boolean {
  const firstCell = String(row[0] ?? "")
    .trim()
    .toLowerCase();
  return STOP_WORDS.some((word) => firstCell === word || firstCell.startsWith(word + " "));
}
