import { describe, it, expect } from "vitest";
import { parseHostGmv } from "@/lib/spreadsheet/parsers/host-gmv-parser";

const MOCK_ROWS: unknown[][] = [
  ["No", "Host", "Tanggal", "Platform", "Shift", "GMV"],
  [1, "ELIS", 46143, "SHOPEE MALL", "SHIFT 1", 21555509],
  [2, "LAIKHA", 46143, "SHOPEE MALL", "SHIFT 2", 11864629],
  [3, "GUNTUR", 46143, "TIKTOK MALL", "SHIFT 2", 17736854],
];

describe("parseHostGmv", () => {
  it("returns templateType host_gmv", () => {
    expect(parseHostGmv(MOCK_ROWS).templateType).toBe("host_gmv");
  });
  it("parses 3 rows", () => {
    expect(parseHostGmv(MOCK_ROWS).rows.length).toBe(3);
  });
  it("parses date from serial", () => {
    expect(parseHostGmv(MOCK_ROWS).rows[0]!.date).toBe("2026-05-01");
  });
  it("normalizes platform", () => {
    expect(parseHostGmv(MOCK_ROWS).rows[0]!.platform).toBe("shopee_mall");
  });
  it("parses GMV", () => {
    expect(parseHostGmv(MOCK_ROWS).rows[0]!.gmv).toBe(21555509);
  });
});
