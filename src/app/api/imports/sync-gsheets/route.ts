import { NextRequest, NextResponse } from "next/server";
import { createImportPreview } from "@/server/imports/import-service";
import { ImportPreviewResponseSchema } from "@/lib/validators/import";
import { apiSuccess, apiError } from "@/lib/validators/api";
import { DomainError, getDomainErrorStatus, isDomainError } from "@/lib/errors/domain-error";
import { logError, logInfo, logWarn } from "@/lib/logger";
import { validateFileBuffer } from "@/lib/spreadsheet/parse-spreadsheet";
import { fetchAllSheets } from "@/lib/gsheets/fetch-sheets-api";
import { buildXlsxBuffer } from "@/lib/gsheets/build-xlsx-buffer";

export const maxDuration = 60;

function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([\w-]+)/);
  return match?.[1] ?? null;
}

// ─── Method A: Google Sheets API v4 (bypasses download restrictions) ──────────

async function fetchBufferViaApi(sheetId: string, apiKey: string): Promise<Buffer> {
  logInfo("sync-gsheets", `Using Sheets API v4 for ${sheetId}`);
  const sheets = await fetchAllSheets(sheetId, apiKey);
  if (sheets.length === 0) {
    throw new DomainError("FETCH_ERROR", "Sheets API tidak mengembalikan data. Pastikan spreadsheet publik (Anyone with link = Viewer).");
  }
  logInfo("sync-gsheets", `API: ${sheets.length} sheet(s) fetched, building XLSX...`);
  return buildXlsxBuffer(sheets);
}

// ─── Method B: XLSX export URL (requires download not restricted) ─────────────

async function fetchBufferViaExport(sheetId: string): Promise<Buffer> {
  logInfo("sync-gsheets", `Using XLSX export URL for ${sheetId}`);
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;

  const res = await fetch(exportUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*",
    },
    redirect: "follow",
  });

  if (res.status === 401 || res.status === 403) {
    throw new DomainError(
      "FETCH_ERROR",
      `Google Sheets mengembalikan HTTP ${res.status}. File kemungkinan mengaktifkan "Prevent download for viewers". ` +
      `Solusi: (1) Set GOOGLE_SHEETS_API_KEY di .env untuk bypass restriction, atau (2) minta owner matikan setting download restriction.`,
    );
  }
  if (!res.ok) {
    throw new DomainError("FETCH_ERROR", `Google Sheets HTTP ${res.status}. Pastikan file publik.`);
  }

  const finalUrl = res.url ?? "";
  if (finalUrl.includes("accounts.google.com") || finalUrl.includes("ServiceLogin")) {
    throw new DomainError(
      "FETCH_ERROR",
      "Google mengalihkan ke halaman login — download diblokir. Set GOOGLE_SHEETS_API_KEY di .env untuk bypass.",
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    throw new DomainError(
      "FETCH_ERROR",
      "Google mengembalikan HTML bukan XLSX — download diblokir. Set GOOGLE_SHEETS_API_KEY di .env untuk bypass.",
    );
  }

  return Buffer.from(await res.arrayBuffer());
}

// ─── Route handler ────────────────────────────────────────────────────────────

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

    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

    let buffer: Buffer;

    if (apiKey) {
      // Preferred: use Sheets API v4 — works even with download restrictions
      buffer = await fetchBufferViaApi(sheetId, apiKey);
    } else {
      // Fallback: XLSX export URL — requires download not restricted
      logWarn("sync-gsheets", "GOOGLE_SHEETS_API_KEY not set — falling back to export URL (may fail if download is restricted)");
      buffer = await fetchBufferViaExport(sheetId);
    }

    const fileValidation = validateFileBuffer(buffer, `gsheets-${sheetId}.xlsx`);
    if (!fileValidation.ok) {
      throw new DomainError("FETCH_ERROR", `File tidak valid: ${fileValidation.error}`);
    }

    logInfo("sync-gsheets", `Buffer ${(buffer.length / 1024).toFixed(1)} KB — parsing...`);

    const results = await createImportPreview(buffer, `gsheets-${sheetId}.xlsx`);

    if (results.length === 0) {
      throw new DomainError("NO_SHEET_RECOGNIZED", "Tidak ada sheet yang dikenali dari spreadsheet ini");
    }

    const parsed = ImportPreviewResponseSchema.parse(results);
    logInfo("sync-gsheets", `Done — ${parsed.length} sheet(s) recognized`);
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
