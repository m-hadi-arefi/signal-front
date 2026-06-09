import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signToken, createAuthCookie } from "./lib/auth";

const PUBLIC_PATHS = ["/", "/login", "/register"];

// API routes fully public (all methods, no auth required)
const PUBLIC_API_PREFIXES_ALL_METHODS = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/mqtt/auth", // Called by EMQX broker — not by browsers
  // NOTE: /api/health is intentionally excluded — requires auth
];

// API routes that allow read-only (GET/HEAD) access without authentication.
const PUBLIC_API_PREFIXES: string[] = [];

const READ_ONLY_METHODS = ["GET", "HEAD"];

// Page routes accessible without login
const PUBLIC_PAGE_PREFIXES: string[] = [];

const REFRESH_THRESHOLD_SECONDS = 48 * 60 * 60;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API_PREFIXES_ALL_METHODS.some((p) => pathname.startsWith(p))) {
      return applyHeaders(req, null);
    }
    if (
      PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p)) &&
      READ_ONLY_METHODS.includes(req.method)
    ) {
      return applyHeaders(req, null);
    }
  } else {
    if (PUBLIC_PAGE_PREFIXES.some((p) => pathname.startsWith(p))) {
      return applyHeaders(req, null);
    }
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const res = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("token");
    return res;
  }

  const res = applyHeaders(req, payload);

  // Session extension: re-issue cookie if expiring within 48h
  if (payload.exp) {
    const remaining = payload.exp - Math.floor(Date.now() / 1000);
    if (remaining > 0 && remaining < REFRESH_THRESHOLD_SECONDS) {
      const fresh = await signToken({
        sub: payload.sub,
        username: payload.username,
        role: payload.role,
      });
      res.cookies.set(createAuthCookie(fresh));
    }
  }

  return res;
}

function applyHeaders(
  req: NextRequest,
  payload: { sub: string; username: string; role: string } | null
): NextResponse {
  const headers = new Headers(req.headers);
  // Always strip client-supplied identity headers to prevent spoofing,
  // then re-set them only when we have a verified payload.
  headers.delete("x-user-id");
  headers.delete("x-user-username");
  headers.delete("x-user-role");
  if (payload) {
    headers.set("x-user-id", payload.sub);
    headers.set("x-user-username", payload.username);
    headers.set("x-user-role", payload.role);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)"],
};
