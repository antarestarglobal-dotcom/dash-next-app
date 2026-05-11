import { NextRequest, NextResponse } from "next/server";
import { listImports } from "@/server/imports/import-repository";
import { ImportListQuerySchema } from "@/lib/validators/import";
import { apiSuccess, apiError } from "@/lib/validators/api";
import { logError, devDetails } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const query = Object.fromEntries(searchParams.entries());
    const parsed = ImportListQuerySchema.safeParse(query);

    if (!parsed.success) {
      return NextResponse.json(
        apiError("INVALID_QUERY", "Query params tidak valid"),
        { status: 400 },
      );
    }

    const imports = await listImports(parsed.data);
    return NextResponse.json(apiSuccess(imports));
  } catch (err) {
    logError("GET /api/imports", err);
    return NextResponse.json(
      {
        ...apiError("INTERNAL_ERROR", err instanceof Error ? err.message : "Internal server error"),
        ...(devDetails(err) && { debug: devDetails(err) }),
      },
      { status: 500 },
    );
  }
}
