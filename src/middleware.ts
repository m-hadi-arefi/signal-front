import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signToken, createAuthCookie } from "./lib/auth";

const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth/login", "/api/auth/register"];
const PUBLIC_PREFIXES = ["/api/auth/", "/api/mqtt/auth", "/api/health"];

// Re-issue the cookie when the token has less than 48h of life remaining.
const REFRESH_THRESHOLD_SECONDS = 48 * 60 * 60;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
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

  const headers = new Headers(req.headers);
  headers.set("x-user-id", payload.sub);
  headers.set("x-user-username", payload.username);
  headers.set("x-user-role", payload.role);

  const res = NextResponse.next({ request: { headers } });

  // Session extension: if the token is close to expiry, mint a fresh one.
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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)"],
};
