import { NextRequest, NextResponse } from "next/server";
import { createImportPreview } from "@/server/imports/import-service";
import { ImportPreviewResponseSchema } from "@/lib/validators/import";
import { apiSuccess, apiError } from "@/lib/validators/api";
import { DomainError, getDomainErrorStatus, isDomainError } from "@/lib/errors/domain-error";
import { logError, logInfo } from "@/lib/logger";
import { validateFileBuffer } from "@/lib/spreadsheet/parse-spreadsheet";

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

    const BROWSER_HEADERS = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*",
    };

    let gResponse: Response;
    try {
      gResponse = await fetch(exportUrl, { headers: BROWSER_HEADERS, redirect: "follow" });
    } catch {
      throw new DomainError(
        "FETCH_ERROR",
        "Gagal mengunduh Google Sheets. Periksa koneksi server dan pastikan spreadsheet bisa diakses publik.",
      );
    }

    if (gResponse.status === 401 || gResponse.status === 403) {
      throw new DomainError(
        "FETCH_ERROR",
        `Google Sheets mengembalikan HTTP ${gResponse.status}. Buka spreadsheet → Share → General access → pilih "Anyone with the link" = Viewer.`,
      );
    }

    if (!gResponse.ok) {
      throw new DomainError(
        "FETCH_ERROR",
        `Google Sheets mengembalikan HTTP ${gResponse.status}. Pastikan spreadsheet diset "Anyone with the link = Viewer".`,
      );
    }

    const finalUrl = gResponse.url ?? "";
    if (finalUrl.includes("accounts.google.com") || finalUrl.includes("ServiceLogin")) {
      throw new DomainError(
        "FETCH_ERROR",
        'Google mengalihkan ke halaman login. Buka spreadsheet → Share → General access → pilih "Anyone with the link" = Viewer, lalu coba lagi.',
      );
    }

    const contentType = gResponse.headers.get("content-type") ?? "";
    if (contentType.includes("text/html") || contentType.includes("text/plain")) {
      throw new DomainError(
        "FETCH_ERROR",
        'Google mengalihkan ke halaman login. Buka spreadsheet → Share → General access → pilih "Anyone with the link" = Viewer, lalu coba lagi.',
      );
    }

    const buffer = Buffer.from(await gResponse.arrayBuffer());
    const fileValidation = validateFileBuffer(buffer, `gsheets-${sheetId}.xlsx`);
    if (!fileValidation.ok) {
      throw new DomainError(
        "FETCH_ERROR",
        `${fileValidation.error}. Pastikan link Google Sheets bisa diakses publik (Viewer).`,
      );
    }

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
