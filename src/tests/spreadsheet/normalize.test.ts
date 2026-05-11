import { describe, it, expect } from "vitest";
import {
  normalizePlatformName,
  normalizeMetricName,
  normalizeShift,
  isEmptyRow,
  isStopRow,
} from "@/lib/spreadsheet/helpers/normalize";

describe("normalizePlatformName", () => {
  it("normalizes TIKTOK MALL", () => {
    expect(normalizePlatformName("TIKTOK MALL")).toBe("tiktok_mall");
  });
  it("normalizes SHOPEE MALL", () => {
    expect(normalizePlatformName("SHOPEE MALL")).toBe("shopee_mall");
  });
  it("normalizes TikTok", () => {
    expect(normalizePlatformName("TikTok")).toBe("tiktok");
  });
});

describe("normalizeMetricName", () => {
  it("normalizes Net Sales", () => {
    expect(normalizeMetricName("Net Sales")).toBe("net_sales");
  });
  it("normalizes GMV", () => {
    expect(normalizeMetricName("GMV")).toBe("gmv");
  });
});

describe("normalizeShift", () => {
  it("normalizes shift 1", () => {
    expect(normalizeShift("shift 1")).toBe("SHIFT 1");
  });
  it("normalizes SHIFT 2", () => {
    expect(normalizeShift("SHIFT 2")).toBe("SHIFT 2");
  });
});

describe("isEmptyRow", () => {
  it("detects all-null row", () => {
    expect(isEmptyRow([null, null, undefined, ""])).toBe(true);
  });
  it("returns false for non-empty row", () => {
    expect(isEmptyRow([null, "data"])).toBe(false);
  });
});

describe("isStopRow", () => {
  it("detects 'total'", () => {
    expect(isStopRow(["total", 100])).toBe(true);
  });
  it("returns false for normal row", () => {
    expect(isStopRow(["Rabu", "2026-04-01"])).toBe(false);
  });
});
