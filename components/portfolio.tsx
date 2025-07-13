"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, TrendingDown } from "lucide-react"

interface PortfolioItem {
  id: string
  symbol: string
  quantity: number
  average_price: number
  total_value: number
  current_price: number
  unrealized_pnl: number
  unrealized_pnl_percent: number
}

interface PortfolioData {
  user: {
    virtual_balance: number
    total_portfolio_value: number
    total_unrealized_pnl: number
  }
  portfolio: PortfolioItem[]
}

export default function Portfolio() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/portfolio", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPortfolioData(data)
      } else {
        setError("Failed to fetch portfolio")
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">Loading portfolio...</div>
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
          <CardTitle>Your Portfolio</CardTitle>
          <CardDescription>Current holdings and performance</CardDescription>
        </CardHeader>
        <CardContent>
          {!portfolioData?.portfolio.length ? (
            <div className="text-center py-8 text-gray-500">
              No holdings yet. Start trading to build your portfolio!
            </div>
          ) : (
            <div className="space-y-4">
              {portfolioData.portfolio.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{item.symbol}</h3>
                      <Badge variant="outline">{item.quantity} shares</Badge>
                    </div>
                    <div className="text-sm text-gray-600">Avg. Price: {formatCurrency(item.average_price)}</div>
                  </div>

                  <div className="text-right mr-4">
                    <div className="text-lg font-semibold">{formatCurrency(item.current_price)}</div>
                    <div className="text-sm text-gray-600">
                      Current Value: {formatCurrency(item.quantity * item.current_price)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`flex items-center gap-1 text-sm font-medium ${
                        item.unrealized_pnl >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {item.unrealized_pnl >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>
                        {item.unrealized_pnl >= 0 ? "+" : ""}
                        {formatCurrency(item.unrealized_pnl)}
                      </span>
                    </div>
                    <div className={`text-xs ${item.unrealized_pnl_percent >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {item.unrealized_pnl_percent >= 0 ? "+" : ""}
                      {item.unrealized_pnl_percent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
