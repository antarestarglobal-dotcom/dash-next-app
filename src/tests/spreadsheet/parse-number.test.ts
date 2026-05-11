import { describe, it, expect } from "vitest";
import { parseIndonesianNumber, parseIndonesianPercent } from "@/lib/spreadsheet/helpers/parse-number";

describe("parseIndonesianNumber", () => {
  it("parses thousand-separated integer", () => {
    expect(parseIndonesianNumber("206.147.816")).toBe(206147816);
  });
  it("parses decimal comma", () => {
    expect(parseIndonesianNumber("3,65")).toBe(3.65);
  });
  it("parses percent string", () => {
    expect(parseIndonesianNumber("3,65%")).toBe(3.65);
  });
  it("parses Rp juta shorthand", () => {
    expect(parseIndonesianNumber("Rp133,8jt")).toBe(133800000);
  });
  it("parses juta shorthand without Rp", () => {
    expect(parseIndonesianNumber("2,2jt")).toBe(2200000);
  });
  it("returns null for empty string", () => {
    expect(parseIndonesianNumber("")).toBeNull();
  });
  it("returns null for #REF!", () => {
    expect(parseIndonesianNumber("#REF!")).toBeNull();
  });
  it("returns null for null", () => {
    expect(parseIndonesianNumber(null)).toBeNull();
  });
  it("parses plain number", () => {
    expect(parseIndonesianNumber(12345)).toBe(12345);
  });
});

describe("parseIndonesianPercent", () => {
  it("parses percent string", () => {
    expect(parseIndonesianPercent("3,65%")).toBe(3.65);
  });
  it("converts Excel percent fraction", () => {
    expect(parseIndonesianPercent(0.0365)).toBeCloseTo(3.65, 2);
  });
  it("returns plain number as-is when >= 1", () => {
    expect(parseIndonesianPercent(3.65)).toBe(3.65);
  });
});
