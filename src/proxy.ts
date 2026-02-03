import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const pbAuth = request.cookies.get("pb_auth");
  const pathname = request.nextUrl.pathname;

  // TEMPORARY BYPASS: Always allow dashboard access (remove for real auth)
  return NextResponse.next();
  // Developer bypass: allow dashboard access when NEXT_PUBLIC_ALLOW_DASHBOARD=1
  /*
  try {
    if (process.env.NEXT_PUBLIC_ALLOW_DASHBOARD === "1") {
      return NextResponse.next();
    }
  } catch (e) {
    // ignore in edge runtime if env not available
  }
  */

  // Public routes (only home is public now)
  const publicPaths = ["/"];
  const isPublicPath = publicPaths.includes(pathname);

  // If not authenticated and trying to access protected route, send to home
  // (Bypassed above)

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
