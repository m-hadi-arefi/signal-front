import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

type RouteHandler<T = unknown> = (
  req: NextRequest,
  ctx: T
) => Promise<NextResponse> | NextResponse;

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
