import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJWT } from "./lib/auth"

export async function middleware(request: NextRequest) {
  // Skip middleware for public routes
  if (
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.startsWith("/api/docs") ||
    request.nextUrl.pathname.startsWith("/api/cron") ||
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register" ||
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // Check for JWT token in Authorization header or cookie
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value

  if (!token) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Verify JWT token
  const payload = await verifyJWT(token)
  if (!payload) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Add user ID to request headers for API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-user-id", payload.userId)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/portfolio/:path*",
    "/api/trade/:path*",
    "/api/transactions/:path*",
    "/api/user/:path*",
    "/api/v1/:path*",
  ],
}
