import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJWT, getUserByApiKey } from "./lib/auth"
import { checkRateLimit } from "./lib/rate-limit"

export async function middleware(request: NextRequest) {
  // Only apply middleware to API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Skip auth for public endpoints
  const publicEndpoints = ["/api/auth/login", "/api/auth/register", "/api/docs"]
  if (publicEndpoints.some((endpoint) => request.nextUrl.pathname.startsWith(endpoint))) {
    return NextResponse.next()
  }

  let userId: string | null = null

  // Check for API key authentication
  const apiKey = request.headers.get("x-api-key")
  if (apiKey) {
    const user = await getUserByApiKey(apiKey)
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }
    userId = user.id
  } else {
    // Check for JWT authentication
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    userId = payload.userId
  }

  // Rate limiting
  const rateLimit = await checkRateLimit(userId, request.nextUrl.pathname)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(Date.now() + 60000).toISOString(),
        },
      },
    )
  }

  // Add user ID to headers for API routes
  const response = NextResponse.next()
  response.headers.set("x-user-id", userId)
  response.headers.set("x-ratelimit-remaining", rateLimit.remaining.toString())

  return response
}

export const config = {
  matcher: "/api/:path*",
}
