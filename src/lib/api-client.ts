import { z } from "zod";
import { ApiErrorResponseSchema } from "./validators/api";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function safeParseJson(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    throw new ApiError(
      "UNEXPECTED_CONTENT_TYPE",
      `Server mengembalikan respons non-JSON (HTTP ${res.status})`,
      res.status,
    );
  }
  try {
    return await res.json();
  } catch {
    throw new ApiError("INVALID_JSON", "Respons server tidak dapat dibaca", res.status);
  }
}

export async function apiFetch<T>(
  input: string | URL,
  dataSchema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  let res: Response;

  try {
    res = await fetch(input, init);
  } catch {
    throw new ApiError("NETWORK_ERROR", "Tidak dapat terhubung ke server", 0);
  }

  const body = await safeParseJson(res);

  if (!res.ok) {
    const errParsed = ApiErrorResponseSchema.safeParse(body);
    if (errParsed.success) {
      throw new ApiError(
        errParsed.data.error.code,
        errParsed.data.error.message,
        res.status,
        errParsed.data.error.details,
      );
    }
    throw new ApiError("HTTP_ERROR", `Request gagal (HTTP ${res.status})`, res.status);
  }

  const envelope = z.object({ success: z.literal(true), data: z.unknown() }).safeParse(body);
  if (!envelope.success) {
    throw new ApiError("INVALID_RESPONSE", "Format respons server tidak dikenali", res.status);
  }

  const dataParsed = dataSchema.safeParse(envelope.data.data);
  if (!dataParsed.success) {
    throw new ApiError("INVALID_RESPONSE", "Format respons server tidak dikenali", res.status);
  }

  return dataParsed.data;
}
