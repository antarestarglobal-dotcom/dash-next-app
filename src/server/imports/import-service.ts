import {
  parseSpreadsheetBufferPreview,
  type KnownSheetParseResult,
} from "@/lib/spreadsheet/parse-spreadsheet";
import { createImport } from "./import-repository";
import type { TemplateType } from "@/lib/validators/import";

export interface ImportPreviewResult {
  importId: string;
  sourceName: string;
  sheetName: string;
  templateType: TemplateType;
  period: string | null;
  metric: string | null;
  platform: string | null;
  brand: string | null;
  channel: string | null;
  validRows: number;
  rejectedRowsCount: number;
  warnings: string[];
  previewRows: Record<string, unknown>[];
  hasFatalError: boolean;
  errorMessage: string | null;
}

interface PreviewDerivedData {
  period: string | null;
  metric: string | null;
  platform: string | null;
  brand: string | null;
  channel: string | null;
  validRows: number;
  rejectedRowsCount: number;
  warnings: string[];
  previewRows: Record<string, unknown>[];
  rejectedRows: unknown[];
  summary: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export async function createImportPreview(
  fileBuffer: Buffer,
  fileName: string,
): Promise<ImportPreviewResult[]> {
  // Store raw file as base64 so confirm step can re-parse without re-upload
  const rawBase64 = fileBuffer.toString("base64");

  const sheetResults = await parseSpreadsheetBufferPreview(fileBuffer);
  const results: ImportPreviewResult[] = [];

  for (const sheet of sheetResults) {
    if (sheet.templateType === "unknown") continue;

    if (sheet.error || !sheet.parsed) {
      const imp = await createImport({
        sourceName: fileName,
        sheetName: sheet.sheetName,
        templateType: sheet.templateType,
        status: "failed",
        rawJson: { fileBase64: rawBase64 },
        detectedJson: {},
        errorMessage: sheet.error ?? "Parse error",
      });
      results.push({
        importId: imp.id,
        sourceName: fileName,
        sheetName: sheet.sheetName,
        templateType: sheet.templateType,
        period: null,
        metric: null,
        platform: null,
        brand: null,
        channel: null,
        validRows: 0,
        rejectedRowsCount: 0,
        warnings: [],
        previewRows: [],
        hasFatalError: true,
        errorMessage: sheet.error,
      });
      continue;
    }

    const preview = buildPreviewData(sheet);

    const imp = await createImport({
      sourceName: fileName,
      sheetName: sheet.sheetName,
      templateType: sheet.templateType,
      period: preview.period ?? undefined,
      brand: preview.brand ?? undefined,
      platform: preview.platform ?? undefined,
      channel: preview.channel ?? undefined,
      metric: preview.metric ?? undefined,
      status: "preview",
      // rawJson stores the file so confirm can re-parse without re-upload
      rawJson: { fileBase64: rawBase64 },
      // detectedJson stores only preview-size data (no 218k rows)
      detectedJson: {
        templateType: sheet.templateType,
        metadata: preview.metadata,
        summary: preview.summary,
        previewRows: preview.previewRows,
        warnings: preview.warnings,
        rejectedRowsCount: preview.rejectedRowsCount,
      },
      warningJson: preview.warnings,
      rejectedRowsJson: preview.rejectedRows,
    });

    results.push({
      importId: imp.id,
      sourceName: fileName,
      sheetName: sheet.sheetName,
      templateType: sheet.templateType,
      period: preview.period,
      metric: preview.metric,
      platform: preview.platform,
      brand: preview.brand,
      channel: preview.channel,
      validRows: preview.validRows,
      rejectedRowsCount: preview.rejectedRowsCount,
      warnings: preview.warnings,
      previewRows: preview.previewRows,
      hasFatalError: false,
      errorMessage: null,
    });
  }

  return results;
}

function toPreviewRows<T extends Record<string, unknown>>(rows: T[]): Record<string, unknown>[] {
  return rows.slice(0, 10);
}

function buildPreviewData(sheet: KnownSheetParseResult): PreviewDerivedData {
  switch (sheet.templateType) {
    case "cohort_hourly": {
      const parsed = sheet.parsed;
      if (!parsed) throw new Error("Parsed sheet data is missing");

      return {
        period: parsed.metadata.period ?? parsed.summary.startDate ?? null,
        metric: parsed.metadata.metric ?? null,
        platform: parsed.metadata.platform ?? null,
        brand: parsed.metadata.brand ?? null,
        channel: parsed.metadata.channel ?? null,
        validRows: parsed.summary.dailyRows,
        rejectedRowsCount: parsed.summary.rejectedRowsCount,
        warnings: parsed.warnings,
        previewRows: toPreviewRows(parsed.dailyRows),
        rejectedRows: parsed.rejectedRows,
        summary: parsed.summary,
        metadata: parsed.metadata,
      };
    }
    case "host_gmv": {
      const parsed = sheet.parsed;
      if (!parsed) throw new Error("Parsed sheet data is missing");

      return {
        period: parsed.summary.startDate ?? null,
        metric: "gmv",
        platform: parsed.rows[0]?.platform ?? null,
        brand: null,
        channel: null,
        validRows: parsed.summary.validRows,
        rejectedRowsCount: parsed.summary.rejectedRowsCount,
        warnings: parsed.warnings,
        previewRows: toPreviewRows(parsed.rows),
        rejectedRows: parsed.rejectedRows,
        summary: parsed.summary,
        metadata: {},
      };
    }
    case "order_detail": {
      const parsed = sheet.parsed;
      if (!parsed) throw new Error("Parsed sheet data is missing");

      return {
        period: null,
        metric: "net_sales",
        platform: parsed.orders[0]?.platform ?? null,
        brand: parsed.orders[0]?.brand ?? null,
        channel: null,
        validRows: parsed.summary.validRows,
        rejectedRowsCount: parsed.summary.rejectedRowsCount,
        warnings: parsed.warnings,
        previewRows: toPreviewRows(parsed.orders),
        rejectedRows: parsed.rejectedRows,
        summary: parsed.summary,
        metadata: {},
      };
    }
    case "master_product": {
      const parsed = sheet.parsed;
      if (!parsed) throw new Error("Parsed sheet data is missing");

      return {
        period: null,
        metric: null,
        platform: null,
        brand: null,
        channel: null,
        validRows: parsed.summary.productRows,
        rejectedRowsCount: parsed.summary.rejectedRowsCount,
        warnings: parsed.warnings,
        previewRows: toPreviewRows(parsed.products),
        rejectedRows: parsed.rejectedRows,
        summary: parsed.summary,
        metadata: {},
      };
    }
    case "host_okr": {
      const parsed = sheet.parsed;
      if (!parsed) throw new Error("Parsed sheet data is missing");

      return {
        period: null,
        metric: "okr",
        platform: parsed.rows[0]?.platform ?? null,
        brand: null,
        channel: null,
        validRows: parsed.summary.validRows,
        rejectedRowsCount: parsed.summary.rejectedRowsCount,
        warnings: parsed.warnings,
        previewRows: toPreviewRows(parsed.rows),
        rejectedRows: parsed.rejectedRows,
        summary: parsed.summary,
        metadata: {},
      };
    }
  }
}
