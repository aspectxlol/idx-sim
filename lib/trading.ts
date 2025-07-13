import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface Stock {
  id: string
  symbol: string
  company_name: string
  current_price: number
  previous_close: number
  change_percent: number
  volume: number
  market_cap: number
  sector: string
  updated_at: string
}

export interface Portfolio {
  id: string
  user_id: string
  stock_id: string
  quantity: number
  average_price: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  stock_id: string
  type: "BUY" | "SELL"
  quantity: number
  price: number
  total_value: number
  created_at: string
}

export async function getStockBySymbol(symbol: string): Promise<Stock | null> {
  const { data, error } = await supabase.from("stocks").select("*").eq("symbol", symbol.toUpperCase()).single()

  if (error || !data) return null
  return data
}

export async function getAllStocks(): Promise<Stock[]> {
  const { data, error } = await supabase.from("stocks").select("*").order("symbol")

  if (error) return []
  return data || []
}

export async function getUserPortfolio(userId: string): Promise<Portfolio[]> {
  const { data, error } = await supabase.from("portfolio").select("*").eq("user_id", userId).gt("quantity", 0)

  if (error) return []
  return data || []
}

export async function getUserTransactions(userId: string, limit = 50, offset = 0): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return []
  return data || []
}

export function calculatePortfolioMetrics(holdings: any[], stocks: Stock[]) {
  let totalValue = 0
  let totalCost = 0

  const enrichedHoldings = holdings.map((holding) => {
    const stock = stocks.find((s) => s.id === holding.stock_id)
    if (!stock) return holding

    const currentValue = holding.quantity * stock.current_price
    const cost = holding.quantity * holding.average_price
    const unrealizedPnL = currentValue - cost
    const unrealizedPnLPercent = cost > 0 ? (unrealizedPnL / cost) * 100 : 0

    totalValue += currentValue
    totalCost += cost

    return {
      ...holding,
      stock,
      current_value: currentValue,
      total_cost: cost,
      unrealized_pnl: unrealizedPnL,
      unrealized_pnl_percent: unrealizedPnLPercent,
    }
  })

  const totalUnrealizedPnL = totalValue - totalCost
  const totalUnrealizedPnLPercent = totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0

  return {
    holdings: enrichedHoldings,
    summary: {
      total_value: totalValue,
      total_cost: totalCost,
      total_unrealized_pnl: totalUnrealizedPnL,
      total_unrealized_pnl_percent: totalUnrealizedPnLPercent,
    },
  }
}
