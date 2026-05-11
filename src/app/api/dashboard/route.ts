import { NextRequest, NextResponse } from "next/server";
import {
  getDashboardSummary,
  getDailyMetrics,
  getHourlyHeatmap,
  getHostLeaderboard,
  getBestHour,
} from "@/server/dashboard/dashboard-repository";
import { DashboardFilterSchema } from "@/lib/validators/dashboard";
import { apiSuccess, apiError } from "@/lib/validators/api";
import { logError, devDetails } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const query = Object.fromEntries(searchParams.entries());
    const parsed = DashboardFilterSchema.safeParse(query);

    if (!parsed.success) {
      return NextResponse.json(apiError("INVALID_FILTER", "Filter tidak valid"), { status: 400 });
    }

    const filters = parsed.data;

    const [summary, dailyData, heatmap, hostLeaderboard, bestHour] = await Promise.all([
      getDashboardSummary(filters),
      getDailyMetrics(filters),
      getHourlyHeatmap(filters),
      getHostLeaderboard(filters),
      getBestHour(filters),
    ]);

    return NextResponse.json(
      apiSuccess({ summary, dailyMetrics: dailyData, heatmap, hostLeaderboard, bestHour }),
    );
  } catch (err) {
    logError("GET /api/dashboard", err);
    return NextResponse.json(
      {
        ...apiError("INTERNAL_ERROR", err instanceof Error ? err.message : "Internal server error"),
        ...(devDetails(err) && { debug: devDetails(err) }),
      },
      { status: 500 },
    );
  }
}
