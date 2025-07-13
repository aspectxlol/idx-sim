import { type NextRequest, NextResponse } from "next/server"
import { getAllStocks, getStockBySymbol } from "@/lib/trading"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get("symbol")

    if (symbol) {
      const stock = await getStockBySymbol(symbol)
      if (!stock) {
        return NextResponse.json({ error: "Stock not found" }, { status: 404 })
      }
      return NextResponse.json({ stock })
    }

    const stocks = await getAllStocks()
    return NextResponse.json({ stocks })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stocks" }, { status: 500 })
  }
}
