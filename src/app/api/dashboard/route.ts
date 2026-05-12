import { NextRequest, NextResponse } from "next/server";
import {
  getDashboardSummary,
  getDailyMetrics,
  getHourlyHeatmap,
  getHostLeaderboard,
  getBestHour,
} from "@/server/dashboard/dashboard-repository";
import { DashboardFilterSchema, DashboardResponseSchema } from "@/lib/validators/dashboard";
import { apiSuccess, apiError } from "@/lib/validators/api";
import { DomainError, getDomainErrorStatus, isDomainError } from "@/lib/errors/domain-error";
import { logError, devDetails } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const query = Object.fromEntries(searchParams.entries());
    const parsed = DashboardFilterSchema.safeParse(query);

    if (!parsed.success) {
      throw new DomainError("INVALID_FILTER_PARAMS", "Filter tidak valid", {
        issues: parsed.error.flatten(),
      });
    }

    const filters = parsed.data;

    const [summary, dailyData, heatmap, hostLeaderboard, bestHour] = await Promise.all([
      getDashboardSummary(filters),
      getDailyMetrics(filters),
      getHourlyHeatmap(filters),
      getHostLeaderboard(filters),
      getBestHour(filters),
    ]);

    const response = DashboardResponseSchema.parse({
      summary,
      dailyMetrics: dailyData,
      heatmap,
      hostLeaderboard,
      bestHour,
    });

    return NextResponse.json(apiSuccess(response));
  } catch (err) {
    logError("GET /api/dashboard", err);

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
