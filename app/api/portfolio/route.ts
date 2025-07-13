import { type NextRequest, NextResponse } from "next/server"
import { getUserPortfolio } from "@/lib/trading"
import { getUserById } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const portfolio = await getUserPortfolio(userId)
    const totalValue = portfolio.reduce((sum, item) => sum + item.quantity * item.current_price, 0)
    const totalPnL = portfolio.reduce((sum, item) => sum + item.unrealized_pnl, 0)

    return NextResponse.json({
      user: {
        virtual_balance: user.virtual_balance,
        total_portfolio_value: totalValue,
        total_unrealized_pnl: totalPnL,
      },
      portfolio,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 })
  }
}
