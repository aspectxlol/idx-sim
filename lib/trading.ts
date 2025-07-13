import { createClient } from "@supabase/supabase-js"
// Add real-time price fetching to trading functions
import { fetchRealStockPrice } from "./stock-data-fetcher"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface Stock {
  id: string
  symbol: string
  name: string
  sector: string
  current_price: number
  previous_close: number
  volume: number
  market_cap: number
  change: number
  change_percent: number
}

export interface Portfolio {
  id: string
  symbol: string
  quantity: number
  average_price: number
  total_value: number
  current_price: number
  unrealized_pnl: number
  unrealized_pnl_percent: number
}

export interface Transaction {
  id: string
  symbol: string
  type: "BUY" | "SELL"
  quantity: number
  price: number
  total_amount: number
  status: string
  created_at: string
}

// Update the getAllStocks function to fetch real prices
export async function getAllStocks(): Promise<Stock[]> {
  const { data, error } = await supabase.from("stocks").select("*").order("symbol")

  if (error) throw error

  // Optionally fetch real-time prices for active trading hours
  const isMarketHours = isIDXMarketOpen()

  return data.map((stock) => ({
    ...stock,
    change: stock.current_price - stock.previous_close,
    change_percent: ((stock.current_price - stock.previous_close) / stock.previous_close) * 100,
    is_market_open: isMarketHours,
  }))
}

// Helper function to check if IDX market is open
function isIDXMarketOpen(): boolean {
  const now = new Date()
  const jakartaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
  const day = jakartaTime.getDay() // 0 = Sunday, 1 = Monday, etc.
  const hour = jakartaTime.getHours()
  const minute = jakartaTime.getMinutes()
  const timeInMinutes = hour * 60 + minute

  // IDX trading hours: Monday-Friday, 9:00 AM - 4:00 PM Jakarta time
  const isWeekday = day >= 1 && day <= 5
  const isWithinTradingHours = timeInMinutes >= 540 && timeInMinutes <= 960 // 9:00 AM to 4:00 PM

  return isWeekday && isWithinTradingHours
}

export async function getStockBySymbol(symbol: string): Promise<Stock | null> {
  const { data, error } = await supabase.from("stocks").select("*").eq("symbol", symbol).single()

  if (error || !data) return null

  return {
    ...data,
    change: data.current_price - data.previous_close,
    change_percent: ((data.current_price - data.previous_close) / data.previous_close) * 100,
  }
}

export async function getUserPortfolio(userId: string): Promise<Portfolio[]> {
  const { data, error } = await supabase
    .from("portfolios")
    .select(`
      *,
      stocks!inner(current_price)
    `)
    .eq("user_id", userId)
    .gt("quantity", 0)

  if (error) throw error

  return data.map((item) => {
    const currentPrice = item.stocks.current_price
    const currentValue = item.quantity * currentPrice
    const unrealizedPnl = currentValue - item.total_value
    const unrealizedPnlPercent = (unrealizedPnl / item.total_value) * 100

    return {
      id: item.id,
      symbol: item.symbol,
      quantity: item.quantity,
      average_price: item.average_price,
      total_value: item.total_value,
      current_price: currentPrice,
      unrealized_pnl: unrealizedPnl,
      unrealized_pnl_percent: unrealizedPnlPercent,
    }
  })
}

export async function getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Update executeTrade to use real-time prices during market hours
export async function executeTrade(
  userId: string,
  symbol: string,
  type: "BUY" | "SELL",
  quantity: number,
): Promise<{ success: boolean; message: string; transaction?: Transaction }> {
  // Get stock info - fetch real-time price if market is open
  const stock = await getStockBySymbol(symbol)
  if (!stock) {
    return { success: false, message: "Stock not found" }
  }

  // Fetch real-time price if market is open
  if (isIDXMarketOpen()) {
    const realTimePrice = await fetchRealStockPrice(symbol)
    if (realTimePrice) {
      // Update stock with real-time price
      await supabase
        .from("stocks")
        .update({
          current_price: realTimePrice.current_price,
          previous_close: realTimePrice.previous_close,
          volume: realTimePrice.volume,
          updated_at: new Date().toISOString(),
        })
        .eq("symbol", symbol)

      // Use real-time price for trading
      stock.current_price = realTimePrice.current_price
    }
  }

  const totalAmount = quantity * stock.current_price

  // Rest of the trading logic remains the same...
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("virtual_balance")
    .eq("id", userId)
    .single()

  if (userError || !user) {
    return { success: false, message: "User not found" }
  }

  if (type === "BUY") {
    if (user.virtual_balance < totalAmount) {
      return { success: false, message: "Insufficient balance" }
    }

    await supabase
      .from("users")
      .update({ virtual_balance: user.virtual_balance - totalAmount })
      .eq("id", userId)

    const { data: existingPortfolio } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", userId)
      .eq("stock_id", stock.id)
      .single()

    if (existingPortfolio) {
      const newQuantity = existingPortfolio.quantity + quantity
      const newTotalValue = existingPortfolio.total_value + totalAmount
      const newAveragePrice = newTotalValue / newQuantity

      await supabase
        .from("portfolios")
        .update({
          quantity: newQuantity,
          average_price: newAveragePrice,
          total_value: newTotalValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPortfolio.id)
    } else {
      await supabase.from("portfolios").insert({
        user_id: userId,
        stock_id: stock.id,
        symbol: symbol,
        quantity: quantity,
        average_price: stock.current_price,
        total_value: totalAmount,
      })
    }
  } else {
    const { data: portfolio } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", userId)
      .eq("stock_id", stock.id)
      .single()

    if (!portfolio || portfolio.quantity < quantity) {
      return { success: false, message: "Insufficient shares" }
    }

    await supabase
      .from("users")
      .update({ virtual_balance: user.virtual_balance + totalAmount })
      .eq("id", userId)

    const newQuantity = portfolio.quantity - quantity
    if (newQuantity === 0) {
      await supabase.from("portfolios").delete().eq("id", portfolio.id)
    } else {
      const soldValue = (quantity / portfolio.quantity) * portfolio.total_value
      const newTotalValue = portfolio.total_value - soldValue

      await supabase
        .from("portfolios")
        .update({
          quantity: newQuantity,
          total_value: newTotalValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", portfolio.id)
    }
  }

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      stock_id: stock.id,
      symbol: symbol,
      type: type,
      quantity: quantity,
      price: stock.current_price,
      total_amount: totalAmount,
      status: "COMPLETED",
    })
    .select()
    .single()

  if (transactionError) {
    return { success: false, message: "Failed to record transaction" }
  }

  return {
    success: true,
    message: `${type} order executed successfully`,
    transaction,
  }
}
