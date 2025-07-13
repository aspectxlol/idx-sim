import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get("symbol")

    if (symbol) {
      // Get specific stock
      const { data: stock, error } = await supabase
        .from("stocks")
        .select("*")
        .eq("symbol", symbol.toUpperCase())
        .single()

      if (error || !stock) {
        return NextResponse.json({ error: "Stock not found" }, { status: 404 })
      }

      return NextResponse.json({ stock })
    } else {
      // Get all stocks
      const { data: stocks, error } = await supabase.from("stocks").select("*").order("symbol")

      if (error) {
        return NextResponse.json({ error: "Failed to fetch stocks" }, { status: 500 })
      }

      return NextResponse.json({ stocks: stocks || [] })
    }
  } catch (error) {
    console.error("Stocks API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
