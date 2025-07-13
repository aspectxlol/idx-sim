import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    // Get user's current balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("virtual_balance")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's portfolio holdings
    const { data: holdings, error: holdingsError } = await supabase
      .from("portfolio")
      .select(`
        *,
        stocks (symbol, company_name, current_price)
      `)
      .eq("user_id", userId)
      .gt("quantity", 0)

    if (holdingsError) {
      return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 })
    }

    // Calculate portfolio metrics
    let totalPortfolioValue = 0
    let totalUnrealizedPnL = 0

    const portfolioWithMetrics = (holdings || []).map((holding: any) => {
      const currentValue = holding.quantity * holding.stocks.current_price
      const totalCost = holding.quantity * holding.average_price
      const unrealizedPnL = currentValue - totalCost
      const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0

      totalPortfolioValue += currentValue
      totalUnrealizedPnL += unrealizedPnL

      return {
        ...holding,
        current_value: currentValue,
        total_cost: totalCost,
        unrealized_pnl: unrealizedPnL,
        unrealized_pnl_percent: unrealizedPnLPercent,
      }
    })

    return NextResponse.json({
      user: {
        virtual_balance: user.virtual_balance,
        total_portfolio_value: totalPortfolioValue,
        total_unrealized_pnl: totalUnrealizedPnL,
      },
      holdings: portfolioWithMetrics,
    })
  } catch (error) {
    console.error("Portfolio API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
