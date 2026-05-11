const CELL_ERROR_PATTERN = /^#(REF|VALUE|DIV\/0|N\/A|NAME|NULL|NUM)!?$/;

export function parseIndonesianNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const str = String(value).trim();
  if (!str || CELL_ERROR_PATTERN.test(str)) return null;

  let cleaned = str;

  // Remove currency prefix Rp
  cleaned = cleaned.replace(/^Rp\s*/i, "");

  // Handle juta shorthand: 133,8jt -> 133800000
  const jutaMatch = cleaned.match(/^([\d.,]+)\s*jt$/i);
  if (jutaMatch) {
    const base = parseIndonesianNumber(jutaMatch[1]);
    return base !== null ? Math.round(base * 1_000_000) : null;
  }

  // Remove percent sign
  cleaned = cleaned.replace(/%$/, "");

  // Detect thousand separator pattern: e.g. 206.147.816 or 1.234,56
  const hasMultipleDots = (cleaned.match(/\./g) ?? []).length > 1;
  const hasCommaDecimal = cleaned.includes(",") && cleaned.indexOf(",") > cleaned.lastIndexOf(".");

  if (hasMultipleDots) {
    // 206.147.816 style (dots as thousand sep, no decimal)
    cleaned = cleaned.replace(/\./g, "");
    if (cleaned.includes(",")) {
      cleaned = cleaned.replace(",", ".");
    }
  } else if (hasCommaDecimal) {
    // 1.234,56 style
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",") && !cleaned.includes(".")) {
    // 3,65 -> 3.65 (comma as decimal)
    cleaned = cleaned.replace(",", ".");
  } else if (cleaned.includes(".") && !cleaned.includes(",")) {
    // 3.65 or 206147816.0 - keep as is
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function parseIndonesianPercent(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    // Excel stores percent as fraction: 0.0365 = 3.65%
    if (value > 0 && value < 1) return Math.round(value * 10000) / 100;
    return value;
  }
  const str = String(value).trim();
  if (str.endsWith("%")) {
    const num = parseIndonesianNumber(str.replace(/%$/, ""));
    return num;
  }
  return parseIndonesianNumber(str);
}
