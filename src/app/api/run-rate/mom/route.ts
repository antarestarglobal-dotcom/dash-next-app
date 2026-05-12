import { NextRequest, NextResponse } from "next/server";
import { apiSuccess } from "@/lib/validators/api";
import { MoMFilterSchema, MoMResponseSchema } from "@/lib/validators/run-rate";
import { getMoMComparison } from "@/server/run-rate/run-rate-repository";
import { invalidFilter, routeError } from "../_route-utils";

const parseMonths = (req: NextRequest): string[] => {
  const values = [
    ...req.nextUrl.searchParams.getAll("months[]"),
    ...req.nextUrl.searchParams.getAll("months"),
  ];
  return values.flatMap((value) => value.split(",").map((month) => month.trim()).filter(Boolean));
};

export const GET = async (req: NextRequest) => {
  try {
    const parsed = MoMFilterSchema.safeParse({
      months: parseMonths(req),
      storeId: req.nextUrl.searchParams.get("storeId") ?? undefined,
    });
    if (!parsed.success) return invalidFilter({ issues: parsed.error.flatten() });
    const response = MoMResponseSchema.parse(
      await getMoMComparison(parsed.data.months, parsed.data.storeId),
    );
    return NextResponse.json(apiSuccess(response));
  } catch (err) {
    return routeError("GET /api/run-rate/mom", err);
  }
};
