import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  "/api/stocks": { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute
  "/api/portfolio": { windowMs: 60000, maxRequests: 60 }, // 60 requests per minute
  "/api/trade": { windowMs: 60000, maxRequests: 30 }, // 30 trades per minute
  "/api/transactions": { windowMs: 60000, maxRequests: 60 }, // 60 requests per minute
  default: { windowMs: 60000, maxRequests: 100 },
}

export async function checkRateLimit(
  userId: string,
  endpoint: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const config = DEFAULT_LIMITS[endpoint] || DEFAULT_LIMITS.default
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)

  // Get or create rate limit record
  const { data: existing } = await supabase
    .from("api_rate_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .single()

  if (!existing) {
    // Create new record
    await supabase.from("api_rate_limits").insert({
      user_id: userId,
      endpoint,
      requests_count: 1,
      window_start: now,
    })
    return { allowed: true, remaining: config.maxRequests - 1 }
  }

  // Check if we need to reset the window
  const existingWindowStart = new Date(existing.window_start)
  if (existingWindowStart < windowStart) {
    // Reset window
    await supabase
      .from("api_rate_limits")
      .update({
        requests_count: 1,
        window_start: now,
      })
      .eq("id", existing.id)
    return { allowed: true, remaining: config.maxRequests - 1 }
  }

  // Check if limit exceeded
  if (existing.requests_count >= config.maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  // Increment counter
  await supabase
    .from("api_rate_limits")
    .update({
      requests_count: existing.requests_count + 1,
    })
    .eq("id", existing.id)

  return { allowed: true, remaining: config.maxRequests - existing.requests_count - 1 }
}
