import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's portfolio with stock information
    const { data: portfolio, error } = await supabase
      .from("portfolio")
      .select(`
        *,
        stocks!inner(
          symbol,
          company_name,
          current_price,
          previous_close,
          sector
        )
      `)
      .eq("user_id", userId)
      .gt("quantity", 0)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 })
    }

    // Calculate portfolio metrics
    let totalValue = 0
    let totalCost = 0

    const holdings = (portfolio || []).map((holding) => {
      const currentValue = holding.quantity * holding.stocks.current_price
      const cost = holding.quantity * holding.average_price
      const unrealizedPnL = currentValue - cost
      const unrealizedPnLPercent = cost > 0 ? (unrealizedPnL / cost) * 100 : 0

      totalValue += currentValue
      totalCost += cost

      return {
        id: holding.id,
        symbol: holding.stocks.symbol,
        company_name: holding.stocks.company_name,
        quantity: holding.quantity,
        average_price: holding.average_price,
        current_price: holding.stocks.current_price,
        current_value: currentValue,
        total_cost: cost,
        unrealized_pnl: unrealizedPnL,
        unrealized_pnl_percent: unrealizedPnLPercent,
        sector: holding.stocks.sector,
      }
    })

    const totalUnrealizedPnL = totalValue - totalCost
    const totalUnrealizedPnLPercent = totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0

    return NextResponse.json({
      holdings,
      summary: {
        total_value: totalValue,
        total_cost: totalCost,
        total_unrealized_pnl: totalUnrealizedPnL,
        total_unrealized_pnl_percent: totalUnrealizedPnLPercent,
        holdings_count: holdings.length,
      },
    })
  } catch (error) {
    console.error("Portfolio API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
