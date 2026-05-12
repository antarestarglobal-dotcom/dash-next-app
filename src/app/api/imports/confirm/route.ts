import { NextRequest, NextResponse } from "next/server";
import { confirmImport } from "@/server/imports/confirm-import-service";
import { ConfirmImportRequestSchema, ConfirmImportResponseSchema } from "@/lib/validators/import";
import { apiSuccess, apiError } from "@/lib/validators/api";
import { getDomainErrorStatus, isDomainError } from "@/lib/errors/domain-error";
import { logError, devDetails } from "@/lib/logger";

export async function POST(req: NextRequest) {
  let importId: string | undefined;

  try {
    const body: unknown = await req.json();
    const parsed = ConfirmImportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        apiError("INVALID_REQUEST", "Request body tidak valid", parsed.error.flatten()),
        { status: 400 },
      );
    }

    importId = parsed.data.importId;
    await confirmImport(importId);
    const response = ConfirmImportResponseSchema.parse({
      message: "Import berhasil dikonfirmasi",
    });
    return NextResponse.json(apiSuccess(response));
  } catch (err) {
    logError("POST /api/imports/confirm", err, { importId });

    if (isDomainError(err)) {
      return NextResponse.json(
        {
          ...apiError(err.code, err.message, err.details),
          ...(devDetails(err) && { debug: devDetails(err) }),
        },
        { status: getDomainErrorStatus(err.code) },
      );
    }

    const message = err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json(
      {
        ...apiError("CONFIRM_FAILED", message),
        ...(devDetails(err) && { debug: devDetails(err) }),
      },
      { status: 500 },
    );
  }
}
