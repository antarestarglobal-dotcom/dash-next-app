"use client";

import { apiFetch } from "@/lib/api-client";
import type { z } from "zod";

export const buildSearchParams = (filter: Readonly<Record<string, unknown>>): URLSearchParams =>
  new URLSearchParams(
    Object.entries(filter).flatMap(([key, value]) =>
      value === undefined || value === null || value === "" ? [] : [[key, String(value)]],
    ),
  );

export const fetchRunRate = async <TSchema extends z.ZodTypeAny>(
  path: string,
  schema: TSchema,
): Promise<z.output<TSchema>> => apiFetch(path, schema);
