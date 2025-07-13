import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { fetchStockPrice, isMarketOpen } from "@/lib/stock-data-fetcher"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get all stocks
    const { data: stocks, error } = await supabase.from("stocks").select("id, symbol")

    if (error || !stocks) {
      return NextResponse.json({ error: "Failed to fetch stocks" }, { status: 500 })
    }

    const marketOpen = isMarketOpen()
    let updated = 0
    const failed: string[] = []

    // Update prices for all stocks
    for (const stock of stocks) {
      try {
        const priceData = await fetchStockPrice(stock.symbol)

        if (priceData) {
          const { error: updateError } = await supabase
            .from("stocks")
            .update({
              current_price: priceData.current_price,
              previous_close: priceData.previous_close,
              change_percent: priceData.change_percent,
              volume: priceData.volume,
              updated_at: new Date().toISOString(),
            })
            .eq("id", stock.id)

          if (!updateError) {
            updated++
          } else {
            failed.push(stock.symbol)
          }
        } else {
          failed.push(stock.symbol)
        }
      } catch (error) {
        failed.push(stock.symbol)
      }
    }

    return NextResponse.json({
      message: "Price update completed",
      market_open: marketOpen,
      updated,
      failed,
      total: stocks.length,
    })
  } catch (error) {
    console.error("Price update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
