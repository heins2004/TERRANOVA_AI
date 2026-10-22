import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookieName } from "@/lib/auth";

const exactProtectedRoutes = [
  "/profile",
];
const prefixProtectedRoutes = [
  "/admin",
  "/gov",
  "/planner",
];

export function proxy(request: NextRequest) {
  const isAuthenticated = request.cookies.has(getSessionCookieName());
  const { pathname } = request.nextUrl;

  const isExactProtected = exactProtectedRoutes.includes(pathname);
  const isPrefixProtected = prefixProtectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if ((isExactProtected || isPrefixProtected) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile",
    "/admin",
    "/admin/:path*",
    "/gov",
    "/gov/:path*",
    "/planner",
    "/planner/:path*",
    "/login",
    "/register",
  ],
};
