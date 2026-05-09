import { NextRequest, NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "newstart-admin-ok";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname.startsWith("/admin/");
  const isProtectedAdminApi =
    pathname.startsWith("/api/admin/") &&
    pathname !== "/api/admin/login" &&
    pathname !== "/api/admin/session";
  const isStateWrite = pathname === "/api/state" && request.method !== "GET";

  if (isAdminPage || isProtectedAdminApi || isStateWrite) {
    const hasSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value === "1";
    if (!hasSession) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ ok: false, message: "관리자 인증이 필요합니다." }, { status: 401 });
      }
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/state"]
};
