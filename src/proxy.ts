// Optimistic auth gate: no session cookie → /login. Real checks happen in
// requireMember() on every page and Server Action (cookies can be stale).
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/today", "/delivery", "/customers", "/payments", "/more", "/wastage", "/onboarding"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Public homepage: signed-in users go straight to the app.
  if (pathname === "/" && req.cookies.has("mess_session")) {
    return NextResponse.redirect(new URL("/today", req.url));
  }
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !req.cookies.has("mess_session")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/today/:path*", "/delivery/:path*", "/customers/:path*", "/payments/:path*", "/more/:path*", "/wastage/:path*", "/onboarding"],
};
