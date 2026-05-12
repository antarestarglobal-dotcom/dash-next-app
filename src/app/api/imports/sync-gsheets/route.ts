import { NextRequest, NextResponse } from "next/server";
import { createImportPreview } from "@/server/imports/import-service";
import { ImportPreviewResponseSchema } from "@/lib/validators/import";
import { apiSuccess, apiError } from "@/lib/validators/api";
import { DomainError, getDomainErrorStatus, isDomainError } from "@/lib/errors/domain-error";
import { logError, logInfo } from "@/lib/logger";

export const maxDuration = 60;

function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([\w-]+)/);
  return match?.[1] ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string };
    const { url } = body;

    if (!url || typeof url !== "string") {
      throw new DomainError("MISSING_URL", "URL Google Sheets tidak ditemukan");
    }

    const sheetId = extractSheetId(url);
    if (!sheetId) {
      throw new DomainError("INVALID_URL", "URL Google Sheets tidak valid");
    }

    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
    logInfo("POST /api/imports/sync-gsheets", `Fetching sheet ${sheetId}`);

    let gResponse: Response;
    try {
      gResponse = await fetch(exportUrl);
    } catch {
      throw new DomainError(
        "FETCH_ERROR",
        "Gagal mengunduh Google Sheets. Pastikan spreadsheet bisa diakses publik.",
      );
    }

    if (!gResponse.ok) {
      throw new DomainError(
        "FETCH_ERROR",
        `Google Sheets mengembalikan HTTP ${gResponse.status}. Pastikan spreadsheet diset "Anyone with the link = Viewer".`,
      );
    }

    const buffer = Buffer.from(await gResponse.arrayBuffer());
    logInfo(
      "POST /api/imports/sync-gsheets",
      `Downloaded ${(buffer.length / 1024).toFixed(1)} KB, parsing...`,
    );

    const results = await createImportPreview(buffer, `gsheets-${sheetId}.xlsx`);

    if (results.length === 0) {
      throw new DomainError(
        "NO_SHEET_RECOGNIZED",
        "Tidak ada sheet yang dikenali dari spreadsheet ini",
      );
    }

    const parsed = ImportPreviewResponseSchema.parse(results);
    logInfo("POST /api/imports/sync-gsheets", `Done — ${parsed.length} sheet(s) recognized`);
    return NextResponse.json(apiSuccess(parsed));
  } catch (err) {
    logError("POST /api/imports/sync-gsheets", err);

    if (isDomainError(err)) {
      return NextResponse.json(apiError(err.code, err.message, err.details), {
        status: getDomainErrorStatus(err.code),
      });
    }

    return NextResponse.json(
      apiError("INTERNAL_ERROR", err instanceof Error ? err.message : "Internal server error"),
      { status: 500 },
    );
  }
}
