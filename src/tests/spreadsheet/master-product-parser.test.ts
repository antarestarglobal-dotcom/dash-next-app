import { describe, it, expect } from "vitest";
import { parseMasterProduct } from "@/lib/spreadsheet/parsers/master-product-parser";

const MOCK_ROWS: unknown[][] = [
  ["Kategori", "Produk", "SKU Induk", "Nama Varian", "SKU Varian", "HPP", "Harga Jual"],
  ["Skincare", "Product A", "PARENT-001", "Varian A", "SKU-001", "10000", "25000"],
  ["Skincare", "Product B", "PARENT-002", "Varian B", "SKU-002", "15000", "30000"],
];

describe("parseMasterProduct", () => {
  it("returns templateType master_product", () => {
    expect(parseMasterProduct(MOCK_ROWS).templateType).toBe("master_product");
  });
  it("parses 2 products", () => {
    expect(parseMasterProduct(MOCK_ROWS).products.length).toBe(2);
  });
  it("parses HPP and sellingPrice", () => {
    const p = parseMasterProduct(MOCK_ROWS).products[0]!;
    expect(p.hpp).toBe(10000);
    expect(p.sellingPrice).toBe(25000);
  });
  it("parses variantSku", () => {
    expect(parseMasterProduct(MOCK_ROWS).products[0]!.variantSku).toBe("SKU-001");
  });
});
