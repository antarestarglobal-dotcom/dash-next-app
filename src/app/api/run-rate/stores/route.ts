import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/validators/api";
import { StoresResponseSchema } from "@/lib/validators/run-rate";
import { getStores } from "@/server/run-rate/run-rate-repository";
import { routeError } from "../_route-utils";

export const GET = async () => {
  try {
    const response = StoresResponseSchema.parse(await getStores());
    return NextResponse.json(apiSuccess(response));
  } catch (err) {
    return routeError("GET /api/run-rate/stores", err);
  }
};
