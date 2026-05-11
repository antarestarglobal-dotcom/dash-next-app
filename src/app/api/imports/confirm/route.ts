import { NextRequest, NextResponse } from "next/server";
import { confirmImport } from "@/server/imports/confirm-import-service";
import { ConfirmImportRequestSchema } from "@/lib/validators/import";
import { apiSuccess, apiError } from "@/lib/validators/api";
import { logError, devDetails } from "@/lib/logger";

export async function POST(req: NextRequest) {
  let importId: string | undefined;

  try {
    const body: unknown = await req.json();
    const parsed = ConfirmImportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        apiError("INVALID_REQUEST", "Request body tidak valid", parsed.error.flatten() as Record<string, unknown>),
        { status: 400 },
      );
    }

    importId = parsed.data.importId;
    await confirmImport(importId);
    return NextResponse.json(apiSuccess({ message: "Import berhasil dikonfirmasi" }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    logError("POST /api/imports/confirm", err, { importId });

    const status =
      message.includes("tidak ditemukan") ? 404
      : message.includes("sudah dikonfirmasi") || message.includes("gagal") ? 409
      : 500;

    return NextResponse.json(
      {
        ...apiError("CONFIRM_FAILED", message),
        ...(devDetails(err) && { debug: devDetails(err) }),
      },
      { status },
    );
  }
}
