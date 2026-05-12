import { NextRequest, NextResponse } from "next/server";
import { listImports } from "@/server/imports/import-repository";
import { ImportListQuerySchema, ImportListResponseSchema } from "@/lib/validators/import";
import { apiSuccess, apiError } from "@/lib/validators/api";
import { DomainError, getDomainErrorStatus, isDomainError } from "@/lib/errors/domain-error";
import { logError, devDetails } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const query = Object.fromEntries(searchParams.entries());
    const parsed = ImportListQuerySchema.safeParse(query);

    if (!parsed.success) {
      throw new DomainError("INVALID_QUERY_PARAMS", "Query params tidak valid", {
        issues: parsed.error.flatten(),
      });
    }

    const imports = await listImports(parsed.data);
    const response = ImportListResponseSchema.parse(imports);
    return NextResponse.json(apiSuccess(response));
  } catch (err) {
    logError("GET /api/imports", err);

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
