import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pbAuth = request.cookies.get("pb_auth");
  const pathname = request.nextUrl.pathname;

  // Public routes
  const publicPaths = ["/", "/login", "/signup"];
  const isPublicPath = publicPaths.includes(pathname);

  // If not authenticated and trying to access protected route
  if (!pbAuth && !isPublicPath && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If authenticated and trying to access login/signup
  if (pbAuth && (pathname === "/login" || pathname === "/signup")) {
    // Redirect to appropriate dashboard based on role
    // We'll handle this in the client side
    return NextResponse.redirect(new URL("/dashboard/host", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
