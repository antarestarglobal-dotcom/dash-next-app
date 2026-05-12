import { z } from "zod";
import { parseAnyDate } from "../helpers/parse-date";
import { parseIndonesianNumber, parseIndonesianPercent } from "../helpers/parse-number";
import { buildColumnMap, findHeaderRow, getCell, nonEmptyDataRows } from "./run-rate-parser-utils";

const BreakdownVariableSchema = z.enum(["voucher", "affiliate", "sample", "endorse", "other"]);

export const DailyStorePerformanceRowSchema = z.object({
  date: z.string().date(),
  netSales: z.number(),
  margin: z.number(),
  gpm: z.number(),
  marketingCost: z.number(),
  marketingRatio: z.number(),
  netProfit: z.number(),
  npm: z.number(),
  totalIklan: z.number(),
  iklan: z.number(),
  gmv: z.number(),
  liveGmv: z.number(),
  contribution: z.number(),
  hawa: z.number(),
});

export const DailyMarketingBreakdownRowSchema = z.object({
  date: z.string().date(),
  variable: BreakdownVariableSchema,
  contribution: z.number(),
  hawa: z.number(),
});

export const DailyPerformanceParseResultSchema = z.object({
  templateType: z.literal("daily_performance"),
  summary: z.object({ totalRows: z.number(), validRows: z.number(), rejectedRowsCount: z.number() }),
  rows: z.array(DailyStorePerformanceRowSchema),
  breakdownRows: z.array(DailyMarketingBreakdownRowSchema),
  warnings: z.array(z.string()),
  rejectedRows: z.array(z.object({ rowIndex: z.number(), reason: z.string(), raw: z.array(z.unknown()) })),
});

export type DailyStorePerformanceRow = z.infer<typeof DailyStorePerformanceRowSchema>;
export type DailyMarketingBreakdownRow = z.infer<typeof DailyMarketingBreakdownRowSchema>;
export type DailyPerformanceParseResult = z.infer<typeof DailyPerformanceParseResultSchema>;

const numberCell = (row: readonly unknown[], columns: ReadonlyMap<string, number>, aliases: readonly string[]) =>
  parseIndonesianNumber(getCell(row, columns, aliases)) ?? 0;

const percentCell = (row: readonly unknown[], columns: ReadonlyMap<string, number>, aliases: readonly string[]) =>
  parseIndonesianPercent(getCell(row, columns, aliases)) ?? 0;

const toRawDailyRow = (row: readonly unknown[], columns: ReadonlyMap<string, number>) => ({
  date: parseAnyDate(getCell(row, columns, ["tanggal", "date"])),
  netSales: numberCell(row, columns, ["net sales"]),
  margin: numberCell(row, columns, ["margin"]),
  gpm: percentCell(row, columns, ["gpm"]),
  marketingCost: numberCell(row, columns, ["marketing cost"]),
  marketingRatio: percentCell(row, columns, ["marketing ratio"]),
  netProfit: numberCell(row, columns, ["net profit"]),
  npm: percentCell(row, columns, ["npm"]),
  totalIklan: numberCell(row, columns, ["total iklan"]),
  iklan: numberCell(row, columns, ["iklan"]),
  gmv: numberCell(row, columns, ["gmv"]),
  liveGmv: numberCell(row, columns, ["live gmv"]),
  contribution: percentCell(row, columns, ["contribution"]),
  hawa: numberCell(row, columns, ["hawa"]),
});

const toBreakdownRows = (
  row: readonly unknown[],
  columns: ReadonlyMap<string, number>,
  date: string,
): readonly DailyMarketingBreakdownRow[] =>
  BreakdownVariableSchema.options.flatMap((variable) => {
    const contribution = percentCell(row, columns, [`${variable} contribution`]);
    const hawa = numberCell(row, columns, [`${variable} hawa`]);
    return contribution === 0 && hawa === 0 ? [] : [{ date, variable, contribution, hawa }];
  });

export const parseDailyPerformance = (rows: readonly unknown[][]): DailyPerformanceParseResult => {
  const headerIndex = findHeaderRow(rows, ["tanggal", "net sales", "marketing cost"]);
  if (headerIndex < 0) return { templateType: "daily_performance", summary: { totalRows: 0, validRows: 0, rejectedRowsCount: 0 }, rows: [], breakdownRows: [], warnings: ["Header DATA-ACCEL tidak ditemukan"], rejectedRows: [] };
  const columns = buildColumnMap(rows[headerIndex] ?? []);
  const parsed = nonEmptyDataRows(rows, headerIndex).map((row, index) => ({ row, index, parsed: DailyStorePerformanceRowSchema.safeParse(toRawDailyRow(row, columns)) }));
  const validRows = parsed.flatMap((entry) => (entry.parsed.success ? [entry.parsed.data] : []));
  const rejectedRows = parsed.flatMap((entry) => entry.parsed.success ? [] : [{ rowIndex: headerIndex + entry.index + 2, reason: entry.parsed.error.message, raw: [...entry.row] }]);
  const breakdownRows = validRows.flatMap((dailyRow, index) => toBreakdownRows(parsed[index]?.row ?? [], columns, dailyRow.date));
  return DailyPerformanceParseResultSchema.parse({ templateType: "daily_performance", summary: { totalRows: parsed.length, validRows: validRows.length, rejectedRowsCount: rejectedRows.length }, rows: validRows, breakdownRows, warnings: [], rejectedRows });
};
