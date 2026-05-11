import { describe, it, expect } from "vitest";
import { parseHostOkr } from "@/lib/spreadsheet/parsers/host-okr-parser";

const MOCK_ROWS: unknown[][] = [
  ["No", "Host", "Tanggal", "Platform", "Shift", "CTR", "AOV"],
  [1, "ELIS", 46143, "SHOPEE MALL", "SHIFT 1", null, null],
  [2, "LAIKHA", 46143, "SHOPEE MALL", "SHIFT 2", "3,5", "150000"],
];

describe("parseHostOkr", () => {
  it("returns templateType host_okr", () => {
    expect(parseHostOkr(MOCK_ROWS).templateType).toBe("host_okr");
  });
  it("parses 2 rows", () => {
    expect(parseHostOkr(MOCK_ROWS).rows.length).toBe(2);
  });
  it("handles null CTR/AOV", () => {
    expect(parseHostOkr(MOCK_ROWS).rows[0]!.ctr).toBeNull();
    expect(parseHostOkr(MOCK_ROWS).rows[0]!.aov).toBeNull();
  });
  it("parses CTR and AOV", () => {
    expect(parseHostOkr(MOCK_ROWS).rows[1]!.ctr).toBe(3.5);
    expect(parseHostOkr(MOCK_ROWS).rows[1]!.aov).toBe(150000);
  });
});
