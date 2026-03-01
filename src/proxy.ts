import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const pbAuth = request.cookies.get("pb_auth");
  const pathname = request.nextUrl.pathname;

  const isDashboardRoute = pathname.startsWith("/dashboard");
  if (!isDashboardRoute) {
    return NextResponse.next();
  }

  let hasValidSession = false;
  let role: string | undefined;
  let collectionName: string | undefined;

  if (pbAuth?.value) {
    try {
      const decoded = decodeURIComponent(pbAuth.value);
      const parsed = JSON.parse(decoded) as {
        token?: string;
        record?: { role?: string; collectionName?: string };
      };
      hasValidSession =
        typeof parsed.token === "string" && parsed.token.length > 0;
      role = parsed.record?.role;
      collectionName = parsed.record?.collectionName;
    } catch {
      hasValidSession = false;
    }
  }

  if (!hasValidSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/dashboard/admin")) {
    const isAdmin = role === "admin" || collectionName === "_superusers";
    if (!isAdmin) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/login";
      return NextResponse.redirect(homeUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
