import { NextResponse } from "next/server"

export async function GET() {
  const apiDocs = {
    title: "IDX Trading Simulator API",
    version: "1.0.0",
    description: "Complete API for programmatic trading on Indonesia Stock Exchange simulator",
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    authentication: {
      type: "API Key",
      header: "X-API-Key",
      description: "Generate your API key from the dashboard",
    },
    rateLimits: {
      general: "1000 requests per day",
      trading: "500 trades per day",
    },
    endpoints: {
      stocks: {
        "GET /api/stocks": {
          description: "Get all available stocks",
          parameters: {
            symbol: "Optional. Get specific stock by symbol",
          },
          example: "GET /api/stocks?symbol=BBCA",
        },
      },
      portfolio: {
        "GET /api/portfolio": {
          description: "Get user's portfolio and holdings",
          authentication: "Required",
          response: {
            user: {
              virtual_balance: "number",
              total_portfolio_value: "number",
              total_unrealized_pnl: "number",
            },
            holdings: "array of holdings with current values",
          },
        },
      },
      trading: {
        "POST /api/trade": {
          description: "Execute a trade (buy/sell)",
          authentication: "Required",
          body: {
            symbol: "string (required) - Stock symbol",
            type: "string (required) - BUY or SELL",
            quantity: "number (required) - Number of shares",
          },
          example: {
            symbol: "BBCA",
            type: "BUY",
            quantity: 100,
          },
        },
      },
      transactions: {
        "GET /api/transactions": {
          description: "Get transaction history",
          authentication: "Required",
          parameters: {
            limit: "Optional. Number of transactions (default: 50)",
            offset: "Optional. Pagination offset (default: 0)",
          },
        },
      },
      apiKeys: {
        "POST /api/user/api-key": {
          description: "Generate new API key",
          authentication: "Required (JWT only)",
        },
        "DELETE /api/user/api-key": {
          description: "Revoke current API key",
          authentication: "Required (JWT only)",
        },
      },
    },
    examples: {
      curl: {
        getStocks: `curl -H "X-API-Key: your_api_key" "${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stocks"`,
        executeTrade: `curl -X POST -H "Content-Type: application/json" -H "X-API-Key: your_api_key" -d '{"symbol":"BBCA","type":"BUY","quantity":100}' "${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/trade"`,
        getPortfolio: `curl -H "X-API-Key: your_api_key" "${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/portfolio"`,
      },
      javascript: {
        executeTrade: `
const response = await fetch('/api/trade', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key_here'
  },
  body: JSON.stringify({
    symbol: 'BBCA',
    type: 'BUY',
    quantity: 100
  })
});
const result = await response.json();`,
      },
    },
  }

  return NextResponse.json(apiDocs, {
    headers: {
      "Content-Type": "application/json",
    },
  })
}
