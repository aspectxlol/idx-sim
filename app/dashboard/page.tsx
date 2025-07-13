"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, LogOut } from "lucide-react"
import { StockList } from "@/components/stock-list"
import Portfolio from "@/components/portfolio"
import TransactionHistory from "@/components/transaction-history"
import ApiKeyManager from "@/components/api-key-manager"

interface User {
  id: string
  email: string
  full_name: string
  virtual_balance: number
  api_key?: string
}

interface PortfolioSummary {
  virtual_balance: number
  total_portfolio_value: number
  total_unrealized_pnl: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(userData))
    fetchPortfolioSummary(token)
  }, [router])

  const fetchPortfolioSummary = async (token: string) => {
    try {
      const response = await fetch("/api/portfolio", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPortfolioSummary(data.user)
      } else if (response.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
      } else {
        setError("Failed to fetch portfolio data")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const totalValue = (portfolioSummary?.virtual_balance || 0) + (portfolioSummary?.total_portfolio_value || 0)
  const totalPnL = portfolioSummary?.total_unrealized_pnl || 0
  const pnlPercent = portfolioSummary?.total_portfolio_value
    ? (totalPnL / portfolioSummary.total_portfolio_value) * 100
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">IDX Trading Simulator</h1>
              <p className="text-sm text-gray-500">Welcome back, {user.full_name}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Virtual Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolioSummary?.virtual_balance || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolioSummary?.total_portfolio_value || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
              {totalPnL >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(totalPnL)}
              </div>
              <p className={`text-xs ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                {pnlPercent >= 0 ? "+" : ""}
                {pnlPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="stocks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stocks">Stocks</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="docs">API Docs</TabsTrigger>
          </TabsList>

          <TabsContent value="stocks">
            <StockList />
          </TabsContent>

          <TabsContent value="portfolio">
            <Portfolio />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionHistory />
          </TabsContent>

          <TabsContent value="api">
            <ApiKeyManager />
          </TabsContent>

          <TabsContent value="docs">
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
                <CardDescription>Complete API documentation for integrating trading bots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Base URL</h3>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api
                    </code>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                    <p className="text-sm text-gray-600 mb-2">Include your API key in the X-API-Key header:</p>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm block">X-API-Key: your_api_key_here</code>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">1. Generate an API key in the API Keys tab</p>
                      <p className="text-sm text-gray-600">2. Use the key to authenticate your requests</p>
                      <p className="text-sm text-gray-600">3. Start trading programmatically!</p>
                    </div>
                  </div>

                  <Button onClick={() => window.open("/api/docs", "_blank")} className="w-full">
                    View Full API Documentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
