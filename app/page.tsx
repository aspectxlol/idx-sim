"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Shield, Zap, Code } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">IDX Trading Simulator</h1>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Trade Indonesian Stocks with Virtual Money</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Practice trading IDX stocks risk-free with our comprehensive simulator. Perfect for learning, testing
            strategies, or building AI trading bots.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Start Trading Now
              </Button>
            </Link>
            <Link href="/api/docs" target="_blank">
              <Button size="lg" variant="outline" className="px-8 bg-transparent">
                View API Docs
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Real IDX Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Trade with real Indonesian stock market data including BBCA, BBRI, TLKM, and more.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Risk-Free Trading</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Start with virtual money and practice trading strategies without financial risk.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Code className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>API for Bots</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Well-documented REST API with authentication for building AI trading bots.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Mobile Friendly</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Responsive design that works perfectly on desktop, tablet, and mobile devices.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Perfect for AI Trading Bot Development</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Secure API Access</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• JWT and API key authentication</li>
                <li>• Rate limiting and HTTPS encryption</li>
                <li>• Per-account data isolation</li>
                <li>• Easy key generation and revocation</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Comprehensive Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Real-time stock price data</li>
                <li>• Portfolio management</li>
                <li>• Transaction history</li>
                <li>• Market and limit orders</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Trading?</h2>
          <p className="text-gray-600 mb-8">Join thousands of traders practicing with our simulator</p>
          <Link href="/register">
            <Button size="lg" className="px-12">
              Create Free Account
            </Button>
          </Link>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 IDX Trading Simulator. Built for educational purposes.</p>
        </div>
      </footer>
    </div>
  )
}
