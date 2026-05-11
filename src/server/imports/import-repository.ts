import { db } from "@/db";
import { spreadsheetImports } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { ImportStatus, TemplateType } from "@/lib/validators/import";

export interface CreateImportInput {
  sourceName: string;
  sheetName?: string;
  templateType: TemplateType;
  period?: string;
  brand?: string;
  platform?: string;
  channel?: string;
  metric?: string;
  status: ImportStatus;
  rawJson: unknown;
  detectedJson: unknown;
  warningJson?: unknown;
  rejectedRowsJson?: unknown;
  errorMessage?: string;
}

export async function createImport(input: CreateImportInput) {
  const [row] = await db
    .insert(spreadsheetImports)
    .values({
      sourceName: input.sourceName,
      sheetName: input.sheetName ?? null,
      templateType: input.templateType,
      period: input.period ?? null,
      brand: input.brand ?? null,
      platform: input.platform ?? null,
      channel: input.channel ?? null,
      metric: input.metric ?? null,
      status: input.status,
      rawJson: input.rawJson as Record<string, unknown>,
      detectedJson: input.detectedJson as Record<string, unknown>,
      warningJson: input.warningJson ? (input.warningJson as Record<string, unknown>) : null,
      rejectedRowsJson: input.rejectedRowsJson
        ? (input.rejectedRowsJson as Record<string, unknown>)
        : null,
      errorMessage: input.errorMessage ?? null,
    })
    .returning();
  return row!;
}

export async function getImportById(id: string) {
  const row = await db.query.spreadsheetImports.findFirst({
    where: eq(spreadsheetImports.id, id),
  });
  return row ?? null;
}

export async function updateImportStatus(
  id: string,
  status: ImportStatus,
  errorMessage?: string,
) {
  await db
    .update(spreadsheetImports)
    .set({
      status,
      importedAt: status === "imported" ? new Date() : undefined,
      errorMessage: errorMessage ?? null,
    })
    .where(eq(spreadsheetImports.id, id));
}

export async function listImports(options: {
  page: number;
  limit: number;
  status?: ImportStatus;
  templateType?: TemplateType;
}) {
  const { page, limit, status, templateType } = options;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(spreadsheetImports.status, status));
  if (templateType) conditions.push(eq(spreadsheetImports.templateType, templateType));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db.query.spreadsheetImports.findMany({
    where,
    orderBy: [desc(spreadsheetImports.createdAt)],
    limit,
    offset,
  });

  return rows;
}
