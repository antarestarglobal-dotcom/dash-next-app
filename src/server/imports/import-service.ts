import { parseSpreadsheetBufferPreview } from "@/lib/spreadsheet/parse-spreadsheet";
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
  previewRows: unknown[];
  hasFatalError: boolean;
  errorMessage: string | null;
}

export async function createImportPreview(
  fileBuffer: Buffer,
  fileName: string,
): Promise<ImportPreviewResult[]> {
  // Store raw file as base64 so confirm step can re-parse without re-upload
  const rawBase64 = fileBuffer.toString("base64");

  const sheetResults = parseSpreadsheetBufferPreview(fileBuffer);
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

    const parsed = sheet.parsed;
    const meta = (parsed.metadata ?? {}) as Record<string, string>;
    const summary = (parsed.summary ?? {}) as Record<string, number | string | null>;
    const warnings = (parsed.warnings ?? []) as string[];
    const rejectedRows = (parsed.rejectedRows ?? []) as unknown[];

    const validRows =
      (summary.validRows as number) ??
      (summary.dailyRows as number) ??
      (summary.productRows as number) ??
      0;

    const previewRows = getPreviewRows(parsed, sheet.templateType);

    const imp = await createImport({
      sourceName: fileName,
      sheetName: sheet.sheetName,
      templateType: sheet.templateType,
      period: meta.period ?? (summary.startDate as string) ?? null,
      brand: meta.brand ?? null,
      platform: meta.platform ?? null,
      channel: meta.channel ?? null,
      metric: meta.metric ?? null,
      status: "preview",
      // rawJson stores the file so confirm can re-parse without re-upload
      rawJson: { fileBase64: rawBase64 },
      // detectedJson stores only preview-size data (no 218k rows)
      detectedJson: {
        templateType: sheet.templateType,
        metadata: meta,
        summary,
        previewRows,
        warnings,
        rejectedRowsCount: (summary.rejectedRowsCount as number) ?? 0,
      },
      warningJson: warnings,
      rejectedRowsJson: rejectedRows,
    });

    results.push({
      importId: imp.id,
      sourceName: fileName,
      sheetName: sheet.sheetName,
      templateType: sheet.templateType,
      period: meta.period ?? null,
      metric: meta.metric ?? null,
      platform: meta.platform ?? null,
      brand: meta.brand ?? null,
      channel: meta.channel ?? null,
      validRows,
      rejectedRowsCount: (summary.rejectedRowsCount as number) ?? 0,
      warnings,
      previewRows,
      hasFatalError: false,
      errorMessage: null,
    });
  }

  return results;
}

function getPreviewRows(parsed: Record<string, unknown>, templateType: TemplateType): unknown[] {
  switch (templateType) {
    case "cohort_hourly":
      return ((parsed.dailyRows as unknown[]) ?? []).slice(0, 10);
    case "host_gmv":
    case "host_okr":
      return ((parsed.rows as unknown[]) ?? []).slice(0, 10);
    case "order_detail":
      return ((parsed.orders as unknown[]) ?? []).slice(0, 10);
    case "master_product":
      return ((parsed.products as unknown[]) ?? []).slice(0, 10);
    default:
      return [];
  }
}
