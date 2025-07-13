import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { fetchStockPrice, isMarketOpen } from "@/lib/stock-data-fetcher"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Cron job endpoint to automatically update stock prices
// This can be called by Vercel Cron Jobs or external schedulers
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron job (optional security)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only update during market hours or if forced
    const marketOpen = isMarketOpen()
    const force = request.nextUrl.searchParams.get("force") === "true"

    if (!marketOpen && !force) {
      return NextResponse.json({
        message: "Market is closed, skipping update",
        market_open: false,
      })
    }

    // Get all stocks
    const { data: stocks, error } = await supabase.from("stocks").select("id, symbol")

    if (error || !stocks) {
      return NextResponse.json({ error: "Failed to fetch stocks" }, { status: 500 })
    }

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

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      message: "Stock prices updated successfully",
      market_open: marketOpen,
      updated,
      failed,
      total: stocks.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Failed to update stock prices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request) // Allow both GET and POST for flexibility
}
