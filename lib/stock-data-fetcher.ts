interface YahooFinanceResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number
        previousClose: number
        regularMarketVolume: number
      }
    }>
  }
}

interface FinnhubResponse {
  c: number // current price
  pc: number // previous close
  o: number // open
  h: number // high
  l: number // low
}

export async function fetchStockPrice(symbol: string): Promise<{
  current_price: number
  previous_close: number
  change_percent: number
  volume: number
} | null> {
  try {
    // Try Yahoo Finance first (free, no API key needed)
    const yahooResponse = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.JK?interval=1d&range=1d`,
    )

    if (yahooResponse.ok) {
      const data: YahooFinanceResponse = await yahooResponse.json()
      const result = data.chart.result[0]

      if (result && result.meta) {
        const currentPrice = result.meta.regularMarketPrice
        const previousClose = result.meta.previousClose
        const changePercent = ((currentPrice - previousClose) / previousClose) * 100

        return {
          current_price: currentPrice,
          previous_close: previousClose,
          change_percent: changePercent,
          volume: result.meta.regularMarketVolume || 0,
        }
      }
    }
  } catch (error) {
    console.log(`Yahoo Finance failed for ${symbol}, trying Finnhub...`)
  }

  // Fallback to Finnhub if available
  if (process.env.FINNHUB_API_KEY) {
    try {
      const finnhubResponse = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}.JK&token=${process.env.FINNHUB_API_KEY}`,
      )

      if (finnhubResponse.ok) {
        const data: FinnhubResponse = await finnhubResponse.json()

        if (data.c && data.pc) {
          const changePercent = ((data.c - data.pc) / data.pc) * 100

          return {
            current_price: data.c,
            previous_close: data.pc,
            change_percent: changePercent,
            volume: 0, // Finnhub doesn't provide volume in quote endpoint
          }
        }
      }
    } catch (error) {
      console.log(`Finnhub failed for ${symbol}`)
    }
  }

  return null
}

export async function updateStockPrices(symbols: string[]): Promise<{
  updated: number
  failed: string[]
}> {
  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const priceData = await fetchStockPrice(symbol)
      return { symbol, priceData }
    }),
  )

  let updated = 0
  const failed: string[] = []

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.priceData) {
      updated++
    } else if (result.status === "fulfilled") {
      failed.push(result.value.symbol)
    } else {
      failed.push("unknown")
    }
  }

  return { updated, failed }
}

export function isMarketOpen(): boolean {
  const now = new Date()
  const jakartaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))

  const day = jakartaTime.getDay() // 0 = Sunday, 1 = Monday, etc.
  const hour = jakartaTime.getHours()
  const minute = jakartaTime.getMinutes()
  const timeInMinutes = hour * 60 + minute

  // IDX is closed on weekends
  if (day === 0 || day === 6) {
    return false
  }

  // IDX trading hours: 9:00 AM - 4:00 PM Jakarta time
  const marketOpen = 9 * 60 // 9:00 AM
  const marketClose = 16 * 60 // 4:00 PM

  return timeInMinutes >= marketOpen && timeInMinutes < marketClose
}
