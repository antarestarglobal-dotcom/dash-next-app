import { z } from "zod";
import { parseAnyDate } from "../helpers/parse-date";
import { parseIndonesianNumber } from "../helpers/parse-number";
import { buildColumnMap, findHeaderRow, getCell, nonEmptyDataRows, textCell } from "./run-rate-parser-utils";

const VariableSchema = z.enum(["voucher", "affiliate", "sample", "endorse", "iklan", "other"]);

export const MarketingCostRowSchema = z.object({
  date: z.string().date(),
  variable: VariableSchema,
  platform: z.string().nullable(),
  storeOrBrand: z.string().nullable(),
  kategori: z.string().nullable(),
  produk: z.string().nullable(),
  sku: z.string().nullable(),
  qty: z.number().int().nullable(),
  totalBiaya: z.number().nonnegative(),
  nilaiProduk: z.number().nullable(),
  ongkosKirim: z.number().nullable(),
  rateCard: z.number().nullable(),
  slot: z.string().nullable(),
  keterangan: z.string().nullable(),
});

export const MarketingCostsParseResultSchema = z.object({
  templateType: z.literal("marketing_costs"),
  summary: z.object({ totalRows: z.number(), validRows: z.number(), rejectedRowsCount: z.number() }),
  rows: z.array(MarketingCostRowSchema),
  warnings: z.array(z.string()),
  rejectedRows: z.array(z.object({ rowIndex: z.number(), reason: z.string(), raw: z.array(z.unknown()) })),
});

export type MarketingCostRow = z.infer<typeof MarketingCostRowSchema>;
export type MarketingCostsParseResult = z.infer<typeof MarketingCostsParseResultSchema>;

const detectVariable = (value: unknown): z.infer<typeof VariableSchema> => {
  const text = textCell(value).toLowerCase();
  return text.includes("voucher") ? "voucher"
    : text.includes("affiliate") ? "affiliate"
      : text.includes("sample") ? "sample"
        : text.includes("endorse") ? "endorse"
          : text.includes("ads") || text.includes("gmv") || text.includes("iklan") ? "iklan"
            : "other";
};

const nullableText = (value: unknown): string | null => textCell(value) || null;

const toRawMarketingRow = (row: readonly unknown[], columns: ReadonlyMap<string, number>) => ({
  date: parseAnyDate(getCell(row, columns, ["tanggal", "date"])),
  variable: detectVariable(getCell(row, columns, ["variable", "voucher type", "affiliate type", "metric type"])),
  platform: nullableText(getCell(row, columns, ["platform"])),
  storeOrBrand: nullableText(getCell(row, columns, ["store brand", "store name", "store", "brand"])),
  kategori: nullableText(getCell(row, columns, ["kategori", "category"])),
  produk: nullableText(getCell(row, columns, ["produk", "product", "product name"])),
  sku: nullableText(getCell(row, columns, ["sku"])),
  qty: Math.round(parseIndonesianNumber(getCell(row, columns, ["qty"])) ?? 0) || null,
  totalBiaya: parseIndonesianNumber(getCell(row, columns, ["total biaya", "value", "total cost", "sales value", "gmv value"])) ?? 0,
  nilaiProduk: parseIndonesianNumber(getCell(row, columns, ["nilai produk"])),
  ongkosKirim: parseIndonesianNumber(getCell(row, columns, ["ongkos kirim"])),
  rateCard: parseIndonesianNumber(getCell(row, columns, ["rate card"])),
  slot: nullableText(getCell(row, columns, ["slot"])),
  keterangan: nullableText(getCell(row, columns, ["keterangan"])),
});

export const parseMarketingCosts = (rows: readonly unknown[][]): MarketingCostsParseResult => {
  let headerIndex = findHeaderRow(rows, ["tanggal", "variable", "total biaya"]);
  if (headerIndex < 0) headerIndex = findHeaderRow(rows, ["date", "voucher type"]);
  if (headerIndex < 0) headerIndex = findHeaderRow(rows, ["date", "affiliate type"]);
  if (headerIndex < 0) headerIndex = findHeaderRow(rows, ["date", "metric type"]);
  if (headerIndex < 0) headerIndex = findHeaderRow(rows, ["date", "variable"]);
  if (headerIndex < 0) return { templateType: "marketing_costs", summary: { totalRows: 0, validRows: 0, rejectedRowsCount: 0 }, rows: [], warnings: ["Header marketing tidak ditemukan"], rejectedRows: [] };
  const columns = buildColumnMap(rows[headerIndex] ?? []);
  const parsed = nonEmptyDataRows(rows, headerIndex).map((row, index) => ({ row, index, parsed: MarketingCostRowSchema.safeParse(toRawMarketingRow(row, columns)) }));
  const validRows = parsed.flatMap((entry) => (entry.parsed.success ? [entry.parsed.data] : []));
  const rejectedRows = parsed.flatMap((entry) => entry.parsed.success ? [] : [{ rowIndex: headerIndex + entry.index + 2, reason: entry.parsed.error.message, raw: [...entry.row] }]);
  return MarketingCostsParseResultSchema.parse({ templateType: "marketing_costs", summary: { totalRows: parsed.length, validRows: validRows.length, rejectedRowsCount: rejectedRows.length }, rows: validRows, warnings: [], rejectedRows });
};
