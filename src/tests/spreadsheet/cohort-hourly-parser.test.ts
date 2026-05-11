import { describe, it, expect } from "vitest";
import { parseCohortHourly } from "@/lib/spreadsheet/parsers/cohort-hourly-parser";

function makeRow(...cells: unknown[]): unknown[] {
  return cells;
}

const MOCK_ROWS: unknown[][] = [
  makeRow("Periode", "April-2026"),
  makeRow("Metric", "Net Sales"),
  makeRow("Platform", "Tiktok"),
  makeRow("Brand", "Antarestar"),
  makeRow("Channel", "Produk"),
  makeRow(),
  makeRow(),
  makeRow("Hari", "Tanggal", "Total", "%", 0, 1 / 24, 2 / 24, 3 / 24),
  makeRow("Rabu", 46113, "206.147.816", "3,65%", 3.78, 1.54, 0.5, 0.3),
  makeRow("Kamis", 46114, "180.000.000", "3.18%", 2.0, 1.0, 0.4, 0.2),
];

describe("parseCohortHourly", () => {
  it("returns templateType cohort_hourly", () => {
    const result = parseCohortHourly(MOCK_ROWS);
    expect(result.templateType).toBe("cohort_hourly");
  });

  it("extracts metadata correctly", () => {
    const result = parseCohortHourly(MOCK_ROWS);
    expect(result.metadata.period).toBe("2026-04");
    expect(result.metadata.brand).toBe("Antarestar");
  });

  it("parses 2 daily rows", () => {
    const result = parseCohortHourly(MOCK_ROWS);
    expect(result.dailyRows.length).toBe(2);
  });

  it("parses date correctly", () => {
    const result = parseCohortHourly(MOCK_ROWS);
    expect(result.dailyRows[0]!.date).toBe("2026-04-01");
  });

  it("parses total correctly", () => {
    const result = parseCohortHourly(MOCK_ROWS);
    expect(result.dailyRows[0]!.total).toBe(206147816);
  });

  it("warns when fewer than 24 hour columns", () => {
    const result = parseCohortHourly(MOCK_ROWS);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
