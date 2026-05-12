/**
 * Build an in-memory XLSX buffer from raw sheet data (2D arrays).
 * Used to bridge the Google Sheets API response into the existing
 * XLSX-based import pipeline without changing createImportPreview.
 */

import ExcelJS from "exceljs";
import type { SheetData } from "./fetch-sheets-api";

export async function buildXlsxBuffer(sheets: SheetData[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name);
    for (const row of sheet.rows) {
      ws.addRow(row.map((cell) => (cell === null || cell === undefined ? null : cell)));
    }
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
