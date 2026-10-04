import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookieName } from "@/lib/auth";

const exactProtectedRoutes = [
  "/projects",
  "/projects/new",
  "/map",
];
const prefixProtectedRoutes = [
  "/complaints",
  "/consultations",
  "/documents",
  "/admin",
  "/planning",
];
const authRoutes = ["/login", "/register"];

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
    "/projects",
    "/projects/new",
    "/map",
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
