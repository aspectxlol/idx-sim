import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface HistoricalDataPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjusted_close: number
}

// Mock historical data generator for demonstration
function generateHistoricalData(ticker: string, startDate: string, endDate: string): HistoricalDataPoint[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const data: HistoricalDataPoint[] = []

  // Base prices for different stocks
  const basePrices: { [key: string]: number } = {
    BBCA: 8000,
    BBRI: 4500,
    GOTO: 100,
    EMTK: 2500,
    TLKM: 3500,
    ASII: 6000,
    UNVR: 4200,
    BMRI: 5500,
    BBNI: 7200,
    ICBP: 10500,
  }

  let currentPrice = basePrices[ticker] || 1000
  const current = new Date(start)

  while (current <= end) {
    // Skip weekends
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      // Generate realistic price movements
      const volatility = 0.02 // 2% daily volatility
      const trend = 0.0001 // Slight upward trend
      const randomChange = (Math.random() - 0.5) * volatility
      const priceChange = (trend + randomChange) * currentPrice

      const open = currentPrice
      const close = currentPrice + priceChange
      const high = Math.max(open, close) * (1 + Math.random() * 0.01)
      const low = Math.min(open, close) * (1 - Math.random() * 0.01)
      const volume = Math.floor(Math.random() * 10000000) + 1000000

      data.push({
        date: current.toISOString().split("T")[0],
        open: Math.round(open),
        high: Math.round(high),
        low: Math.round(low),
        close: Math.round(close),
        volume,
        adjusted_close: Math.round(close),
      })

      currentPrice = close
    }

    current.setDate(current.getDate() + 1)
  }

  return data
}

// Alternative: Fetch real historical data from Yahoo Finance
async function fetchRealHistoricalData(
  ticker: string,
  startDate: string,
  endDate: string,
): Promise<HistoricalDataPoint[] | null> {
  try {
    const start = Math.floor(new Date(startDate).getTime() / 1000)
    const end = Math.floor(new Date(endDate).getTime() / 1000)

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.JK?period1=${start}&period2=${end}&interval=1d&includePrePost=true&events=div%2Csplit`,
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const result = data.chart?.result?.[0]

    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      return null
    }

    const timestamps = result.timestamp
    const quote = result.indicators.quote[0]
    const adjClose = result.indicators.adjclose?.[0]?.adjclose || quote.close

    const historicalData: HistoricalDataPoint[] = []

    for (let i = 0; i < timestamps.length; i++) {
      if (quote.close[i] !== null) {
        historicalData.push({
          date: new Date(timestamps[i] * 1000).toISOString().split("T")[0],
          open: quote.open[i] || quote.close[i],
          high: quote.high[i] || quote.close[i],
          low: quote.low[i] || quote.close[i],
          close: quote.close[i],
          volume: quote.volume[i] || 0,
          adjusted_close: adjClose[i] || quote.close[i],
        })
      }
    }

    return historicalData
  } catch (error) {
    console.error(`Error fetching historical data for ${ticker}:`, error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticker = searchParams.get("ticker")
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    if (!ticker) {
      return NextResponse.json({ error: "Ticker parameter is required" }, { status: 400 })
    }

    if (!start || !end) {
      return NextResponse.json({ error: "Start and end date parameters are required" }, { status: 400 })
    }

    // Validate date format
    const startDate = new Date(start)
    const endDate = new Date(end)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 })
    }

    if (startDate >= endDate) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 })
    }

    // Check if stock exists in our database
    const { data: stock, error: stockError } = await supabase
      .from("stocks")
      .select("symbol, company_name")
      .eq("symbol", ticker.toUpperCase())
      .single()

    if (stockError || !stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 })
    }

    // Try to fetch real historical data first
    let historicalData = await fetchRealHistoricalData(ticker.toUpperCase(), start, end)

    // If real data fails, use generated data
    if (!historicalData || historicalData.length === 0) {
      console.log(`Using generated data for ${ticker}`)
      historicalData = generateHistoricalData(ticker.toUpperCase(), start, end)
    }

    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      company_name: stock.company_name,
      start_date: start,
      end_date: end,
      data: historicalData,
      count: historicalData.length,
    })
  } catch (error) {
    console.error("Historical data API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
