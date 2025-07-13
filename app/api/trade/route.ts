import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    const { symbol, type, quantity } = await request.json()

    if (!symbol || !type || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid trade parameters" }, { status: 400 })
    }

    if (!["BUY", "SELL"].includes(type.toUpperCase())) {
      return NextResponse.json({ error: "Invalid trade type" }, { status: 400 })
    }

    // Get stock information
    const { data: stock, error: stockError } = await supabase
      .from("stocks")
      .select("*")
      .eq("symbol", symbol.toUpperCase())
      .single()

    if (stockError || !stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 })
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

    const tradeValue = quantity * stock.current_price
    const tradeType = type.toUpperCase()

    if (tradeType === "BUY") {
      // Check if user has enough balance
      if (user.virtual_balance < tradeValue) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
      }

      // Execute buy transaction
      const { error: transactionError } = await supabase.rpc("execute_buy_trade", {
        p_user_id: userId,
        p_stock_id: stock.id,
        p_quantity: quantity,
        p_price: stock.current_price,
        p_total_value: tradeValue,
      })

      if (transactionError) {
        console.error("Buy trade error:", transactionError)
        return NextResponse.json({ error: "Failed to execute buy trade" }, { status: 500 })
      }
    } else {
      // SELL - Check if user has enough shares
      const { data: holding, error: holdingError } = await supabase
        .from("portfolio")
        .select("quantity")
        .eq("user_id", userId)
        .eq("stock_id", stock.id)
        .single()

      if (holdingError || !holding || holding.quantity < quantity) {
        return NextResponse.json({ error: "Insufficient shares to sell" }, { status: 400 })
      }

      // Execute sell transaction
      const { error: transactionError } = await supabase.rpc("execute_sell_trade", {
        p_user_id: userId,
        p_stock_id: stock.id,
        p_quantity: quantity,
        p_price: stock.current_price,
        p_total_value: tradeValue,
      })

      if (transactionError) {
        console.error("Sell trade error:", transactionError)
        return NextResponse.json({ error: "Failed to execute sell trade" }, { status: 500 })
      }
    }

    return NextResponse.json({
      message: `${tradeType} order executed successfully`,
      trade: {
        symbol: stock.symbol,
        type: tradeType,
        quantity,
        price: stock.current_price,
        total_value: tradeValue,
      },
    })
  } catch (error) {
    console.error("Trade API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
