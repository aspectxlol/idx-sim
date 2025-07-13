import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
}

export async function checkRateLimit(userId: string, endpoint: string): Promise<RateLimitResult> {
  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Different limits for different endpoints
  const limits = {
    "/api/trade": 500, // 500 trades per day
    default: 1000, // 1000 requests per day for other endpoints
  }

  const limit = limits[endpoint as keyof typeof limits] || limits.default

  try {
    // Get today's request count
    const { data: rateLimitData, error } = await supabase
      .from("rate_limits")
      .select("request_count")
      .eq("user_id", userId)
      .eq("endpoint", endpoint)
      .gte("created_at", dayStart.toISOString())
      .single()

    let currentCount = 0

    if (!error && rateLimitData) {
      currentCount = rateLimitData.request_count
    }

    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000), // Next day
      }
    }

    // Increment counter
    if (rateLimitData) {
      await supabase
        .from("rate_limits")
        .update({
          request_count: currentCount + 1,
          updated_at: now.toISOString(),
        })
        .eq("user_id", userId)
        .eq("endpoint", endpoint)
        .gte("created_at", dayStart.toISOString())
    } else {
      await supabase.from("rate_limits").insert({
        user_id: userId,
        endpoint,
        request_count: 1,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
    }

    return {
      allowed: true,
      remaining: limit - currentCount - 1,
      resetTime: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000),
    }
  } catch (error) {
    console.error("Rate limit check error:", error)
    // Allow request if rate limit check fails
    return {
      allowed: true,
      remaining: limit,
      resetTime: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000),
    }
  }
}
