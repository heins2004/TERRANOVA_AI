import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookieName } from "@/lib/auth";

const protectedRoutes = ["/dashboard", "/complaints", "/consultations", "/documents", "/admin", "/planning"];
const authRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const isAuthenticated = request.cookies.has(getSessionCookieName());
  const { pathname } = request.nextUrl;

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (authRoutes.some((route) => pathname.startsWith(route)) && isAuthenticated) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/complaints",
    "/complaints/:path*",
    "/consultations",
    "/consultations/:path*",
    "/documents",
    "/documents/:path*",
    "/admin",
    "/admin/:path*",
    "/planning",
    "/planning/:path*",
    "/login",
    "/register",
  ],
};
