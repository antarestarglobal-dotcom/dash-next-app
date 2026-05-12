import { NextRequest, NextResponse } from "next/server";
import { apiSuccess } from "@/lib/validators/api";
import { StockFilterSchema, StockResponseSchema } from "@/lib/validators/run-rate";
import { getStockStatus } from "@/server/run-rate/run-rate-repository";
import { invalidFilter, routeError } from "../_route-utils";

export const GET = async (req: NextRequest) => {
  try {
    const parsed = StockFilterSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return invalidFilter({ issues: parsed.error.flatten() });
    const response = StockResponseSchema.parse(await getStockStatus(parsed.data));
    return NextResponse.json(apiSuccess(response));
  } catch (err) {
    return routeError("GET /api/run-rate/stock", err);
  }
};
