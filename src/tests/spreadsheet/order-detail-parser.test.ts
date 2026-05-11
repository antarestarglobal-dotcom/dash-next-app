import { describe, it, expect } from "vitest";
import { parseOrderDetail } from "@/lib/spreadsheet/parsers/order-detail-parser";

const MOCK_ROWS: unknown[][] = [
  ["Tanggal", "Waktu", "Brand", "Platform", "Invoice", "Net Sales", "SKU", "Jumlah"],
  [46113, 0.0006944444, "Antarestar", "Tiktok", "INV-001", "123456", "SKU-001", 2],
  [46113, 0.5, "Antarestar", "Shopee", "INV-002", "78900", "SKU-002", 1],
];

describe("parseOrderDetail", () => {
  it("returns templateType order_detail", () => {
    expect(parseOrderDetail(MOCK_ROWS).templateType).toBe("order_detail");
  });
  it("parses 2 orders", () => {
    expect(parseOrderDetail(MOCK_ROWS).orders.length).toBe(2);
  });
  it("parses order date from serial", () => {
    expect(parseOrderDetail(MOCK_ROWS).orders[0]!.orderDate).toBe("2026-04-01");
  });
  it("parses invoice", () => {
    expect(parseOrderDetail(MOCK_ROWS).orders[0]!.invoice).toBe("INV-001");
  });
  it("parses netSales", () => {
    expect(parseOrderDetail(MOCK_ROWS).orders[0]!.netSales).toBe(123456);
  });
  it("parses orderTime", () => {
    expect(parseOrderDetail(MOCK_ROWS).orders[0]!.orderTime).toBe("00:01:00");
  });
});
