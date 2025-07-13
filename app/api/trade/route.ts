import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { symbol, type, quantity } = await request.json()

    if (!symbol || !type || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["BUY", "SELL"].includes(type)) {
      return NextResponse.json({ error: "Invalid trade type" }, { status: 400 })
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: "Quantity must be positive" }, { status: 400 })
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

    // Execute trade using stored procedure
    const { data: result, error: tradeError } = await supabase.rpc(
      type === "BUY" ? "execute_buy_order" : "execute_sell_order",
      {
        p_user_id: userId,
        p_stock_id: stock.id,
        p_quantity: quantity,
        p_price: stock.current_price,
      },
    )

    if (tradeError) {
      return NextResponse.json({ error: tradeError.message }, { status: 400 })
    }

    return NextResponse.json({
      message: `${type} order executed successfully`,
      trade: {
        symbol: symbol.toUpperCase(),
        type,
        quantity,
        price: stock.current_price,
        total_value: quantity * stock.current_price,
      },
    })
  } catch (error) {
    console.error("Trade API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
