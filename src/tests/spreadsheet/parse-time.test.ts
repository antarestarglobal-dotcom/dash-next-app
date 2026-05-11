import { describe, it, expect } from "vitest";
import { parseExcelTimeFraction, detectHourFromHeader } from "@/lib/spreadsheet/helpers/parse-time";

describe("parseExcelTimeFraction", () => {
  it("converts 0 to 00:00:00", () => {
    expect(parseExcelTimeFraction(0)).toBe("00:00:00");
  });
  it("converts 0.5 to 12:00:00", () => {
    expect(parseExcelTimeFraction(0.5)).toBe("12:00:00");
  });
  it("converts 1/24 to 01:00:00", () => {
    expect(parseExcelTimeFraction(1 / 24)).toBe("01:00:00");
  });
  it("converts 0.9583333333 to 23:00:00", () => {
    expect(parseExcelTimeFraction(0.9583333333)).toBe("23:00:00");
  });
});

describe("detectHourFromHeader", () => {
  it("detects '0:00' as hour 0", () => {
    expect(detectHourFromHeader("0:00")).toBe(0);
  });
  it("detects '00:00' as hour 0", () => {
    expect(detectHourFromHeader("00:00")).toBe(0);
  });
  it("detects '23:00' as hour 23", () => {
    expect(detectHourFromHeader("23:00")).toBe(23);
  });
  it("detects number 0 as hour 0", () => {
    expect(detectHourFromHeader(0)).toBe(0);
  });
  it("detects 1/24 as hour 1", () => {
    expect(detectHourFromHeader(1 / 24)).toBe(1);
  });
  it("detects 23/24 as hour 23", () => {
    expect(detectHourFromHeader(23 / 24)).toBe(23);
  });
});
