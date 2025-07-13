import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface RateLimit {
  requests_today: number
  trades_today: number
  last_reset: string
}

export async function checkRateLimit(
  userId: string,
  type: "request" | "trade" = "request",
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
  const today = new Date().toISOString().split("T")[0]

  // Get or create rate limit record
  let { data: rateLimit, error } = await supabase.from("rate_limits").select("*").eq("user_id", userId).single()

  if (error || !rateLimit) {
    // Create new rate limit record
    const { data: newRateLimit, error: createError } = await supabase
      .from("rate_limits")
      .insert({
        user_id: userId,
        requests_today: 0,
        trades_today: 0,
        last_reset: today,
      })
      .select()
      .single()

    if (createError) {
      throw new Error("Failed to create rate limit record")
    }
    rateLimit = newRateLimit
  }

  // Reset counters if it's a new day
  if (rateLimit.last_reset !== today) {
    const { data: resetRateLimit, error: resetError } = await supabase
      .from("rate_limits")
      .update({
        requests_today: 0,
        trades_today: 0,
        last_reset: today,
      })
      .eq("user_id", userId)
      .select()
      .single()

    if (resetError) {
      throw new Error("Failed to reset rate limit")
    }
    rateLimit = resetRateLimit
  }

  const limits = {
    request: 1000, // 1000 requests per day
    trade: 500, // 500 trades per day
  }

  const currentCount = type === "request" ? rateLimit.requests_today : rateLimit.trades_today
  const limit = limits[type]
  const allowed = currentCount < limit

  if (allowed) {
    // Increment counter
    const updateField = type === "request" ? "requests_today" : "trades_today"
    await supabase
      .from("rate_limits")
      .update({ [updateField]: currentCount + 1 })
      .eq("user_id", userId)
  }

  const resetTime = new Date()
  resetTime.setDate(resetTime.getDate() + 1)
  resetTime.setHours(0, 0, 0, 0)

  return {
    allowed,
    remaining: Math.max(0, limit - currentCount - (allowed ? 1 : 0)),
    resetTime,
  }
}

export async function getRateLimitStatus(userId: string): Promise<{
  requests: { used: number; limit: number; remaining: number }
  trades: { used: number; limit: number; remaining: number }
  resetTime: Date
}> {
  const today = new Date().toISOString().split("T")[0]

  const { data: rateLimit } = await supabase.from("rate_limits").select("*").eq("user_id", userId).single()

  const requestsUsed = rateLimit?.last_reset === today ? rateLimit.requests_today : 0
  const tradesUsed = rateLimit?.last_reset === today ? rateLimit.trades_today : 0

  const resetTime = new Date()
  resetTime.setDate(resetTime.getDate() + 1)
  resetTime.setHours(0, 0, 0, 0)

  return {
    requests: {
      used: requestsUsed,
      limit: 1000,
      remaining: Math.max(0, 1000 - requestsUsed),
    },
    trades: {
      used: tradesUsed,
      limit: 500,
      remaining: Math.max(0, 500 - tradesUsed),
    },
    resetTime,
  }
}
