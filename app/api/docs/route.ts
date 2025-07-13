import { NextResponse } from "next/server"

const API_DOCS = {
  title: "IDX Trading Simulator API",
  version: "1.0.0",
  description: "API for trading Indonesian stocks with virtual money",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  authentication: {
    methods: [
      {
        type: "API Key",
        description: "Include your API key in the X-API-Key header",
        example: "X-API-Key: idx_your_api_key_here",
      },
      {
        type: "JWT Bearer Token",
        description: "Include JWT token in Authorization header",
        example: "Authorization: Bearer your_jwt_token_here",
      },
    ],
  },
  rateLimits: {
    "/api/stocks": "100 requests per minute",
    "/api/portfolio": "60 requests per minute",
    "/api/trade": "30 requests per minute",
    "/api/transactions": "60 requests per minute",
  },
  endpoints: [
    {
      method: "GET",
      path: "/api/stocks",
      description: "Get all available stocks or a specific stock",
      parameters: [
        {
          name: "symbol",
          type: "string",
          required: false,
          description: "Stock symbol (e.g., BBCA)",
        },
      ],
      responses: {
        200: {
          description: "Success",
          example: {
            stocks: [
              {
                id: "uuid",
                symbol: "BBCA",
                name: "Bank Central Asia Tbk",
                sector: "Financial Services",
                current_price: 8750.0,
                previous_close: 8700.0,
                volume: 15420000,
                market_cap: 1068000000000,
                change: 50.0,
                change_percent: 0.57,
              },
            ],
          },
        },
      },
    },
    {
      method: "GET",
      path: "/api/portfolio",
      description: "Get user's portfolio",
      responses: {
        200: {
          description: "Success",
          example: {
            user: {
              virtual_balance: 950000.0,
              total_portfolio_value: 87500.0,
              total_unrealized_pnl: -12500.0,
            },
            portfolio: [
              {
                id: "uuid",
                symbol: "BBCA",
                quantity: 10,
                average_price: 8700.0,
                total_value: 87000.0,
                current_price: 8750.0,
                unrealized_pnl: 500.0,
                unrealized_pnl_percent: 0.57,
              },
            ],
          },
        },
      },
    },
    {
      method: "POST",
      path: "/api/trade",
      description: "Execute a trade order",
      requestBody: {
        symbol: "string (required) - Stock symbol",
        type: "string (required) - BUY or SELL",
        quantity: "number (required) - Number of shares",
      },
      responses: {
        200: {
          description: "Trade executed successfully",
          example: {
            message: "BUY order executed successfully",
            transaction: {
              id: "uuid",
              symbol: "BBCA",
              type: "BUY",
              quantity: 10,
              price: 8750.0,
              total_amount: 87500.0,
              status: "COMPLETED",
              created_at: "2024-01-15T10:30:00Z",
            },
          },
        },
        400: {
          description: "Bad request",
          examples: ["Insufficient balance", "Insufficient shares", "Invalid parameters"],
        },
      },
    },
    {
      method: "GET",
      path: "/api/transactions",
      description: "Get user's transaction history",
      parameters: [
        {
          name: "limit",
          type: "number",
          required: false,
          description: "Number of transactions to return (default: 50)",
        },
      ],
      responses: {
        200: {
          description: "Success",
          example: {
            transactions: [
              {
                id: "uuid",
                symbol: "BBCA",
                type: "BUY",
                quantity: 10,
                price: 8750.0,
                total_amount: 87500.0,
                status: "COMPLETED",
                created_at: "2024-01-15T10:30:00Z",
              },
            ],
          },
        },
      },
    },
    {
      method: "POST",
      path: "/api/user/api-key",
      description: "Generate a new API key",
      responses: {
        200: {
          description: "API key generated",
          example: {
            message: "API key generated successfully",
            api_key: "idx_abc123def456",
          },
        },
      },
    },
    {
      method: "DELETE",
      path: "/api/user/api-key",
      description: "Revoke current API key",
      responses: {
        200: {
          description: "API key revoked",
          example: {
            message: "API key revoked successfully",
          },
        },
      },
    },
  ],
  examples: {
    curl: {
      getStocks: `curl -X GET "${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stocks" \\
  -H "X-API-Key: your_api_key_here"`,
      executeTrade: `curl -X POST "${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/trade" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{
    "symbol": "BBCA",
    "type": "BUY",
    "quantity": 10
  }'`,
    },
    javascript: {
      getStocks: `const response = await fetch('/api/stocks', {
  headers: {
    'X-API-Key': 'your_api_key_here'
  }
});
const data = await response.json();`,
      executeTrade: `const response = await fetch('/api/trade', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key_here'
  },
  body: JSON.stringify({
    symbol: 'BBCA',
    type: 'BUY',
    quantity: 10
  })
});
const data = await response.json();`,
    },
  },
}

export async function GET() {
  return NextResponse.json(API_DOCS)
}
