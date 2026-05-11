import { NextRequest, NextResponse } from "next/server";
import { getImportById } from "@/server/imports/import-repository";
import { apiSuccess, apiError } from "@/lib/validators/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const importRecord = await getImportById(id);

    if (!importRecord) {
      return NextResponse.json(apiError("NOT_FOUND", "Import tidak ditemukan"), { status: 404 });
    }

    return NextResponse.json(apiSuccess(importRecord));
  } catch (err) {
    return NextResponse.json(
      apiError("INTERNAL_ERROR", err instanceof Error ? err.message : "Internal server error"),
      { status: 500 },
    );
  }
}
