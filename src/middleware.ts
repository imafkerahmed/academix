import {
  withMiddlewareAuthRequired,
  getSession,
} from "@auth0/nextjs-auth0/edge";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withMiddlewareAuthRequired(async function middleware(
  req: NextRequest,
) {
  const session = await getSession(req, new NextResponse());

  if (!session) {
    return NextResponse.redirect(new URL("/api/auth/login", req.url));
  }

  const user = session.user;
  const pathname = req.nextUrl.pathname;

  // Get role from Auth0 custom claims
  const role = user["https://yourapp.com/role"] || "attendee";

  // Protect host routes
  if (pathname.startsWith("/dashboard/host") && role !== "host") {
    return NextResponse.redirect(new URL("/dashboard/attendee", req.url));
  }

  // Protect attendee routes
  if (pathname.startsWith("/dashboard/attendee") && role === "host") {
    return NextResponse.redirect(new URL("/dashboard/host", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
