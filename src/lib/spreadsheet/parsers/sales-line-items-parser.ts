import { z } from "zod";
import { parseAnyDate } from "../helpers/parse-date";
import { parseIndonesianNumber, parseIndonesianPercent } from "../helpers/parse-number";
import { buildColumnMap, findHeaderRow, getCell, nonEmptyDataRows, textCell } from "./run-rate-parser-utils";

export const SalesLineItemRowSchema = z.object({
  date: z.string().date(),
  platform: z.string().min(1),
  store: z.string().min(1),
  brand: z.string().min(1),
  kategori: z.string().nullable(),
  produk: z.string().min(1),
  sku: z.string().min(1),
  qty: z.number().int(),
  hargaJual: z.number().nonnegative(),
  hpp: z.number().nonnegative(),
  marginRp: z.number(),
  marginPct: z.number(),
  netSales: z.number(),
  netProfit: z.number(),
});

export const SalesLineItemsParseResultSchema = z.object({
  templateType: z.literal("sales_line_items"),
  summary: z.object({ totalRows: z.number(), validRows: z.number(), rejectedRowsCount: z.number() }),
  rows: z.array(SalesLineItemRowSchema),
  warnings: z.array(z.string()),
  rejectedRows: z.array(z.object({ rowIndex: z.number(), reason: z.string(), raw: z.array(z.unknown()) })),
});

export type SalesLineItemRow = z.infer<typeof SalesLineItemRowSchema>;
export type SalesLineItemsParseResult = z.infer<typeof SalesLineItemsParseResultSchema>;

const toRawSalesRow = (row: readonly unknown[], columns: ReadonlyMap<string, number>) => ({
  date: parseAnyDate(getCell(row, columns, ["tanggal", "date"])),
  platform: textCell(getCell(row, columns, ["platform"])),
  store: textCell(getCell(row, columns, ["store"])),
  brand: textCell(getCell(row, columns, ["brand"])),
  kategori: textCell(getCell(row, columns, ["kategori", "category"])) || null,
  produk: textCell(getCell(row, columns, ["produk", "product"])),
  sku: textCell(getCell(row, columns, ["sku"])),
  qty: Math.round(parseIndonesianNumber(getCell(row, columns, ["qty", "quantity"])) ?? 0),
  hargaJual: parseIndonesianNumber(getCell(row, columns, ["harga jual", "price"])) ?? 0,
  hpp: parseIndonesianNumber(getCell(row, columns, ["hpp", "cogs", "cost of goods"])) ?? 0,
  marginRp: parseIndonesianNumber(getCell(row, columns, ["margin rp", "profit", "gross profit"])) ?? 0,
  marginPct: parseIndonesianPercent(getCell(row, columns, ["margin %", "margin"])) ?? 0,
  netSales: parseIndonesianNumber(getCell(row, columns, ["net sales", "revenue"])) ?? 0,
  netProfit: parseIndonesianNumber(getCell(row, columns, ["net profit"])) ?? 0,
});

export const parseSalesLineItems = (rows: readonly unknown[][]): SalesLineItemsParseResult => {
  let headerIndex = findHeaderRow(rows, ["tanggal", "platform", "sku", "qty"]);
  if (headerIndex < 0) headerIndex = findHeaderRow(rows, ["date", "platform", "sku"]);
  if (headerIndex < 0) {
    return { templateType: "sales_line_items", summary: { totalRows: 0, validRows: 0, rejectedRowsCount: 0 }, rows: [], warnings: ["Header Sales tidak ditemukan"], rejectedRows: [] };
  }
  const header = rows[headerIndex] ?? [];
  const columns = buildColumnMap(header);
  const parsed = nonEmptyDataRows(rows, headerIndex).map((row, index) => ({ row, index, parsed: SalesLineItemRowSchema.safeParse(toRawSalesRow(row, columns)) }));
  const validRows = parsed.flatMap((entry) => (entry.parsed.success ? [entry.parsed.data] : []));
  const rejectedRows = parsed.flatMap((entry) => entry.parsed.success ? [] : [{ rowIndex: headerIndex + entry.index + 2, reason: entry.parsed.error.message, raw: [...entry.row] }]);
  return SalesLineItemsParseResultSchema.parse({ templateType: "sales_line_items", summary: { totalRows: parsed.length, validRows: validRows.length, rejectedRowsCount: rejectedRows.length }, rows: validRows, warnings: [], rejectedRows });
};
