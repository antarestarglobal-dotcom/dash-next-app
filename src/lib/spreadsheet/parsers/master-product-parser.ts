import { parseIndonesianNumber } from "../helpers/parse-number";
import { isEmptyRow } from "../helpers/normalize";
import { findHeaderRow } from "../helpers/detect-header";
import type { ProductRow, BundleRow } from "../../validators/import";

interface MasterProductParseResult {
  templateType: "master_product";
  summary: { productRows: number; bundleRows: number; rejectedRowsCount: number };
  products: ProductRow[];
  bundles: BundleRow[];
  warnings: string[];
  rejectedRows: Array<{ rowIndex: number; reason: string; raw: unknown[] }>;
}

export function parseMasterProduct(rows: unknown[][]): MasterProductParseResult {
  const warnings: string[] = [];
  const rejectedRows: Array<{ rowIndex: number; reason: string; raw: unknown[] }> = [];

  const headerIdx = findHeaderRow(rows, ["kategori", "produk", "sku"]);
  if (headerIdx === -1) {
    return {
      templateType: "master_product",
      summary: { productRows: 0, bundleRows: 0, rejectedRowsCount: 0 },
      products: [],
      bundles: [],
      warnings: ["Header row tidak ditemukan"],
      rejectedRows: [],
    };
  }

  const header = rows[headerIdx]!;
  const colMap: Record<string, number> = {};
  const bundleProductCols: Array<{ nameCol: number; qtyCol: number }> = [];

  for (let i = 0; i < header.length; i++) {
    const cell = String(header[i] ?? "").trim().toLowerCase();
    if (cell === "kategori" || cell.includes("kategori")) colMap.category = i;
    else if (cell === "produk" || cell === "product name") colMap.productName = i;
    else if (cell.includes("sku induk") || cell.includes("parent sku")) colMap.parentSku = i;
    else if (cell.includes("nama varian") || cell.includes("variant name")) colMap.variantName = i;
    else if (cell.includes("sku varian") || cell.includes("variant sku")) colMap.variantSku = i;
    else if (cell === "hpp") colMap.hpp = i;
    else if (cell.includes("harga jual") || cell.includes("selling price")) colMap.sellingPrice = i;
    else if (cell.includes("nama paket") || cell.includes("bundle name")) colMap.bundleName = i;
    else if (cell.includes("kode paket") || cell.includes("bundle code")) colMap.bundleCode = i;
    else {
      // Detect bundle item columns: Produk 1, Qty 1, Produk 2, Qty 2, ...
      const prodMatch = cell.match(/^produk\s+(\d+)$/);
      const qtyMatch = cell.match(/^qty\s+(\d+)$/);
      if (prodMatch) {
        const idx = parseInt(prodMatch[1], 10) - 1;
        if (!bundleProductCols[idx]) bundleProductCols[idx] = { nameCol: i, qtyCol: -1 };
        else bundleProductCols[idx].nameCol = i;
      }
      if (qtyMatch) {
        const idx = parseInt(qtyMatch[1], 10) - 1;
        if (!bundleProductCols[idx]) bundleProductCols[idx] = { nameCol: -1, qtyCol: i };
        else bundleProductCols[idx].qtyCol = i;
      }
    }
  }

  const products: ProductRow[] = [];
  const bundles: BundleRow[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || isEmptyRow(row)) continue;

    const variantSku = colMap.variantSku !== undefined
      ? String(row[colMap.variantSku] ?? "").trim()
      : "";

    if (!variantSku) {
      rejectedRows.push({ rowIndex: i, reason: "SKU Varian kosong", raw: row });
      continue;
    }

    const product: ProductRow = {
      category: colMap.category !== undefined ? String(row[colMap.category] ?? "").trim() || null : null,
      productName: colMap.productName !== undefined ? String(row[colMap.productName] ?? "").trim() : variantSku,
      parentSku: colMap.parentSku !== undefined ? String(row[colMap.parentSku] ?? "").trim() || null : null,
      variantName: colMap.variantName !== undefined ? String(row[colMap.variantName] ?? "").trim() || null : null,
      variantSku,
      hpp: colMap.hpp !== undefined ? parseIndonesianNumber(row[colMap.hpp]) : null,
      sellingPrice: colMap.sellingPrice !== undefined ? parseIndonesianNumber(row[colMap.sellingPrice]) : null,
    };
    products.push(product);

    const bundleCode = colMap.bundleCode !== undefined
      ? String(row[colMap.bundleCode] ?? "").trim()
      : "";
    const bundleName = colMap.bundleName !== undefined
      ? String(row[colMap.bundleName] ?? "").trim()
      : "";

    if (bundleCode) {
      const items = bundleProductCols
        .filter((c) => c && c.nameCol >= 0)
        .map((c) => ({
          productName: String(row[c.nameCol] ?? "").trim(),
          quantity: c.qtyCol >= 0 ? Math.round(Number(row[c.qtyCol] ?? 1)) : 1,
        }))
        .filter((item) => item.productName);

      const existing = bundles.find((b) => b.bundleCode === bundleCode);
      if (!existing) {
        bundles.push({ bundleName: bundleName || bundleCode, bundleCode, items });
      }
    }
  }

  return {
    templateType: "master_product",
    summary: {
      productRows: products.length,
      bundleRows: bundles.length,
      rejectedRowsCount: rejectedRows.length,
    },
    products,
    bundles,
    warnings,
    rejectedRows,
  };
}
