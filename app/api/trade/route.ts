import { type NextRequest, NextResponse } from "next/server"
import { executeTrade } from "@/lib/trading"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    const { symbol, type, quantity } = await request.json()

    if (!symbol || !type || !quantity) {
      return NextResponse.json({ error: "Symbol, type, and quantity are required" }, { status: 400 })
    }

    if (!["BUY", "SELL"].includes(type)) {
      return NextResponse.json({ error: "Type must be BUY or SELL" }, { status: 400 })
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: "Quantity must be positive" }, { status: 400 })
    }

    const result = await executeTrade(userId, symbol, type, quantity)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      message: result.message,
      transaction: result.transaction,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to execute trade" }, { status: 500 })
  }
}
