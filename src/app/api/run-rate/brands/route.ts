import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/validators/api";
import { BrandsResponseSchema } from "@/lib/validators/run-rate";
import { getBrands } from "@/server/run-rate/run-rate-repository";
import { routeError } from "../_route-utils";

export const GET = async () => {
  try {
    const response = BrandsResponseSchema.parse(await getBrands());
    return NextResponse.json(apiSuccess(response));
  } catch (err) {
    return routeError("GET /api/run-rate/brands", err);
  }
};
