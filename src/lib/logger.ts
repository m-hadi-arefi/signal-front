type LogLevel = "debug" | "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, fields?: LogFields) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, fields?: LogFields) => {
    if (process.env.NODE_ENV === "development") emit("debug", message, fields);
  },
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};

import { NextRequest, NextResponse } from "next/server";

type RouteHandler<T = unknown> = (
  req: NextRequest,
  ctx: T
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps an API route handler to log method/path/status/duration.
 */
export function withLogging<T = unknown>(handler: RouteHandler<T>): RouteHandler<T> {
  return async (req: NextRequest, ctx: T) => {
    const start = Date.now();
    const { method } = req;
    const path = new URL(req.url).pathname;
    try {
      const res = await handler(req, ctx);
      logger.info("request", {
        method,
        path,
        status: res.status,
        durationMs: Date.now() - start,
        userId: req.headers.get("x-user-id") ?? undefined,
      });
      return res;
    } catch (err) {
      logger.error("request_error", {
        method,
        path,
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  };
}
