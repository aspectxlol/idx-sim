"use client"

// Add real-time price updates and market status indicator
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Add market status indicator to the stock list
const MarketStatusBadge = () => {
  const [isMarketOpen, setIsMarketOpen] = useState(false)

  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date()
      const jakartaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
      const day = jakartaTime.getDay()
      const hour = jakartaTime.getHours()
      const minute = jakartaTime.getMinutes()
      const timeInMinutes = hour * 60 + minute

      const isWeekday = day >= 1 && day <= 5
      const isWithinTradingHours = timeInMinutes >= 540 && timeInMinutes <= 960

      setIsMarketOpen(isWeekday && isWithinTradingHours)
    }

    checkMarketStatus()
    const interval = setInterval(checkMarketStatus, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <Badge variant={isMarketOpen ? "default" : "secondary"} className="mb-4">
      IDX Market: {isMarketOpen ? "OPEN" : "CLOSED"}
    </Badge>
  )
}

// Add this component to the top of your stock list
// Also add a refresh button to manually update prices
const RefreshPricesButton = ({ onRefresh }: { onRefresh: () => void }) => {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch("/api/stocks/update-prices", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error("Failed to refresh prices:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
      {isRefreshing ? "Updating..." : "Refresh Prices"}
    </Button>
  )
}

export { MarketStatusBadge, RefreshPricesButton }
