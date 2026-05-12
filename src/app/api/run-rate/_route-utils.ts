import { NextResponse } from "next/server";
import { apiError } from "@/lib/validators/api";
import { devDetails, logError } from "@/lib/logger";

export const routeError = (route: string, err: unknown) => {
  logError(route, err);
  return NextResponse.json(
    {
      ...apiError("RUN_RATE_ERROR", err instanceof Error ? err.message : "Internal server error"),
      ...(devDetails(err) && { debug: devDetails(err) }),
    },
    { status: 500 },
  );
};

export const invalidFilter = (details: Record<string, unknown>) =>
  NextResponse.json(apiError("INVALID_FILTER", "Filter tidak valid", details), { status: 400 });
