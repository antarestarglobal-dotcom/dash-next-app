const isDev = process.env.NODE_ENV === "development";

function ts() {
  return new Date().toISOString().replace("T", " ").slice(0, 23);
}

export function logInfo(label: string, message: string, meta?: Record<string, unknown>) {
  if (!isDev) return;
  console.log(`\x1b[36m[${ts()}] ℹ ${label}\x1b[0m ${message}`, meta ? JSON.stringify(meta) : "");
}

export function logWarn(label: string, message: string, meta?: Record<string, unknown>) {
  if (!isDev) return;
  console.warn(`\x1b[33m[${ts()}] ⚠ ${label}\x1b[0m ${message}`, meta ? JSON.stringify(meta) : "");
}

export function logError(label: string, err: unknown, meta?: Record<string, unknown>) {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  if (isDev) {
    console.error(`\x1b[31m\n[${ts()}] ✖ ${label}\x1b[0m`);
    if (meta && Object.keys(meta).length > 0) {
      console.error(`  \x1b[2mContext:\x1b[0m`, JSON.stringify(meta, null, 2));
    }
    console.error(`  \x1b[2mMessage:\x1b[0m`, msg);
    if (stack) console.error(`  \x1b[2mStack:\x1b[0m\n${stack}`);
  } else {
    console.error(`[ERROR] ${label}: ${msg}`);
  }
}

export function devDetails(err: unknown): Record<string, unknown> | undefined {
  if (!isDev) return undefined;
  return {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? (err.stack ?? null) : null,
    cause: err instanceof Error && err.cause ? String(err.cause) : null,
  };
}
