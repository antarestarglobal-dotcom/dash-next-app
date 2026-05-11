import { parseIndonesianNumber } from "../helpers/parse-number";
import { parseAnyDate } from "../helpers/parse-date";
import { parseExcelTimeFraction } from "../helpers/parse-time";
import { isEmptyRow } from "../helpers/normalize";
import { findHeaderRow } from "../helpers/detect-header";
import type { OrderDetailRow } from "../../validators/import";

interface OrderDetailParseResult {
  templateType: "order_detail";
  summary: {
    totalRows: number;
    validRows: number;
    rejectedRowsCount: number;
  };
  orders: OrderDetailRow[];
  warnings: string[];
  rejectedRows: Array<{ rowIndex: number; reason: string; raw: unknown[] }>;
}

export function parseOrderDetail(
  rows: unknown[][],
  previewOnly = false,
  previewLimit = 50,
): OrderDetailParseResult {
  const warnings: string[] = [];
  const rejectedRows: Array<{ rowIndex: number; reason: string; raw: unknown[] }> = [];

  const headerIdx = findHeaderRow(rows, ["tanggal", "invoice", "net sales"], 0, 10);
  if (headerIdx === -1) {
    return {
      templateType: "order_detail",
      summary: { totalRows: 0, validRows: 0, rejectedRowsCount: 0 },
      orders: [],
      warnings: ["Header row tidak ditemukan"],
      rejectedRows: [],
    };
  }

  const header = rows[headerIdx]!;
  const colMap: Record<string, number> = {};

  for (let i = 0; i < header.length; i++) {
    const cell = String(header[i] ?? "").trim().toLowerCase();
    if (cell.includes("tanggal") && !colMap.date) colMap.date = i;
    else if (cell.includes("waktu") || cell === "time") colMap.time = i;
    else if (cell === "brand" || cell.includes("brand")) colMap.brand = i;
    else if (cell.includes("platform")) colMap.platform = i;
    else if (cell.includes("invoice")) colMap.invoice = i;
    else if (cell.includes("net sales") || cell.includes("netsales")) colMap.netSales = i;
    else if (cell === "sku" || cell.includes("sku")) colMap.sku = i;
    else if (cell === "jumlah" || cell.includes("qty") || cell.includes("quantity"))
      colMap.quantity = i;
  }

  const orders: OrderDetailRow[] = [];
  const limit = previewOnly
    ? Math.min(headerIdx + 1 + previewLimit, rows.length)
    : rows.length;

  let totalScanned = 0;

  for (let i = headerIdx + 1; i < limit; i++) {
    const row = rows[i];
    if (!row || isEmptyRow(row)) continue;
    totalScanned++;

    const rawDate = colMap.date !== undefined ? row[colMap.date] : null;
    const dateStr = parseAnyDate(rawDate);
    if (!dateStr) {
      rejectedRows.push({ rowIndex: i, reason: "Tanggal tidak valid", raw: row.slice(0, 10) });
      continue;
    }

    const rawInvoice = colMap.invoice !== undefined ? row[colMap.invoice] : null;
    const invoice = String(rawInvoice ?? "").trim();
    if (!invoice || invoice.startsWith("#")) {
      rejectedRows.push({ rowIndex: i, reason: "Invoice tidak valid", raw: row.slice(0, 10) });
      continue;
    }

    const rawTime = colMap.time !== undefined ? row[colMap.time] : null;
    const orderTime = parseExcelTimeFraction(rawTime);

    const brand = colMap.brand !== undefined ? String(row[colMap.brand] ?? "").trim() || null : null;
    const platform = colMap.platform !== undefined ? String(row[colMap.platform] ?? "").trim() || null : null;
    const netSales = colMap.netSales !== undefined ? parseIndonesianNumber(row[colMap.netSales]) : null;
    const sku = colMap.sku !== undefined ? String(row[colMap.sku] ?? "").trim() || null : null;
    const rawQty = colMap.quantity !== undefined ? row[colMap.quantity] : null;
    const quantity = rawQty !== null && rawQty !== undefined ? Math.round(Number(rawQty)) : null;

    orders.push({ orderDate: dateStr, orderTime, brand, platform, invoice, netSales, sku, quantity });
  }

  if (previewOnly && rows.length - headerIdx - 1 > previewLimit) {
    warnings.push(`Preview menampilkan ${orders.length} dari sekitar ${rows.length - headerIdx - 1} baris.`);
  }

  return {
    templateType: "order_detail",
    summary: {
      totalRows: rows.length - headerIdx - 1,
      validRows: orders.length,
      rejectedRowsCount: rejectedRows.length,
    },
    orders,
    warnings,
    rejectedRows,
  };
}
