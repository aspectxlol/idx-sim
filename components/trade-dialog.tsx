"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

interface Stock {
  id: string
  symbol: string
  name: string
  current_price: number
}

interface TradeDialogProps {
  stock: Stock | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTradeComplete: () => void
}

export default function TradeDialog({ stock, open, onOpenChange, onTradeComplete }: TradeDialogProps) {
  const [quantity, setQuantity] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleTrade = async (type: "BUY" | "SELL") => {
    if (!stock || !quantity) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: stock.symbol,
          type,
          quantity: Number.parseInt(quantity),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setQuantity("")
        setTimeout(() => {
          onTradeComplete()
          setSuccess("")
        }, 2000)
      } else {
        setError(data.error || "Trade failed")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const totalValue = stock && quantity ? stock.current_price * Number.parseInt(quantity || "0") : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trade {stock?.symbol}</DialogTitle>
          <DialogDescription>
            {stock?.name} - {stock ? formatCurrency(stock.current_price) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              min="1"
            />
          </div>

          {quantity && stock && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Price per share:</span>
                <span>{formatCurrency(stock.current_price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Quantity:</span>
                <span>{quantity}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                <span>Total:</span>
                <span>{formatCurrency(totalValue)}</span>
              </div>
            </div>
          )}

          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-4">
              <Button
                onClick={() => handleTrade("BUY")}
                disabled={!quantity || loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buy {quantity} shares
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4">
              <Button
                onClick={() => handleTrade("SELL")}
                disabled={!quantity || loading}
                variant="destructive"
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sell {quantity} shares
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
