import { NextResponse } from "next/server"
import { updateAllStockPrices } from "@/lib/stock-data-fetcher"

// API endpoint to manually trigger stock price updates
export async function POST() {
  try {
    await updateAllStockPrices()
    return NextResponse.json({ message: "Stock prices updated successfully" })
  } catch (error) {
    console.error("Error updating stock prices:", error)
    return NextResponse.json({ error: "Failed to update stock prices" }, { status: 500 })
  }
}

// GET endpoint to check when prices were last updated
export async function GET() {
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data, error } = await supabase
      .from("stocks")
      .select("symbol, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      last_updated: data?.[0]?.updated_at || null,
      message: "Use POST to trigger price update",
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to check update status" }, { status: 500 })
  }
}
