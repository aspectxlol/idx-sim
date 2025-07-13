import { NextResponse } from "next/server"

const API_DOCS = {
  title: "IDX Trading Simulator API",
  version: "1.0.0",
  description: "API for trading Indonesian stocks with virtual money",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  authentication: {
    type: "Bearer Token or API Key",
    description: "Use JWT token in Authorization header or API key in X-API-Key header",
  },
  rateLimits: {
    general: "1000 requests per day",
    trading: "500 trades per day",
  },
  endpoints: {
    authentication: {
      "POST /api/auth/register": {
        description: "Register a new user",
        body: {
          email: "string",
          password: "string (min 6 chars)",
          name: "string",
        },
        response: {
          message: "string",
          user: {
            id: "string",
            email: "string",
            name: "string",
            virtual_balance: "number",
          },
        },
      },
      "POST /api/auth/login": {
        description: "Login user",
        body: {
          email: "string",
          password: "string",
        },
        response: {
          message: "string",
          user: "object",
        },
      },
    },
    stocks: {
      "GET /api/stocks": {
        description: "Get all stocks or specific stock",
        parameters: {
          symbol: "string (optional) - Stock symbol like BBCA",
        },
        response: {
          stocks: "array of stock objects",
        },
      },
      "GET /api/v1/stocks/history": {
        description: "Get historical stock data",
        parameters: {
          ticker: "string (required) - Stock symbol like BBCA",
          start: "string (required) - Start date in YYYY-MM-DD format",
          end: "string (required) - End date in YYYY-MM-DD format",
        },
        example: "/api/v1/stocks/history?ticker=BBCA&start=2023-01-01&end=2024-12-31",
        response: {
          ticker: "string",
          company_name: "string",
          start_date: "string",
          end_date: "string",
          data: [
            {
              date: "string",
              open: "number",
              high: "number",
              low: "number",
              close: "number",
              volume: "number",
              adjusted_close: "number",
            },
          ],
          count: "number",
        },
      },
    },
    trading: {
      "POST /api/trade": {
        description: "Execute a trade (buy/sell)",
        headers: {
          Authorization: "Bearer <jwt_token>",
          "X-API-Key": "<api_key> (alternative)",
        },
        body: {
          symbol: "string - Stock symbol like BBCA",
          type: "string - BUY or SELL",
          quantity: "number - Number of shares",
        },
        response: {
          message: "string",
          trade: {
            symbol: "string",
            type: "string",
            quantity: "number",
            price: "number",
            total_value: "number",
          },
        },
      },
    },
    portfolio: {
      "GET /api/portfolio": {
        description: "Get user portfolio",
        headers: {
          Authorization: "Bearer <jwt_token>",
        },
        response: {
          holdings: "array of holdings",
          summary: {
            total_value: "number",
            total_cost: "number",
            total_unrealized_pnl: "number",
            total_unrealized_pnl_percent: "number",
            holdings_count: "number",
          },
        },
      },
    },
    transactions: {
      "GET /api/transactions": {
        description: "Get transaction history",
        parameters: {
          limit: "number (optional, default 50)",
          offset: "number (optional, default 0)",
          type: "string (optional) - BUY or SELL",
        },
        response: {
          transactions: "array of transactions",
          pagination: "object",
        },
      },
    },
    apiKey: {
      "POST /api/user/api-key": {
        description: "Generate new API key",
        response: {
          message: "string",
          api_key: "string",
        },
      },
      "DELETE /api/user/api-key": {
        description: "Revoke API key",
        response: {
          message: "string",
        },
      },
      "GET /api/user/api-key": {
        description: "Get current API key",
        response: {
          api_key: "string",
          has_key: "boolean",
        },
      },
    },
  },
  examples: {
    "Trading with API Key": {
      description: "Example of buying stocks using API key",
      curl: `curl -X POST "${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/trade" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{"symbol": "BBCA", "type": "BUY", "quantity": 100}'`,
    },
    "Get Historical Data": {
      description: "Example of fetching historical stock data",
      curl: `curl "${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/v1/stocks/history?ticker=BBCA&start=2023-01-01&end=2024-12-31"`,
    },
  },
}

export async function GET() {
  return NextResponse.json(API_DOCS, {
    headers: {
      "Content-Type": "application/json",
    },
  })
}
