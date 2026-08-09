import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionCookieName } from "@/lib/auth";

const protectedRoutes = ["/home"];
const authRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const isAuthenticated = request.cookies.has(getSessionCookieName());
  const { pathname } = request.nextUrl;

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (authRoutes.some((route) => pathname.startsWith(route)) && isAuthenticated) {
    const homeUrl = new URL("/home", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/login", "/register"],
};
