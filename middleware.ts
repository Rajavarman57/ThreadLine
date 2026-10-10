import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const DASHBOARD_ROUTES = [
  "/inventory",
  "/orders",
  "/production",
  "/quality",
  "/dispatch",
  "/finance",
  "/hr",
  "/master",
  "/expenses",
];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user;

  const isAuthRoute = nextUrl.pathname === "/login";
  const isPortalRoute = nextUrl.pathname.startsWith("/portal");
  const isDashboardRoute = DASHBOARD_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // 1. Redirect authenticated users away from /login
  if (isAuthRoute) {
    if (isLoggedIn) {
      if (user?.role === "BUYER") {
        return NextResponse.redirect(new URL("/portal", nextUrl));
      }
      return NextResponse.redirect(new URL("/orders", nextUrl));
    }
    return NextResponse.next();
  }

  // 2. Protect dashboard and portal routes
  if (isDashboardRoute || isPortalRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-specific routing: BUYER users must only access /portal
    if (user?.role === "BUYER") {
      if (isDashboardRoute) {
        return NextResponse.redirect(new URL("/portal", nextUrl));
      }
    } else {
      // Non-BUYER staff attempting /portal redirected to operational dashboard
      if (isPortalRoute) {
        return NextResponse.redirect(new URL("/orders", nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
