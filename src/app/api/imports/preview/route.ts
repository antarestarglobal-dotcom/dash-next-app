import { NextRequest, NextResponse } from "next/server";
import { createImportPreview } from "@/server/imports/import-service";
import { validateFileBuffer } from "@/lib/spreadsheet/parse-spreadsheet";
import { ImportPreviewResponseSchema } from "@/lib/validators/import";
import { apiSuccess, apiError } from "@/lib/validators/api";
import { DomainError, getDomainErrorStatus, isDomainError } from "@/lib/errors/domain-error";
import { logError, logInfo, devDetails } from "@/lib/logger";

// maxDuration is only honoured on Vercel — harmless in local dev
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      throw new DomainError("MISSING_FILE", "File tidak ditemukan");
    }

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      throw new DomainError(
        "UNSUPPORTED_FILE_TYPE",
        "Hanya file XLSX, XLS, atau CSV yang didukung",
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate file content before handing to xlsx library
    const validation = validateFileBuffer(buffer, file.name);
    if (!validation.ok) {
      throw new DomainError("INVALID_FILE", validation.error);
    }

    logInfo("POST /api/imports/preview", `Processing file`, {
      name: file.name,
      size: `${(buffer.length / 1024).toFixed(1)} KB`,
      type: file.type,
    });

    const results = await createImportPreview(buffer, file.name);

    if (results.length === 0) {
      throw new DomainError("NO_SHEET_RECOGNIZED", "Tidak ada sheet yang dikenali dari file ini");
    }

    const response = ImportPreviewResponseSchema.parse(results);
    logInfo("POST /api/imports/preview", `Done — ${response.length} sheet(s) processed`);
    return NextResponse.json(apiSuccess(response));
  } catch (err) {
    logError("POST /api/imports/preview", err);

    if (isDomainError(err)) {
      return NextResponse.json(
        {
          ...apiError(err.code, err.message, err.details),
          ...(devDetails(err) && { debug: devDetails(err) }),
        },
        { status: getDomainErrorStatus(err.code) },
      );
    }

    return NextResponse.json(
      {
        ...apiError("INTERNAL_ERROR", err instanceof Error ? err.message : "Internal server error"),
        ...(devDetails(err) && { debug: devDetails(err) }),
      },
      { status: 500 },
    );
  }
}
