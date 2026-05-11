import { describe, it, expect } from "vitest";
import { parseExcelSerialDate, parseAnyDate, parsePeriod } from "@/lib/spreadsheet/helpers/parse-date";

describe("parseExcelSerialDate", () => {
  it("converts 46113 to 2026-04-01", () => {
    expect(parseExcelSerialDate(46113)).toBe("2026-04-01");
  });
  it("converts 46143 to 2026-05-01", () => {
    expect(parseExcelSerialDate(46143)).toBe("2026-05-01");
  });
});

describe("parseAnyDate", () => {
  it("parses ISO string", () => {
    expect(parseAnyDate("2026-04-01")).toBe("2026-04-01");
  });
  it("parses dd-Mon-yyyy", () => {
    expect(parseAnyDate("01-Apr-2026")).toBe("2026-04-01");
  });
  it("parses Excel serial", () => {
    expect(parseAnyDate(46113)).toBe("2026-04-01");
  });
  it("returns null for empty", () => {
    expect(parseAnyDate("")).toBeNull();
  });
});

describe("parsePeriod", () => {
  it("parses April-2026", () => {
    expect(parsePeriod("April-2026")).toBe("2026-04");
  });
  it("parses MEI 2026", () => {
    expect(parsePeriod("MEI 2026")).toBe("2026-05");
  });
  it("parses Excel serial to period", () => {
    expect(parsePeriod(46113)).toBe("2026-04");
  });
});
