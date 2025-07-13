// Real-time stock data fetcher for IDX stocks
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface YahooFinanceQuote {
  symbol: string
  regularMarketPrice: number
  regularMarketPreviousClose: number
  regularMarketVolume: number
  marketCap: number
  regularMarketChange: number
  regularMarketChangePercent: number
}

interface StockPrice {
  symbol: string
  current_price: number
  previous_close: number
  volume: number
  market_cap: number
  change: number
  change_percent: number
}

// Yahoo Finance API endpoint (unofficial but free)
const YAHOO_FINANCE_API = "https://query1.finance.yahoo.com/v8/finance/chart"

// IDX stocks need .JK suffix for Yahoo Finance
const IDX_SUFFIX = ".JK"

export async function fetchRealStockPrice(symbol: string): Promise<StockPrice | null> {
  try {
    const yahooSymbol = `${symbol}${IDX_SUFFIX}`
    const response = await fetch(`${YAHOO_FINANCE_API}/${yahooSymbol}`)

    if (!response.ok) {
      console.error(`Failed to fetch ${symbol}: ${response.status}`)
      return null
    }

    const data = await response.json()
    const result = data.chart?.result?.[0]

    if (!result) {
      console.error(`No data found for ${symbol}`)
      return null
    }

    const meta = result.meta
    const currentPrice = meta.regularMarketPrice || meta.previousClose || 0
    const previousClose = meta.previousClose || currentPrice
    const volume = meta.regularMarketVolume || 0
    const marketCap = meta.marketCap || 0

    return {
      symbol,
      current_price: currentPrice,
      previous_close: previousClose,
      volume,
      market_cap: marketCap,
      change: currentPrice - previousClose,
      change_percent: previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0,
    }
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error)
    return null
  }
}

export async function fetchMultipleStockPrices(symbols: string[]): Promise<StockPrice[]> {
  const promises = symbols.map((symbol) => fetchRealStockPrice(symbol))
  const results = await Promise.allSettled(promises)

  return results
    .filter(
      (result): result is PromiseFulfilledResult<StockPrice> => result.status === "fulfilled" && result.value !== null,
    )
    .map((result) => result.value)
}

export async function updateAllStockPrices(): Promise<void> {
  try {
    // Get all stock symbols from database
    const { data: stocks, error } = await supabase.from("stocks").select("symbol")

    if (error) {
      console.error("Error fetching stock symbols:", error)
      return
    }

    const symbols = stocks.map((stock) => stock.symbol)
    console.log(`Updating prices for ${symbols.length} stocks...`)

    // Fetch real prices in batches to avoid rate limiting
    const batchSize = 5
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize)
      const prices = await fetchMultipleStockPrices(batch)

      // Update database with real prices
      for (const price of prices) {
        await supabase
          .from("stocks")
          .update({
            current_price: price.current_price,
            previous_close: price.previous_close,
            volume: price.volume,
            market_cap: price.market_cap,
            updated_at: new Date().toISOString(),
          })
          .eq("symbol", price.symbol)
      }

      // Wait between batches to respect rate limits
      if (i + batchSize < symbols.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    console.log("Stock prices updated successfully")
  } catch (error) {
    console.error("Error updating stock prices:", error)
  }
}

// Alternative: Finnhub API (requires API key but more reliable)
export async function fetchStockPriceFromFinnhub(symbol: string): Promise<StockPrice | null> {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    console.warn("FINNHUB_API_KEY not set, using Yahoo Finance fallback")
    return fetchRealStockPrice(symbol)
  }

  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}.JK&token=${apiKey}`)

    if (!response.ok) {
      return fetchRealStockPrice(symbol) // Fallback to Yahoo Finance
    }

    const data = await response.json()

    return {
      symbol,
      current_price: data.c || 0, // Current price
      previous_close: data.pc || 0, // Previous close
      volume: 0, // Finnhub doesn't provide volume in quote endpoint
      market_cap: 0, // Would need separate API call
      change: data.d || 0, // Change
      change_percent: data.dp || 0, // Change percent
    }
  } catch (error) {
    console.error(`Finnhub API error for ${symbol}:`, error)
    return fetchRealStockPrice(symbol) // Fallback to Yahoo Finance
  }
}
