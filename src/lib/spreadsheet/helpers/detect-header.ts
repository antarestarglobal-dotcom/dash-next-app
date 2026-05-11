export function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

export function findHeaderRow(
  rows: unknown[][],
  requiredColumns: string[],
  startRow = 0,
  maxScan = 20,
): number {
  const limit = Math.min(startRow + maxScan, rows.length);
  for (let i = startRow; i < limit; i++) {
    const row = rows[i];
    if (!row) continue;
    const cells = row.map((c) => cellToString(c));
    const matched = requiredColumns.filter((col) =>
      cells.some((cell) => cell.includes(col.toLowerCase())),
    );
    if (matched.length === requiredColumns.length) return i;
  }
  return -1;
}

export function mapHeaderColumns(
  headerRow: unknown[],
  columnAliases: Record<string, string[]>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, aliases] of Object.entries(columnAliases)) {
    for (let i = 0; i < headerRow.length; i++) {
      const cell = cellToString(headerRow[i]);
      if (aliases.some((alias) => cell.includes(alias.toLowerCase()))) {
        if (!(key in result)) result[key] = i;
      }
    }
  }
  return result;
}
