import { NextRequest, NextResponse } from "next/server";
import { apiSuccess } from "@/lib/validators/api";
import { PlatformContributionResponseSchema, RunRateFilterSchema } from "@/lib/validators/run-rate";
import { getPlatformContribution } from "@/server/run-rate/run-rate-repository";
import { invalidFilter, routeError } from "../_route-utils";

export const GET = async (req: NextRequest) => {
  try {
    const parsed = RunRateFilterSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return invalidFilter({ issues: parsed.error.flatten() });
    const response = PlatformContributionResponseSchema.parse(await getPlatformContribution(parsed.data));
    return NextResponse.json(apiSuccess(response));
  } catch (err) {
    return routeError("GET /api/run-rate/platform-contribution", err);
  }
};
