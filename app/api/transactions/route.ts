import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type") // BUY, SELL, or null for all

    let query = supabase
      .from("transactions")
      .select(`
        *,
        stocks!inner(symbol, company_name)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (type && ["BUY", "SELL"].includes(type)) {
      query = query.eq("type", type)
    }

    const { data: transactions, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    const formattedTransactions = (transactions || []).map((transaction) => ({
      id: transaction.id,
      symbol: transaction.stocks.symbol,
      company_name: transaction.stocks.company_name,
      type: transaction.type,
      quantity: transaction.quantity,
      price: transaction.price,
      total_value: transaction.total_value,
      created_at: transaction.created_at,
    }))

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        limit,
        offset,
        count: formattedTransactions.length,
      },
    })
  } catch (error) {
    console.error("Transactions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
