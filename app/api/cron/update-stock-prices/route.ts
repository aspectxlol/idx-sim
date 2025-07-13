import { NextResponse } from "next/server"
import { updateAllStockPrices } from "@/lib/stock-data-fetcher"

// Cron job endpoint to automatically update stock prices
// This can be called by Vercel Cron Jobs or external schedulers
export async function GET(request) {
  try {
    // Verify the request is from a cron job (optional security)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await updateAllStockPrices()

    return NextResponse.json({
      message: "Stock prices updated successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Failed to update stock prices" }, { status: 500 })
  }
}

export async function POST(request) {
  return GET(request) // Allow both GET and POST for flexibility
}
