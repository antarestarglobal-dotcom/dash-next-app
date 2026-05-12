import { z } from "zod";
import { parseAnyDate } from "../helpers/parse-date";
import { parseIndonesianNumber } from "../helpers/parse-number";
import { buildColumnMap, findHeaderRow, getCell, nonEmptyDataRows, textCell } from "./run-rate-parser-utils";

export const StockSnapshotRowSchema = z.object({
  productName: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().nullable(),
  hpp: z.number().nullable(),
  qty: z.number().int(),
  averageOut: z.number().nullable(),
  averageRound: z.number().nullable(),
  limit0Days: z.number().nullable(),
  dateLimit: z.string().date().nullable(),
  qtyOpenPo: z.number().int().nullable(),
});

export const StockSnapshotParseResultSchema = z.object({
  templateType: z.literal("stock_snapshot"),
  summary: z.object({ totalRows: z.number(), validRows: z.number(), rejectedRowsCount: z.number() }),
  rows: z.array(StockSnapshotRowSchema),
  warnings: z.array(z.string()),
  rejectedRows: z.array(z.object({ rowIndex: z.number(), reason: z.string(), raw: z.array(z.unknown()) })),
});

export type StockSnapshotRow = z.infer<typeof StockSnapshotRowSchema>;
export type StockSnapshotParseResult = z.infer<typeof StockSnapshotParseResultSchema>;

const toRawStockRow = (row: readonly unknown[], columns: ReadonlyMap<string, number>) => ({
  productName: textCell(getCell(row, columns, ["name", "produk"])),
  sku: textCell(getCell(row, columns, ["sku"])),
  category: textCell(getCell(row, columns, ["category", "kategori"])) || null,
  hpp: parseIndonesianNumber(getCell(row, columns, ["hpp"])),
  qty: Math.round(parseIndonesianNumber(getCell(row, columns, ["qty", "total qty"])) ?? 0),
  averageOut: parseIndonesianNumber(getCell(row, columns, ["average out"])),
  averageRound: parseIndonesianNumber(getCell(row, columns, ["average round"])),
  limit0Days: parseIndonesianNumber(getCell(row, columns, ["limit 0 days", "limit 0"])),
  dateLimit: parseAnyDate(getCell(row, columns, ["date limit"])),
  qtyOpenPo: Math.round(parseIndonesianNumber(getCell(row, columns, ["qty open po"])) ?? 0) || null,
});

export const parseStockSnapshot = (rows: readonly unknown[][]): StockSnapshotParseResult => {
  const headerIndex = findHeaderRow(rows, ["sku", "average out"]);
  if (headerIndex < 0) return { templateType: "stock_snapshot", summary: { totalRows: 0, validRows: 0, rejectedRowsCount: 0 }, rows: [], warnings: ["Header stok tidak ditemukan"], rejectedRows: [] };
  const columns = buildColumnMap(rows[headerIndex] ?? []);
  const parsed = nonEmptyDataRows(rows, headerIndex).map((row, index) => ({ row, index, parsed: StockSnapshotRowSchema.safeParse(toRawStockRow(row, columns)) }));
  const validRows = parsed.flatMap((entry) => (entry.parsed.success ? [entry.parsed.data] : []));
  const rejectedRows = parsed.flatMap((entry) => entry.parsed.success ? [] : [{ rowIndex: headerIndex + entry.index + 2, reason: entry.parsed.error.message, raw: [...entry.row] }]);
  return StockSnapshotParseResultSchema.parse({ templateType: "stock_snapshot", summary: { totalRows: parsed.length, validRows: validRows.length, rejectedRowsCount: rejectedRows.length }, rows: validRows, warnings: [], rejectedRows });
};
