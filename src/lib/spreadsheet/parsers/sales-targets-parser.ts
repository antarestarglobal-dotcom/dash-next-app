import { z } from "zod";
import { parsePeriod } from "../helpers/parse-date";
import { parseIndonesianNumber } from "../helpers/parse-number";
import { buildColumnMap, findHeaderRow, getCell, nonEmptyDataRows, textCell } from "./run-rate-parser-utils";

export const SalesTargetRowSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  brand: z.string().min(1),
  produk: z.string().nullable(),
  platform: z.string().nullable(),
  type: z.string().min(1),
  nominal: z.number().nonnegative(),
});

export const SalesTargetsParseResultSchema = z.object({
  templateType: z.literal("sales_targets"),
  summary: z.object({ totalRows: z.number(), validRows: z.number(), rejectedRowsCount: z.number() }),
  rows: z.array(SalesTargetRowSchema),
  warnings: z.array(z.string()),
  rejectedRows: z.array(z.object({ rowIndex: z.number(), reason: z.string(), raw: z.array(z.unknown()) })),
});

export type SalesTargetRow = z.infer<typeof SalesTargetRowSchema>;
export type SalesTargetsParseResult = z.infer<typeof SalesTargetsParseResultSchema>;

const normalizeType = (value: unknown): string => textCell(value).toLowerCase().replace(/\s+/g, "_");

const toRawTargetRow = (row: readonly unknown[], columns: ReadonlyMap<string, number>) => ({
  period: parsePeriod(getCell(row, columns, ["periode", "period"])),
  brand: textCell(getCell(row, columns, ["brand"])),
  produk: textCell(getCell(row, columns, ["produk", "product"])) || null,
  platform: textCell(getCell(row, columns, ["platform"])) || null,
  type: normalizeType(getCell(row, columns, ["type", "tipe"])),
  nominal: parseIndonesianNumber(getCell(row, columns, ["nominal"])) ?? 0,
});

export const parseSalesTargets = (rows: readonly unknown[][]): SalesTargetsParseResult => {
  const headerIndex = findHeaderRow(rows, ["periode", "brand", "nominal"]);
  if (headerIndex < 0) return { templateType: "sales_targets", summary: { totalRows: 0, validRows: 0, rejectedRowsCount: 0 }, rows: [], warnings: ["Header target tidak ditemukan"], rejectedRows: [] };
  const columns = buildColumnMap(rows[headerIndex] ?? []);
  const parsed = nonEmptyDataRows(rows, headerIndex).map((row, index) => ({ row, index, parsed: SalesTargetRowSchema.safeParse(toRawTargetRow(row, columns)) }));
  const validRows = parsed.flatMap((entry) => (entry.parsed.success ? [entry.parsed.data] : []));
  const rejectedRows = parsed.flatMap((entry) => entry.parsed.success ? [] : [{ rowIndex: headerIndex + entry.index + 2, reason: entry.parsed.error.message, raw: [...entry.row] }]);
  return SalesTargetsParseResultSchema.parse({ templateType: "sales_targets", summary: { totalRows: parsed.length, validRows: validRows.length, rejectedRowsCount: rejectedRows.length }, rows: validRows, warnings: [], rejectedRows });
};
