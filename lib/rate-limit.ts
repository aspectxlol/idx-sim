import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

// Update rate limits to 1000 requests per day instead of per minute
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  "/api/stocks": { windowMs: 86400000, maxRequests: 1000 }, // 1000 requests per day (24 hours)
  "/api/portfolio": { windowMs: 86400000, maxRequests: 1000 }, // 1000 requests per day
  "/api/trade": { windowMs: 86400000, maxRequests: 500 }, // 500 trades per day (more conservative)
  "/api/transactions": { windowMs: 86400000, maxRequests: 1000 }, // 1000 requests per day
  default: { windowMs: 86400000, maxRequests: 1000 }, // 1000 requests per day default
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
