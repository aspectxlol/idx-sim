"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, TrendingDown, Search } from "lucide-react"
import TradeDialog from "./trade-dialog"

interface Stock {
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

export default function StockList() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false)

  useEffect(() => {
    fetchStocks()
  }, [])

  useEffect(() => {
    const filtered = stocks.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredStocks(filtered)
  }, [stocks, searchTerm])

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
        setStocks(data.stocks)
        setFilteredStocks(data.stocks)
      } else {
        setError("Failed to fetch stocks")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
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
    if (num >= 1e12) return (num / 1e12).toFixed(1) + "T"
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B"
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M"
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K"
    return num.toString()
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
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>IDX Stocks</CardTitle>
          <CardDescription>Live stock prices from Indonesia Stock Exchange</CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search stocks by symbol or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {filteredStocks.map((stock) => (
              <div key={stock.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{stock.symbol}</h3>
                    <Badge variant="secondary">{stock.sector}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{stock.name}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Volume: {formatNumber(stock.volume)}</span>
                    <span>Market Cap: {formatCurrency(stock.market_cap)}</span>
                  </div>
                </div>

                <div className="text-right mr-4">
                  <div className="text-xl font-bold">{formatCurrency(stock.current_price)}</div>
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      stock.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stock.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>
                      {stock.change >= 0 ? "+" : ""}
                      {formatCurrency(stock.change)}({stock.change_percent >= 0 ? "+" : ""}
                      {stock.change_percent.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleTrade(stock)} className="bg-green-600 hover:bg-green-700">
                    Buy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTrade(stock)}
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    Sell
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <TradeDialog
        stock={selectedStock}
        open={tradeDialogOpen}
        onOpenChange={setTradeDialogOpen}
        onTradeComplete={() => {
          setTradeDialogOpen(false)
          // Refresh data if needed
        }}
      />
    </div>
  )
}
