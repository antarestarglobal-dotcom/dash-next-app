import { isEmptyRow } from "../helpers/normalize";

export const normalizeHeader = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();

export const findHeaderRow = (rows: readonly unknown[][], required: readonly string[]): number =>
  rows.findIndex((row) => {
    const joined = row.map(normalizeHeader).join(" ");
    return required.every((header) => joined.includes(header));
  });

export const buildColumnMap = (row: readonly unknown[]): ReadonlyMap<string, number> =>
  new Map(row.map((cell, index) => [normalizeHeader(cell), index]));

export const getColumn = (columns: ReadonlyMap<string, number>, aliases: readonly string[]): number | null => {
  const entry = aliases
    .map((alias) => columns.get(normalizeHeader(alias)))
    .find((index) => index !== undefined);
  return entry ?? null;
};

export const getCell = (
  row: readonly unknown[],
  columns: ReadonlyMap<string, number>,
  aliases: readonly string[],
): unknown => {
  const index = getColumn(columns, aliases);
  return index === null ? null : row[index];
};

export const nonEmptyDataRows = (rows: readonly unknown[][], headerIndex: number): readonly unknown[][] =>
  rows.slice(headerIndex + 1).filter((row) => !isEmptyRow([...row]));

export const textCell = (value: unknown): string => String(value ?? "").trim();
