"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react"
import { TradeDialog } from "./trade-dialog"

interface Stock {
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

export function StockList() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState("")
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false)

  useEffect(() => {
    fetchStocks()
  }, [])

  const fetchStocks = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/stocks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStocks(data.stocks || [])
      } else {
        setError("Failed to fetch stocks")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const updatePrices = async () => {
    setUpdating(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/stocks/update-prices", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await fetchStocks() // Refresh the stock list
      } else {
        setError("Failed to update prices")
      }
    } catch (err) {
      setError("Failed to update prices")
    } finally {
      setUpdating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("id-ID").format(num)
  }

  const handleTrade = (stock: Stock) => {
    setSelectedStock(stock)
    setTradeDialogOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">Loading stocks...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">IDX Stocks</h2>
          <p className="text-gray-600">Real-time prices from Indonesia Stock Exchange</p>
        </div>
        <Button onClick={updatePrices} disabled={updating} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${updating ? "animate-spin" : ""}`} />
          Update Prices
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stocks.map((stock) => (
          <Card key={stock.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{stock.symbol}</CardTitle>
                  <CardDescription className="text-sm">{stock.company_name}</CardDescription>
                </div>
                <Badge variant="secondary">{stock.sector}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(stock.current_price)}</div>
                  <div
                    className={`flex items-center text-sm ${
                      stock.change_percent >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stock.change_percent >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {stock.change_percent >= 0 ? "+" : ""}
                    {stock.change_percent.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Previous Close:</span>
                  <div className="font-medium">{formatCurrency(stock.previous_close)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Volume:</span>
                  <div className="font-medium">{formatNumber(stock.volume)}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleTrade(stock)} className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
                  Buy
                </Button>
                <Button onClick={() => handleTrade(stock)} variant="outline" className="flex-1" size="sm">
                  Sell
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedStock && (
        <TradeDialog
          stock={selectedStock}
          open={tradeDialogOpen}
          onOpenChange={setTradeDialogOpen}
          onTradeComplete={fetchStocks}
        />
      )}
    </div>
  )
}
