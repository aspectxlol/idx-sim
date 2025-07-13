"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Eye, EyeOff, RefreshCw, Trash2 } from "lucide-react"

export default function ApiKeyManager() {
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setApiKey(user.api_key || "")
    }
  }, [])

  const generateApiKey = async () => {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/user/api-key", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setApiKey(data.api_key)
        setMessage("API key generated successfully!")

        // Update user data in localStorage
        const userData = localStorage.getItem("user")
        if (userData) {
          const user = JSON.parse(userData)
          user.api_key = data.api_key
          localStorage.setItem("user", JSON.stringify(user))
        }
      } else {
        setError(data.error || "Failed to generate API key")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const revokeApiKey = async () => {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/user/api-key", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setApiKey("")
        setMessage("API key revoked successfully!")

        // Update user data in localStorage
        const userData = localStorage.getItem("user")
        if (userData) {
          const user = JSON.parse(userData)
          user.api_key = null
          localStorage.setItem("user", JSON.stringify(user))
        }
      } else {
        setError(data.error || "Failed to revoke API key")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey)
    setMessage("API key copied to clipboard!")
    setTimeout(() => setMessage(""), 3000)
  }

  const maskedKey = apiKey ? `${apiKey.substring(0, 8)}${"*".repeat(apiKey.length - 8)}` : ""

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Key Management</CardTitle>
          <CardDescription>Generate and manage your API keys for programmatic trading</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {apiKey ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Your API Key</label>
                <div className="flex gap-2 mt-1">
                  <Input value={showKey ? apiKey : maskedKey} readOnly className="font-mono" />
                  <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={generateApiKey} disabled={loading} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Button onClick={revokeApiKey} disabled={loading} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No API key generated yet</p>
              <Button onClick={generateApiKey} disabled={loading}>
                Generate API Key
              </Button>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Security Notes</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Keep your API key secure and never share it publicly</li>
              <li>• Use HTTPS for all API requests</li>
              <li>• Regenerate your key if you suspect it's been compromised</li>
              <li>• API keys have rate limits to prevent abuse</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
