import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { TEAM_BASE, TEAM_IMOVIES, TEAM_LOGIN } from "@/lib/routes";

function isProtectedApi(pathname: string, method: string) {
  if (pathname.startsWith("/api/upload") && method !== "GET") return true;
  if (pathname.startsWith("/api/admin/") && method !== "GET") return true;
  if (pathname === "/api/properties" && method !== "GET") return true;
  if (pathname.startsWith("/api/properties/") && method !== "GET") return true;
  if (pathname.startsWith("/api/users")) return true;
  if (pathname === "/api/company" && method !== "GET") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  const isTeamArea = pathname.startsWith(TEAM_BASE);
  const isLogin = pathname === TEAM_LOGIN || pathname.startsWith(`${TEAM_LOGIN}/`);

  if (isTeamArea && !isLogin) {
    if (!session) {
      const loginUrl = new URL(TEAM_LOGIN, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isLogin && session) {
    return NextResponse.redirect(new URL(TEAM_IMOVIES, request.url));
  }

  if (pathname === "/login" || pathname.startsWith("/admin")) {
    const target = pathname.startsWith("/admin")
      ? pathname.replace(/^\/admin/, TEAM_BASE)
      : TEAM_LOGIN;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (isProtectedApi(pathname, request.method) && !session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/team/valora",
    "/team/valora/:path*",
    "/admin/:path*",
    "/login",
    "/api/properties",
    "/api/properties/:path*",
    "/api/upload",
    "/api/upload/client",
    "/api/admin/:path*",
    "/api/users",
    "/api/users/:path*",
    "/api/company",
  ],
};
