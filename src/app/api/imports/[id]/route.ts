import { NextRequest, NextResponse } from "next/server";
import { getImportPublicById } from "@/server/imports/import-repository";
import { apiSuccess, apiError } from "@/lib/validators/api";
import { ImportDetailResponseSchema } from "@/lib/validators/import";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const importRecord = await getImportPublicById(id);

    if (!importRecord) {
      return NextResponse.json(apiError("NOT_FOUND", "Import tidak ditemukan"), { status: 404 });
    }

    const response = ImportDetailResponseSchema.parse(importRecord);
    return NextResponse.json(apiSuccess(response));
  } catch (err) {
    return NextResponse.json(
      apiError("INTERNAL_ERROR", err instanceof Error ? err.message : "Internal server error"),
      { status: 500 },
    );
  }
}
